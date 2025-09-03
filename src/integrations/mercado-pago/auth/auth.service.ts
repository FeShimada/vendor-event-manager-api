import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { randomUUID } from "crypto";

@Injectable()
export class AuthService {

    constructor(private readonly prisma: PrismaService) { }

    private readonly logger = new Logger(AuthService.name);

    async generateAuthUrl(userId: string): Promise<string> {
        try {
            const clientId = process.env.MP_APP_ID;
            const baseUrl = process.env.BASE_URL;

            if (!clientId) {
                throw new Error('MP_APP_ID não configurado no ambiente');
            }

            const state = `${userId}_${randomUUID()}`;

            const redirectUri = `${baseUrl}/integrations/mercado-pago/auth/callback`;

            const authUrl = new URL('https://auth.mercadopago.com/authorization');
            authUrl.searchParams.set('client_id', clientId);
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('platform_id', 'mp');
            authUrl.searchParams.set('state', state);
            authUrl.searchParams.set('redirect_uri', redirectUri);

            this.logger.log(`URL de autenticação gerada com state: ${state}`);

            return authUrl.toString();
        } catch (error) {
            this.logger.error('Erro ao gerar URL de autenticação:', error);
            throw error;
        }
    }

    async handleCallback(code: string, state: string) {
        try {
            const clientId = process.env.MP_APP_ID;
            const clientSecret = process.env.MP_CLIENT_SECRET;
            const baseUrl = process.env.BASE_URL;
            const mpBaseUrl = process.env.MP_BASE_URL;
            const [userId, _randomId] = state.split('_');

            if (!clientId || !clientSecret || !baseUrl || !mpBaseUrl) {
                throw new Error('Configurações do Mercado Pago não encontradas');
            }

            const body = {
                client_secret: clientSecret,
                client_id: clientId,
                grant_type: 'authorization_code',
                code,
                redirect_uri: `${baseUrl}/integrations/mercado-pago/auth/callback`,
                test_token: 'true'
            };

            const response = await fetch(`${mpBaseUrl}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: new URLSearchParams(body).toString(),
            });

            if (!response.ok) {
                const errorData = await response.text();
                this.logger.error(
                    `Erro na API do Mercado Pago: ${response.status} - ${errorData}`,
                );

                throw new Error(`Erro na API do Mercado Pago: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            this.logger.log(`Token de acesso do Mercado Pago: ${data.access_token}`);
            this.logger.log(`Token de refresh do Mercado Pago: ${data.refresh_token}`);
            this.logger.log(`Token de teste do Mercado Pago: ${data.test_token}`);

            const expiresAt = new Date(Date.now() + data.expires_in * 1000);

            return await this.prisma.mercadoPagoAccount.upsert({
                where: { userId },
                update: {
                    mpUserId: String(data.user_id),
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    expiresAt,
                    publicKey: data.public_key,
                    liveMode: data.live_mode,
                },
                create: {
                    userId,
                    mpUserId: String(data.user_id),
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    expiresAt,
                    publicKey: data.public_key,
                    liveMode: data.live_mode,
                },
            });

        } catch (error) {
            this.logger.error('Erro ao processar callback:', error);
            throw error;
        }
    }

    async getAccessToken(userId: string) {
        const mercadoPagoAccount = await this.prisma.mercadoPagoAccount.findUnique({
            where: { userId },
        });

        if (!mercadoPagoAccount) {
            throw new Error('Conta do Mercado Pago não encontrada');
        }

        const now = new Date();

        if (mercadoPagoAccount.expiresAt < now) {
            const refreshedToken = await this.refreshToken(mercadoPagoAccount.refreshToken, userId);
            return refreshedToken.access_token;
        }

        return mercadoPagoAccount.accessToken;
    }

    async refreshToken(refreshToken: string, userId: string) {
        try {
            const clientId = process.env.MP_APP_ID;
            const clientSecret = process.env.MP_CLIENT_SECRET;
            const mpBaseUrl = process.env.MP_BASE_URL;

            if (!clientId || !clientSecret || !mpBaseUrl) {
                throw new Error('Configurações do Mercado Pago não encontradas');
            }

            const body = {
                client_secret: clientSecret,
                client_id: clientId,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            };

            const response = await fetch(`${mpBaseUrl}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: new URLSearchParams(body).toString(),
            });

            if (!response.ok) {
                const errorData = await response.text();
                this.logger.error(
                    `Erro na API do Mercado Pago: ${response.status} - ${errorData}`,
                );
            }

            const data = await response.json();

            await this.prisma.mercadoPagoAccount.update({
                where: { refreshToken: refreshToken, userId: userId },
                data: {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    expiresAt: new Date(Date.now() + data.expires_in * 1000),
                },
            });

            return data;
        } catch (error) {
            this.logger.error('Erro ao atualizar token de acesso:', error);
            throw error;
        }
    }
}
