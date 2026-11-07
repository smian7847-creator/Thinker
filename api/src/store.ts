import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MongoClient } from 'mongodb';
import { Collections, collections, connect, ensureIndexes, MONGO_URL } from './db';

/** Owns the Mongo connection and hands out typed collections. */
@Injectable()
export class Store implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(Store.name);
  private client?: MongoClient;
  private c?: Collections;

  async onModuleInit() {
    const { client, db } = await connect();
    this.client = client;
    this.c = collections(db);
    await ensureIndexes(this.c);
    this.log.log(`connected to ${MONGO_URL.replace(/\/\/[^@]*@/, '//')}`);
  }

  async onModuleDestroy() {
    await this.client?.close();
  }

  get db(): Collections {
    if (!this.c) throw new Error('store not initialised');
    return this.c;
  }
}
