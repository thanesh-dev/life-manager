import { Controller, Post, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

class EstimateCaloriesDto {
    @IsString() activity: string;
    @IsNumber() @Min(1) duration: number;
    @IsOptional() @IsNumber() weight?: number;
}

class AnalyzeFoodImageDto {
    @IsString() image: string;  // base64 data-URL
}

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('insight')
    getInsight(@Request() req) {
        return this.aiService.getInsight(req.user.userId);
    }

    @Post('estimate-calories')
    async estimateCalories(@Body() dto: EstimateCaloriesDto) {
        if (!dto.activity || !dto.duration) {
            throw new HttpException('activity and duration are required', HttpStatus.BAD_REQUEST);
        }
        return this.aiService.estimateCalories(dto.activity, dto.duration, dto.weight);
    }

    @Post('finance-goal-plan')
    financeGoalPlan(@Request() req) {
        return this.aiService.financeGoalPlan(req.user.userId);
    }

    @Post('analyze-food-image')
    async analyzeFoodImage(@Body() dto: AnalyzeFoodImageDto) {
        if (!dto.image) {
            throw new HttpException('image (base64) is required', HttpStatus.BAD_REQUEST);
        }
        try {
            return await this.aiService.analyzeFoodImage(dto.image);
        } catch (err: any) {
            throw new HttpException(err.message, HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
}
