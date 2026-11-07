import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { SitesService } from './sites.service';

/** Revisions by id. They never change, so back and forward can ask for exactly the one that was left. */
@Controller('revisions')
export class RevisionsController {
  constructor(private readonly sites: SitesService) {}

  @Get(':id')
  async revision(@Param('id') id: string) {
    const rev = await this.sites.revision(id);
    if (!rev) throw new NotFoundException(`no revision ${id}`);
    return rev;
  }

  /** What the author wrote, before sanitizing: used to prefill an edit. */
  @Get(':id/source')
  async source(@Param('id') id: string) {
    const source = await this.sites.source(id);
    if (source === null) throw new NotFoundException(`no revision ${id}`);
    return { id, source };
  }
}
