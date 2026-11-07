import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { parseRecordVisitInput } from './record-visit.input';
import { VisitsService } from './visits.service';

const DEFAULT_PAGE = 50;
const MAX_PAGE = 200;

/** A person's visits live under that person. */
@Controller('people/:personId')
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  @Get('visits')
  history(@Param('personId') personId: string, @Query('before') before?: string, @Query('limit') limit?: string) {
    const n = Math.min(Math.max(parseInt(limit ?? '', 10) || DEFAULT_PAGE, 1), MAX_PAGE);
    return this.visits.history(personId, before || undefined, n);
  }

  @Post('visits')
  record(@Param('personId') personId: string, @Body() body: unknown) {
    return this.visits.record(personId, parseRecordVisitInput(body));
  }

  @Get('visited')
  visited(@Param('personId') personId: string) {
    return this.visits.visited(personId);
  }
}
