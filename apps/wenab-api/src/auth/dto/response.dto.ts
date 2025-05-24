import { ApiProperty } from "@nestjs/swagger";
// import { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js'; // Not strictly needed if DTOs are for shape only

// For User object within session (simplified for Swagger example)
class UserInSessionDto {
  @ApiProperty({ example: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" })
  id!: string;

  @ApiProperty({ example: "user@example.com" })
  email!: string;

  @ApiProperty({ example: "authenticated", required: false })
  role?: string;
}

// For Session object (simplified for Swagger example)
export class SessionResponseDto {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  access_token!: string;

  @ApiProperty({ example: "asdfqwer1234zxcv..." })
  refresh_token!: string;

  @ApiProperty({ example: 3600 })
  expires_in!: number;

  @ApiProperty({ example: "bearer" })
  token_type!: string;

  @ApiProperty({ type: () => UserInSessionDto })
  user!: UserInSessionDto;
}

class UserDataDto {
  // Removed implements Partial<SupabaseUser>
  @ApiProperty({ example: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" })
  id!: string;

  @ApiProperty({ example: "user@example.com", required: false })
  email?: string;

  @ApiProperty({ example: "authenticated", required: false })
  role?: string;

  @ApiProperty({ example: "2023-01-01T12:00:00.000Z", required: false })
  created_at?: string;
}

class SessionDataDto {
  // Removed implements Partial<SupabaseSession>
  @ApiProperty()
  access_token!: string;

  @ApiProperty({ required: false })
  refresh_token?: string;

  @ApiProperty({ required: false })
  expires_in?: number;

  @ApiProperty({ required: false })
  token_type?: string;

  @ApiProperty({ type: () => UserDataDto, required: false })
  user?: UserDataDto; // This should now be fine
}

export class AuthOperationDataDto {
  @ApiProperty({ type: () => UserDataDto, nullable: true })
  user!: UserDataDto | null;

  @ApiProperty({ type: () => SessionDataDto, nullable: true })
  session!: SessionDataDto | null;
}

export class AuthOperationResponseDto {
  @ApiProperty({ type: () => AuthOperationDataDto, nullable: true })
  data!: AuthOperationDataDto | null;

  @ApiProperty({
    type: Object,
    nullable: true,
    description: "Null if successful, AuthError object if an error occurred",
    example: {
      name: "AuthApiError",
      message: "Invalid login credentials",
      status: 400,
    },
  })
  error!: any | null;
}

export class UserContextResponseDto {
  @ApiProperty({
    description: "User's unique identifier (from JWT 'sub' claim)",
    example: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  })
  id!: string;

  @ApiProperty({
    description: "User's email address (from JWT)",
    example: "user@example.com",
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: "User's role (from JWT)",
    example: "authenticated",
    required: false,
  })
  role?: string;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: "Invalid input data" })
  message!: string | string[];

  @ApiProperty({ example: "Bad Request", required: false })
  error?: string;
}

export class SignOutResponseDto {
  @ApiProperty({
    type: Object,
    nullable: true,
    example: null,
    description: "Null if successful, AuthError object if an error occurred",
  })
  error!: any | null;
}
