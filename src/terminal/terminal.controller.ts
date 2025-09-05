import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TerminalService } from './terminal.service';
import { CreateTerminalDto } from './dto/create-terminal.dto';
import { UpdateTerminalDto } from './dto/update-terminal.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { ChangeOperatingModeDto } from './dto/change-operating-mode.dto';

@Controller('terminal')
export class TerminalController {
  constructor(private readonly terminalService: TerminalService) { }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createTerminalDto: CreateTerminalDto, @User() user: { userId: string; }) {
    return this.terminalService.create({ ...createTerminalDto, userId: user.userId });
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.terminalService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.terminalService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  delete(@Param('id') id: string) {
    return this.terminalService.delete(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateTerminalDto: UpdateTerminalDto) {
    return this.terminalService.update(id, updateTerminalDto);
  }

  @Patch(':id/change-operating-mode')
  @UseGuards(AuthGuard)
  changeOperatingMode(@Param('id') id: string, @Body() changeOperatingModeDto: ChangeOperatingModeDto) {
    return this.terminalService.changeOperatingMode(id, changeOperatingModeDto);
  }
}
