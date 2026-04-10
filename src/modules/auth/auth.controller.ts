import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '@auth/auth.service';
import { LoginDto } from '@auth/dto/login.dto';
import { AuthLoginSwaggerSchema } from '@common/swagger/swagger.schemas';

import { Public } from '@common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @ApiOperation({ summary: 'Iniciar sesión', description: 'Autentica a un usuario usando sus credenciales y devuelve un token de acceso.' })
  @ApiResponse({
    status: 200,
    description: 'Usuario autenticado exitosamente.',
    schema: AuthLoginSwaggerSchema
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
