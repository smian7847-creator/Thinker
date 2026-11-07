import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MongoClient } from 'mongodb';
import { config } from '../config';
import { Collections, collections, connect, ensureIndexes } from './schema';

/** Owns the Mongo connection and hands out typed collections. */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(DatabaseService.name);
  private client?: MongoClient;
  private c?: Collections;

  async onModuleInit() {
    const { client, db } = await connect();
    this.client = client;
    this.c = collections(db);
    await ensureIndexes(this.c);
    this.log.log(`connected to ${config.mongoUrl.replace(/\/\/[^@]*@/, '//')}`);
  }

  async onModuleDestroy() {
    await this.client?.close();
  }

  get db(): Collections {
    if (!this.c) throw new Error('database not initialised');
    return this.c;
  }
}
