import { Module } from '@nestjs/common';
import { FitnessService } from './fitness.service';
import { FitnessController } from './fitness.controller';

@Module({ providers: [FitnessService], controllers: [FitnessController] })
export class FitnessModule { }
