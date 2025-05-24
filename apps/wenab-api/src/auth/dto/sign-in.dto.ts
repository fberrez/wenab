import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SignInDto {
  @ApiProperty({
    description: "User's email address for login",
    example: "user@example.com",
    type: String,
  })
  @IsEmail({}, { message: "Please enter a valid email address." })
  @IsNotEmpty({ message: "Email should not be empty." })
  email!: string;

  @ApiProperty({
    description: "User's password for login",
    example: "Str0ngP@sswOrd",
    type: String,
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: "Password should not be empty." })
  @MinLength(8, { message: "Password must be at least 8 characters long." })
  password!: string;
}
