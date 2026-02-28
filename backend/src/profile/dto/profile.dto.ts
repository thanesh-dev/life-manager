import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(120)
    age?: number;

    @IsOptional()
    @IsNumber()
    @Min(50)
    @Max(300)
    height?: number; // cm

    @IsOptional()
    @IsNumber()
    @Min(10)
    @Max(500)
    weight?: number; // kg

    @IsOptional()
    @IsString()
    profession?: string;

    @IsOptional()
    @IsString()
    goal_description?: string;
}
