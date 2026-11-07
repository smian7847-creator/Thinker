import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PeopleController, PeopleService } from './people';
import { SearchController, SearchService } from './search';
import { SitesController, SitesService } from './sites';
import { Store } from './store';

@Module({
  controllers: [SitesController, PeopleController, SearchController],
  providers: [Store, SitesService, PeopleService, SearchService],
})
class AppModule {}

async function main() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser('json', { limit: '300kb' });
  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? 4100);
  await app.listen(port, '127.0.0.1');
  console.log(`api listening on http://127.0.0.1:${port}`);
}

main();
