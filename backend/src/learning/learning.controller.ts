import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LearningService } from './learning.service';
import { CreateLearningNoteDto } from './dto/create-learning-note.dto';

@UseGuards(JwtAuthGuard)
@Controller('learning')
export class LearningController {
    constructor(private readonly learningService: LearningService) { }

    @Post('note')
    createNote(@Request() req, @Body() dto: CreateLearningNoteDto) {
        return this.learningService.createNote(req.user.userId, dto);
    }

    @Get('notes')
    getNotes(@Request() req) {
        return this.learningService.getNotes(req.user.userId);
    }

    @Delete('note/:id')
    deleteNote(@Request() req, @Param('id') id: string) {
        return this.learningService.deleteNote(req.user.userId, +id);
    }
}
