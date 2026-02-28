import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateFinanceLogDto {
    @IsString()
    category: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsOptional()
    @IsString()
    note?: string;
}
