import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TerminalService } from './order.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    providers: [PrismaService, TerminalService],
    exports: [TerminalService],
})
export class TerminalModule { }
