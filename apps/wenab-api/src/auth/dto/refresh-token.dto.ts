import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: "Refresh token should not be empty." })
  refreshToken!: string;
}
