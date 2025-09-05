import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTerminalDto } from './dto/create-terminal.dto';
import { UpdateTerminalDto } from './dto/update-terminal.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChangeOperatingModeDto } from './dto/change-operating-mode.dto';
import { TerminalService as MercadoPagoTerminalService } from 'src/integrations/mercado-pago/terminal/order.service';

@Injectable()
export class TerminalService {
  constructor(private readonly prisma: PrismaService, private readonly mercadoPagoService: MercadoPagoTerminalService) { }

  async create(createTerminalDto: CreateTerminalDto & { userId: string; }) {
    return await this.prisma.terminal.create({
      data: {
        userId: createTerminalDto.userId,
        mpTerminalId: createTerminalDto.mpTerminalId,
        mpExternalPosId: createTerminalDto.mpExternalPosId,
        alias: createTerminalDto.alias,
      },
    });
  }

  async findAll() {
    return await this.prisma.terminal.findMany();
  }

  async findOne(id: string) {
    const terminal = await this.prisma.terminal.findUnique({ where: { id } });
    if (!terminal) {
      throw new NotFoundException('Terminal não encontrado');
    }
    return terminal;
  }

  async update(id: string, updateTerminalDto: UpdateTerminalDto) {
    const terminal = await this.prisma.terminal.update({
      where: { id },
      data: updateTerminalDto,
    });
    return terminal;
  }

  async delete(id: string) {
    const terminal = await this.prisma.terminal.findUnique({ where: { id } });
    if (!terminal) {
      throw new NotFoundException('Terminal não encontrado');
    }

    return await this.prisma.terminal.delete({ where: { id } });
  }

  async changeOperatingMode(id: string, changeOperatingModeDto: ChangeOperatingModeDto) {

    await this.mercadoPagoService.changeTerminalOperatingMode(id, changeOperatingModeDto.operatingMode);

    if (changeOperatingModeDto.operatingMode === "PDV") {
      return await this.prisma.terminal.update({
        where: { id },
        data: { active: true },
      });
    }

    if (changeOperatingModeDto.operatingMode === "STANDALONE") {
      return await this.prisma.terminal.update({
        where: { id },
        data: { active: false },
      });
    }

    throw new BadRequestException('Operating mode not found');
  }
}
