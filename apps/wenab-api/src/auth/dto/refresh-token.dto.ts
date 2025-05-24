import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RefreshTokenDto {
  @ApiProperty({
    description: "The refresh token obtained during sign-in",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: "Refresh token should not be empty." })
  refreshToken!: string;
}
