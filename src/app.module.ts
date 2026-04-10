import { AccountsModule } from '@accounts/accounts.module';
import { getDatabaseConfig } from '@config/database.config';
import { AuthModule } from '@auth/auth.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsModule } from '@transactions/transactions.module';
import { UsersModule } from '@users/users.module';
import { CoreModule } from '@core/core.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { RedisModule } from './modules/redis/redis.module';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    CoreModule,
    AuthModule,
    AccountsModule,
    TransactionsModule,
    UsersModule,
    CurrencyModule,
    RedisModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ]
})
export class AppModule { }
