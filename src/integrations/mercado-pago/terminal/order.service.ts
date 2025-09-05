import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { AuthService } from "../auth/auth.service";
import { MercadoPagoException } from "src/common/filters/mercado-pago-exception.filter";

@Injectable()
export class TerminalService {
    constructor(private readonly prisma: PrismaService, private readonly authService: AuthService) { }

    async changeTerminalOperatingMode(terminalId: string, operatingMode: string) {
        const terminal = await this.prisma.terminal.findUnique({ where: { id: terminalId } });
        if (!terminal) {
            throw new NotFoundException('Terminal não encontrado');
        }

        const body = {
            terminals: [
                {
                    id: terminal.mpTerminalId,
                    operating_mode: operatingMode
                }
            ]
        };

        const mpAccessToken = await this.authService.getAccessToken(terminal.userId);
        const mpBaseUrl = process.env.MP_BASE_URL;

        if (!mpBaseUrl || !mpAccessToken) {
            throw new MercadoPagoException(
                500,
                'Configurações do Mercado Pago não encontradas',
                'CONFIGURATION_ERROR',
                { missingConfigs: { mpBaseUrl: !mpBaseUrl, mpAccessToken: !mpAccessToken } }
            );
        }

        const response = await fetch(`${mpBaseUrl}/terminals/v1/setup`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${mpAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new MercadoPagoException(
                500,
                'Erro ao ativar terminal',
                'TERMINAL_ACTIVATION_ERROR',
                { response: await response.json() }
            );
        }

        return response.json();
    }
}