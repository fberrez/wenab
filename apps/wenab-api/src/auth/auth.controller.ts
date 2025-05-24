import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  ValidationPipe,
  UsePipes,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignUpDto, SignInDto, RefreshTokenDto } from "./dto";
import { AuthGuard } from "@nestjs/passport";
import { JwtPayload } from "./jwt.strategy";

// Helper type for the request object once user is attached by Passport
interface RequestWithUser extends Request {
  user: JwtPayload; // Or whatever type your JwtStrategy.validate() returns
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post("signin")
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post("signout")
  @UseGuards(AuthGuard("jwt"))
  async signOut(@Req() req: RequestWithUser) {
    return this.authService.signOut();
  }

  @Get("user")
  @UseGuards(AuthGuard("jwt"))
  async getUser(@Req() req: RequestWithUser) {
    return req.user;
  }

  @Post("refresh")
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }
}
