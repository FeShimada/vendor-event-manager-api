import { Controller, Get, Logger, Query, Redirect, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthService } from './auth.service';
import { User } from 'src/common/decorators/user.decorator';

@Controller('integrations/mercado-pago/auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly authService: AuthService) { }

    @Get('generate-url')
    @UseGuards(AuthGuard)
    async generateAuthUrl(@User() user: { userId: string; }) {
        try {
            const authUrl = await this.authService.generateAuthUrl(user.userId);
            return {
                success: true,
                authUrl: authUrl,
                message: 'URL de autenticação OAuth gerada com sucesso'
            };
        } catch (error) {
            this.logger.error('Erro ao gerar URL de autenticação:', error);
            return {
                success: false,
                error: error.message,
                message: 'Erro ao gerar URL de autenticação OAuth'
            };
        }
    }

    @Get('callback')
    @Redirect()
    async callback(@Query('code') code: string, @Query('state') state: string) {
        await this.authService.handleCallback(code, state);
        return {
            url: 'https://www.google.com/search?q=deu+certo&rlz=1C1JJTC_pt-PTBR1062BR1062&oq=deu+certo&gs_lcrp=EgZjaHJvbWUqCggAEAAY4wIYgAQyCggAEAAY4wIYgAQyBwgBEC4YgAQyBwgCEAAYgAQyBwgDEAAYgAQyBwgEEAAYgAQyBwgFEAAYgAQyBwgGEC4YgAQyBwgHEAAYgAQyBwgIEAAYgAQyBwgJEAAYgATSAQgxMzU4ajBqN6gCALACAA&sourceid=chrome&ie=UTF-8',
            statusCode: 302
        };
    }
}
