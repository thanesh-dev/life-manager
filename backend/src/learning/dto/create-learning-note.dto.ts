import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateLearningNoteDto {
    @IsString()
    topic: string;

    @IsString()
    content: string;

    @IsOptional()
    @IsArray()
    tags?: string[];
}
