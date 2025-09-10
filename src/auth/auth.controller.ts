import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { EmployeeLoginDto, LoginDto, LogoutDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';
import { AuthGuard, UserOrEmployeeGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post(':eventId/employee-login')
  employeeLogin(@Body() employeeLoginDto: EmployeeLoginDto, @Param('eventId') eventId: string) {
    return this.authService.employeeLogin(employeeLoginDto, eventId);
  }

  @Post('refresh-token')
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('logout')
  logout(@Body() logoutDto: LogoutDto) {
    return this.authService.logout(logoutDto);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Request() req) {
    return req.user;
  }

  @UseGuards(UserOrEmployeeGuard)
  @Get('me-as-employee')
  meAsEmployee(@Request() req) {
    return req.employee;
  }
}
