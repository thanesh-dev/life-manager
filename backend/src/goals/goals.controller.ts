import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';

@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
    constructor(private readonly goalsService: GoalsService) { }

    @Post()
    create(@Request() req, @Body() dto: CreateGoalDto) {
        return this.goalsService.create(req.user.userId, dto);
    }

    @Get()
    findAll(@Request() req, @Query('type') type?: string) {
        return this.goalsService.findAll(req.user.userId, type);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.goalsService.remove(req.user.userId, +id);
    }
}
