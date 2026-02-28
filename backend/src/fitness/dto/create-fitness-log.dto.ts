import { IsString, IsNumber, IsOptional, Min, IsEnum, IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkoutSetDto {
    @IsString() exercise: string;
    @IsOptional() @IsInt() @Min(1) sets?: number;
    @IsOptional() @IsInt() @Min(1) reps?: number;
    @IsOptional() @IsNumber() weight_kg?: number;  // kg
}

export class CreateFitnessLogDto {
    @IsString()
    activity: string;

    @IsOptional()
    @IsEnum(['cardio', 'gym', 'other'])
    activity_type?: 'cardio' | 'gym' | 'other';

    @IsNumber()
    @Min(0)
    duration: number;   // minutes

    @IsOptional()
    @IsNumber()
    calories?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    steps?: number;     // cardio: steps walked/run

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WorkoutSetDto)
    workout_details?: WorkoutSetDto[];  // gym: exercise rows

    @IsOptional()
    @IsString()
    notes?: string;
}
