import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { normalizeAddress } from '@thinker/shared';
import { parsePublishInput } from './publish.input';
import { SitesService } from './sites.service';

@Controller('sites')
export class SitesController {
  constructor(private readonly sites: SitesService) {}

  @Get()
  list() {
    return this.sites.list();
  }

  /** The current revision at an address; 404 means the address leads nowhere. */
  @Get(':address')
  async resolve(@Param('address') address: string) {
    const rev = await this.sites.resolve(address);
    if (!rev) throw new NotFoundException({ statusCode: 404, message: 'nowhere', address: normalizeAddress(address) });
    return rev;
  }

  @Post()
  publish(@Body() body: unknown) {
    return this.sites.publish(parsePublishInput(body));
  }
}
