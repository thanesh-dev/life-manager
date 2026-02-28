import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FoodService } from './food.service';
import { CreateFoodLogDto, SetFoodTargetDto } from './dto/food.dto';

@UseGuards(JwtAuthGuard)
@Controller('food')
export class FoodController {
    constructor(private readonly foodService: FoodService) { }

    @Post('log')
    log(@Request() req, @Body() dto: CreateFoodLogDto) {
        return this.foodService.logFood(req.user.userId, dto);
    }

    @Get('today')
    getToday(@Request() req) {
        return this.foodService.getTodayLogs(req.user.userId);
    }

    @Get('weekly')
    getWeekly(@Request() req) {
        return this.foodService.getWeeklyLogs(req.user.userId);
    }

    @Delete('log/:id')
    delete(@Request() req, @Param('id') id: string) {
        return this.foodService.deleteLog(req.user.userId, +id);
    }

    @Post('target')
    setTarget(@Request() req, @Body() dto: SetFoodTargetDto) {
        return this.foodService.setTarget(req.user.userId, dto);
    }

    @Get('target')
    getTarget(@Request() req) {
        return this.foodService.getTarget(req.user.userId);
    }
}
