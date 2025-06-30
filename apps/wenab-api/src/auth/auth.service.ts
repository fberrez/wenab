import {
  Injectable,
  Logger,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { SupabaseService } from "./supabase.service";
import { AuthError, Session, User } from "@supabase/supabase-js";
import { SignUpDto, SignInDto, RefreshTokenDto } from "./dto";

// Define a more generic type for auth responses that include user and session
export type AuthUserSessionResponse = Promise<{
  data: { user: User | null; session: Session | null };
  error: AuthError | null;
}>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async signUp(signUpDto: SignUpDto): AuthUserSessionResponse {
    this.logger.log(
      `Attempting to sign up user with email: ${signUpDto.email}`
    );
    const supabase = this.supabaseService.getClient();
    const { email, password } = signUpDto;

    const response = await supabase.auth.signUp({
      email,
      password,
    });

    if (!response.data.user?.identities?.length) {
      throw new ConflictException("User with this email already exists.");
    }

    if (response.error) {
      this.logger.error("Error signing up:", response.error.message);
      throw new InternalServerErrorException(
        response.error.message || "An unexpected error occurred during sign up."
      );
    }

    if (!response.data.user) {
      this.logger.error(
        "Sign up attempt did not return a user object, but no explicit error was thrown."
      );
      throw new InternalServerErrorException(
        "Sign up process failed to return user information."
      );
    }

    this.logger.log(
      `User signed up successfully: ${response.data.user.email}, ID: ${
        response.data.user.id
      }. Session present: ${!!response.data.session}`
    );

    return response;
  }

  async signIn(signInDto: SignInDto): AuthUserSessionResponse {
    this.logger.log(
      `Attempting to sign in user with email: ${signInDto.email}`
    );
    const supabase = this.supabaseService.getClient();
    const { email, password } = signInDto;

    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (response.error) {
      this.logger.error("Error signing in:", response.error.message);
      // Common Supabase error for invalid credentials
      if (response.error.message === "Invalid login credentials") {
        throw new UnauthorizedException("Invalid email or password.");
      }
      // Handle other potential errors like email not confirmed if applicable
      if (response.error.message === "Email not confirmed") {
        throw new UnauthorizedException(
          "Please confirm your email address before signing in."
        );
      }
      throw new InternalServerErrorException(
        response.error.message || "An unexpected error occurred during sign in."
      );
    }

    if (!response.data.session || !response.data.user) {
      this.logger.error(
        "Sign in attempt did not return a session or user object, but no explicit error was thrown."
      );
      throw new InternalServerErrorException(
        "Sign in process failed to return session or user information."
      );
    }

    this.logger.log(
      `User signed in successfully: ${response.data.user.email}, Session obtained.`
    );
    return response;
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    this.logger.log("Attempting to sign out user");
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      this.logger.error("Error signing out:", error.message);
      // signOut might not typically throw unless there's a network issue or server problem.
      // If Supabase is unreachable, it might manifest here.
      throw new InternalServerErrorException(
        error.message || "An unexpected error occurred during sign out."
      );
    }

    this.logger.log("User signed out successfully.");
    return { error: null }; // Or simply return { error } if you want to pass it along
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto
  ): AuthUserSessionResponse {
    this.logger.log("Attempting to refresh token");
    const supabase = this.supabaseService.getClient();
    const { refreshToken } = refreshTokenDto;

    // Supabase `refreshSession` expects an object with the refresh token.
    // Note: Some older examples or versions might use `supabase.auth.setSession(refreshToken)`
    // but `refreshSession` is more explicit for this operation.
    const response = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (response.error) {
      this.logger.error("Error refreshing token:", response.error.message);
      // Common errors for refresh token might include it being invalid or revoked.
      if (
        response.error.status === 401 ||
        response.error.message.toLowerCase().includes("invalid refresh token")
      ) {
        throw new UnauthorizedException("Invalid or expired refresh token.");
      }
      throw new InternalServerErrorException(
        response.error.message ||
          "An unexpected error occurred while refreshing the token."
      );
    }

    if (!response.data.session || !response.data.user) {
      this.logger.error(
        "Refresh token attempt did not return a session or user object, but no explicit error was thrown."
      );
      throw new InternalServerErrorException(
        "Token refresh process failed to return session or user information."
      );
    }

    this.logger.log(
      `Token refreshed successfully for user: ${response.data.user.email}`
    );
    return response;
  }

  // You might also want a method to get the current user based on a JWT
  // async getUserByJwt(token: string): Promise<any> {
  //   const { data: { user }, error } = await this.supabase.auth.getUser(token);
  //   if (error) {
  //     this.logger.error('Error getting user by JWT:', error.message);
  //     throw error;
  //   }
  //   return user;
  // }
}
