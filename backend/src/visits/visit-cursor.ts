import { BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import type { VisitDoc } from '../database/schema';

/**
 * Visits are listed newest first. The cursor is the (at, _id) of the last
 * visit on the previous page, so pages never overlap or skip, even while new
 * visits are being recorded at the top.
 */
export function encodeCursor(v: VisitDoc): string {
  return Buffer.from(`${v.at.toISOString()}|${v._id.toHexString()}`).toString('base64url');
}

export function decodeCursor(cursor: string): { at: Date; id: ObjectId } {
  const [at, id] = Buffer.from(cursor, 'base64url').toString().split('|');
  const date = new Date(at);
  if (Number.isNaN(date.getTime()) || !id || !ObjectId.isValid(id)) throw new BadRequestException('bad cursor');
  return { at: date, id: new ObjectId(id) };
}

/** The Mongo filter for "older than this cursor". */
export function olderThan(cursor: string): Record<string, unknown> {
  const c = decodeCursor(cursor);
  return { $or: [{ at: { $lt: c.at } }, { at: c.at, _id: { $lt: c.id } }] };
}
