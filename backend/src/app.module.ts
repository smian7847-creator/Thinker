import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { rateLimit } from './common/rate-limit.middleware';
import { DatabaseModule } from './database/database.module';
import { PeopleModule } from './people/people.module';
import { SearchModule } from './search/search.module';
import { SitesModule } from './sites/sites.module';
import { VisitsModule } from './visits/visits.module';

const MINUTE = 60_000;

@Module({
  imports: [DatabaseModule, PeopleModule, SitesModule, VisitsModule, SearchModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Only writes are limited; reading the web is never throttled.
    consumer.apply(rateLimit('publishes', 10, MINUTE)).forRoutes({ path: 'sites', method: RequestMethod.POST });
    consumer
      .apply(rateLimit('visits', 120, MINUTE))
      .forRoutes({ path: 'people/:personId/visits', method: RequestMethod.POST });
  }
}
