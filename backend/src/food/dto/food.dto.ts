import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';

export class CreateFoodLogDto {
    @IsString()
    food_name: string;

    @IsNumber()
    @Min(0)
    @Max(10000)
    kcal: number;

    @IsOptional()
    @IsEnum(['breakfast', 'lunch', 'dinner', 'snack'])
    meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';

    @IsOptional()
    image_analyzed?: boolean;
}

export class SetFoodTargetDto {
    @IsNumber()
    @Min(500)
    @Max(10000)
    daily_kcal_target: number;
}
