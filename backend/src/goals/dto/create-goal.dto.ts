import { IsString, IsIn, IsOptional } from 'class-validator';

export class CreateGoalDto {
    @IsIn(['FITNESS', 'FINANCE', 'LEARNING'])
    type: string;

    @IsString()
    title: string;

    @IsOptional()
    target?: any;
}
