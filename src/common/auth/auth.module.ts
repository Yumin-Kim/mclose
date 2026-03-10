import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './auth-jwt.strategy';
import { SessionPassportGuard } from './auth-passport.guard';
import { GoogleStrategy } from './auth-google.strategy';
import { SessionSerializer } from './auth-session.serializer';

@Module({
  imports: [
    // Inject Passport module
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    // PassportModule.register({ session: true }),
    // Inject JWT and config module
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET_KEY') ?? 'secretKey',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION_TIME') ?? '60s',
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    SessionPassportGuard,
    JwtStrategy,
    // GoogleStrategy,
    SessionSerializer,
  ],
  exports: [AuthService, SessionPassportGuard],
})
export class AuthModule {}
