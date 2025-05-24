import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class SignUpDto {
  @IsEmail({}, { message: "Please enter a valid email address." })
  @IsNotEmpty({ message: "Email should not be empty." })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: "Password should not be empty." })
  @MinLength(8, { message: "Password must be at least 8 characters long." })
  password!: string;

  // You can add more fields here if needed for sign-up, e.g., firstName, lastName
  // Make sure to update the Supabase signUp options data if you add more fields.
}
