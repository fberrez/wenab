import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class SignInDto {
  @IsEmail({}, { message: "Please enter a valid email address." })
  @IsNotEmpty({ message: "Email should not be empty." })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: "Password should not be empty." })
  @MinLength(8, { message: "Password must be at least 8 characters long." })
  password!: string;
}
