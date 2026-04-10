import { Injectable } from '@nestjs/common';
import { InvalidCredentialsException } from '@common/exceptions/invalid-credentials.exception';
import { UsersService } from '@users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '@auth/dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) { }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) throw new InvalidCredentialsException();

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid)
      throw new InvalidCredentialsException();

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    };
  }
}
