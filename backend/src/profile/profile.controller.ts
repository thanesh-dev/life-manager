import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/profile.dto';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get()
    getProfile(@Request() req) {
        return this.profileService.getProfile(req.user.userId);
    }

    @Post()
    updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
        return this.profileService.updateProfile(req.user.userId, dto);
    }
}
