import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SignUpDto {
  @ApiProperty({
    description: "User's email address",
    example: "user@example.com",
    type: String,
  })
  @IsEmail({}, { message: "Please enter a valid email address." })
  @IsNotEmpty({ message: "Email should not be empty." })
  email!: string;

  @ApiProperty({
    description: "User's chosen password (min 8 characters)",
    example: "Str0ngP@sswOrd",
    type: String,
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: "Password should not be empty." })
  @MinLength(8, { message: "Password must be at least 8 characters long." })
  password!: string;

  // You can add more fields here if needed for sign-up, e.g., firstName, lastName
  // Make sure to update the Supabase signUp options data if you add more fields.
}
