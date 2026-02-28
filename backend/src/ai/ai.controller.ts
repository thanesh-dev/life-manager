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

class EstimateFoodKcalDto {
    @IsString() food_name: string;
    @IsNumber() @Min(0) serving_size: number;
    @IsString() serving_unit: string;
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
    async estimateCalories(@Request() req, @Body() dto: EstimateCaloriesDto) {
        if (!dto.activity || !dto.duration) {
            throw new HttpException('activity and duration are required', HttpStatus.BAD_REQUEST);
        }
        return this.aiService.estimateCalories(dto.activity, dto.duration, req.user.userId);
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

    @Post('estimate-food-kcal')
    async estimateFoodKcal(@Request() req, @Body() dto: EstimateFoodKcalDto) {
        if (!dto.food_name || dto.serving_size === undefined || !dto.serving_unit) {
            throw new HttpException('food_name, serving_size, and serving_unit are required', HttpStatus.BAD_REQUEST);
        }
        return this.aiService.estimateFoodKcal(dto.food_name, dto.serving_size, dto.serving_unit, req.user.userId);
    }

    @Post('suggest-food-target')
    async suggestFoodTarget(@Request() req) {
        return this.aiService.suggestDailyTarget(req.user.userId);
    }
}
