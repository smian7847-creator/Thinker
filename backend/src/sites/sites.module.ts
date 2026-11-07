import { Module } from '@nestjs/common';
import { PeopleModule } from '../people/people.module';
import { RevisionsController } from './revisions.controller';
import { SitesController } from './sites.controller';
import { SitesService } from './sites.service';

@Module({
  imports: [PeopleModule],
  controllers: [SitesController, RevisionsController],
  providers: [SitesService],
})
export class SitesModule {}
