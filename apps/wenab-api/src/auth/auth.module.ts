import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { SupabaseService } from "./supabase.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./jwt.strategy";

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>("SUPABASE_JWT_SECRET");
        if (!secret) {
          throw new Error(
            "SUPABASE_JWT_SECRET is not configured for JwtModule."
          );
        }
        return {
          secret: secret,
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SupabaseService, JwtStrategy],
  exports: [AuthService, SupabaseService, PassportModule, JwtModule],
})
export class AuthModule {}
