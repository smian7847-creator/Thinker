import { Injectable, NotFoundException } from '@nestjs/common';
import type { Person } from '@thinker/shared';
import { DatabaseService } from '../database/database.service';
import type { PersonDoc } from '../database/schema';

/**
 * The people you can browse and publish as. There are no accounts: a person
 * is a name picked from this list.
 */
@Injectable()
export class PeopleService {
  constructor(private readonly database: DatabaseService) {}

  async list(): Promise<Person[]> {
    const people = await this.database.db.people.find().sort({ name: 1 }).toArray();
    return people.map((p) => ({ id: p._id, name: p.name, blurb: p.blurb }));
  }

  async find(id: string): Promise<PersonDoc | null> {
    return this.database.db.people.findOne({ _id: id });
  }

  async mustExist(id: string): Promise<PersonDoc> {
    const person = await this.find(id);
    if (!person) throw new NotFoundException(`nobody called ${id}`);
    return person;
  }

  /** Display names by id, for joining onto sites and revisions. */
  async names(): Promise<Map<string, string>> {
    const people = await this.database.db.people.find().toArray();
    return new Map(people.map((p) => [p._id, p.name]));
  }

  async nameOf(id: string): Promise<string> {
    return (await this.find(id))?.name ?? id;
  }
}
