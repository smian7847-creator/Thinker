import { Module } from '@nestjs/common';
import { PeopleModule } from '../people/people.module';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';

@Module({
  imports: [PeopleModule],
  controllers: [VisitsController],
  providers: [VisitsService],
})
export class VisitsModule {}
