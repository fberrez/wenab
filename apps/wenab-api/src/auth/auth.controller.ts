import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  ValidationPipe,
  UsePipes,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  SignUpDto,
  SignInDto,
  RefreshTokenDto,
  UserContextResponseDto,
  ErrorResponseDto,
  AuthOperationResponseDto,
  SignOutResponseDto,
} from "./dto";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";

// Helper type for the request object once user is attached by Passport
interface RequestWithUser extends Request {
  user: UserContextResponseDto;
}

@ApiTags("Authentication") // Group all auth endpoints under this tag in Swagger
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register a new user" })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      "User successfully registered. May return user and session data (session might be null if email confirmation is pending).",
    type: AuthOperationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data (validation failed).",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "User with this email already exists.",
    type: ErrorResponseDto,
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async signUp(
    @Body() signUpDto: SignUpDto
  ): Promise<AuthOperationResponseDto> {
    return this.authService.signUp(signUpDto);
  }

  @Post("signin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Sign in an existing user" })
  @ApiBody({ type: SignInDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      "User successfully signed in. Returns user and session data containing access and refresh tokens.",
    type: AuthOperationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data (validation failed).",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Invalid credentials or email not confirmed.",
    type: ErrorResponseDto,
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async signIn(
    @Body() signInDto: SignInDto
  ): Promise<AuthOperationResponseDto> {
    return this.authService.signIn(signInDto);
  }

  @Post("signout")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth() // Indicates that this endpoint requires a Bearer token
  @ApiOperation({ summary: "Sign out the current user" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User successfully signed out.",
    type: SignOutResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized (invalid or missing token).",
    type: ErrorResponseDto,
  })
  @UseGuards(AuthGuard("jwt"))
  async signOut(@Req() req: RequestWithUser): Promise<SignOutResponseDto> {
    return this.authService.signOut();
  }

  @Get("user")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the currently authenticated user's details" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Returns the authenticated user's context (derived from JWT).",
    type: UserContextResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized (invalid or missing token).",
    type: ErrorResponseDto,
  })
  @UseGuards(AuthGuard("jwt"))
  async getUser(@Req() req: RequestWithUser): Promise<UserContextResponseDto> {
    return req.user;
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh an access token using a refresh token" })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      "Successfully refreshed tokens. Returns new user and session data.",
    type: AuthOperationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data (validation failed).",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Invalid or expired refresh token.",
    type: ErrorResponseDto,
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto
  ): Promise<AuthOperationResponseDto> {
    return this.authService.refreshToken(refreshTokenDto);
  }
}
