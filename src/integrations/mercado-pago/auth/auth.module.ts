import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CryptoModule } from 'src/common/services/crypto.module';

@Module({
    imports: [CryptoModule],
    controllers: [AuthController],
    providers: [PrismaService, AuthService],
    exports: [AuthService],
})
export class AuthModule { }
