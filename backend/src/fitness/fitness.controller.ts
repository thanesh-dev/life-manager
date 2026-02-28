import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FitnessService } from './fitness.service';
import { CreateFitnessLogDto } from './dto/create-fitness-log.dto';

@UseGuards(JwtAuthGuard)
@Controller('fitness')
export class FitnessController {
    constructor(private readonly fitnessService: FitnessService) { }

    @Post('log')
    log(@Request() req, @Body() dto: CreateFitnessLogDto) {
        return this.fitnessService.log(req.user.userId, dto);
    }

    @Get('summary')
    getSummary(@Request() req) {
        return this.fitnessService.getSummary(req.user.userId);
    }
}
