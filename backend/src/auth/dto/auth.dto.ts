import { IsString, MinLength, MaxLength } from 'class-validator';

export class AuthDto {
    @IsString()
    @MinLength(3)
    @MaxLength(30)
    username: string;

    @IsString()
    @MinLength(6)
    password: string;
}
