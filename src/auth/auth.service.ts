import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto, LogoutDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.jwtService.signAsync(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      { expiresIn: '1h' },
    );

    const jti = randomUUID();

    const refreshToken = await this.jwtService.signAsync(
      {
        userId: user.id, type: 'refresh', jti
      },
      { expiresIn: '7d' },
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashedRefreshToken,
        jti,
      },
    });

    return {
      accessToken,
      refreshToken,
      message: 'Login successful',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {

    const decoded = await this.jwtService.verifyAsync(refreshTokenDto.refreshToken, {
      secret: process.env.JWT_SECRET,
    });

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { jti: decoded.jti },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid = await bcrypt.compare(refreshTokenDto.refreshToken, storedToken.token);

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.delete({
      where: { jti: decoded.jti },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = await this.jwtService.signAsync(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      { expiresIn: '1h' },
    );

    const jti = randomUUID();

    const refreshToken = await this.jwtService.signAsync(
      {
        userId: user.id,
        jti,
        type: 'refresh',
      },
      { expiresIn: '7d' },
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.prisma.refreshToken.create({
      data: {
        userId: decoded.userId,
        token: hashedRefreshToken,
        jti,
      },
    });

    return {
      accessToken,
      refreshToken,
      message: 'Refresh token successful',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const userAlreadyExists = await this.prisma.user.findUnique({
      where: {
        email: registerDto.email,
      },
    });

    if (userAlreadyExists) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...registerDto,
        password: hashedPassword,
      },
    });

    return {
      message: 'Register successful',
      data: user,
    };
  }

  async logout(logoutDto: LogoutDto) {

    const decoded = await this.jwtService.verifyAsync(logoutDto.refreshToken, {
      secret: process.env.JWT_SECRET,
    });

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.delete({
      where: { jti: decoded.jti },
    });

    return {
      message: 'Logout successful',
    };
  }
}
