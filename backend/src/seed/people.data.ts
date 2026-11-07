import type { PersonDoc } from '../database/schema';

export const PEOPLE: PersonDoc[] = [
  { _id: 'ada', name: 'Ada Okafor', blurb: 'Reads everything, follows every link, has been nearly everywhere.' },
  { _id: 'bruno', name: 'Bruno Vale', blurb: 'Bakes on weekends; keeps coming back to the same three pages.' },
  { _id: 'chen', name: 'Chen Li', blurb: 'Night owl. Stars, lighthouses, and the odd dead link.' },
  { _id: 'dee', name: 'Dee Marsh', blurb: 'Searches first, browses second.' },
  { _id: 'marina', name: 'Marina Holt', blurb: 'Writes about the shore: tide pools, kelp, the old light.' },
  { _id: 'otto', name: 'Otto Brandt', blurb: 'Bread, brine, and a hand-kept almanac.' },
  { _id: 'june', name: 'June Park', blurb: 'Counts shorebirds and talks to strangers on the radio.' },
  { _id: 'wren', name: 'Wren Adair', blurb: 'Keeps the webring and draws the maps.' },
  { _id: 'mallory', name: 'Mallory Quint', blurb: 'Publishes things that try to get out.' },
];
