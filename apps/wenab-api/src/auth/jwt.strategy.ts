import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import {
  ExtractJwt,
  Strategy,
  StrategyOptionsWithoutRequest,
} from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { SupabaseService } from "./supabase.service";
import { User } from "@supabase/supabase-js";

export interface JwtPayload {
  sub: string;
  email?: string;
  aud: string;
  exp: number;
  iat?: number;
  role?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
}

const getStrategyOptions = (
  configService: ConfigService
): StrategyOptionsWithoutRequest => {
  const jwtSecret = configService.get<string>("SUPABASE_JWT_SECRET");
  if (!jwtSecret) {
    throw new Error(
      "SUPABASE_JWT_SECRET is not defined in environment variables. This is required for JWT authentication."
    );
  }
  return {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,
    secretOrKey: jwtSecret,
  };
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService
  ) {
    super(getStrategyOptions(configService));
    this.logger.log("JwtStrategy initialized.");
  }

  async validate(payload: JwtPayload): Promise<any> {
    this.logger.debug(`Validating JWT payload for user ID: ${payload.sub}`);
    const userContext = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    if (!userContext.id) {
      this.logger.warn("JWT payload sub (user ID) is missing.");
      throw new UnauthorizedException("Invalid token: User ID missing.");
    }

    return userContext;
  }
}
