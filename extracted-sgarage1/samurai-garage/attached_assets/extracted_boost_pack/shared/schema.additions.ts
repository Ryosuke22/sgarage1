import { pgTable, uuid, integer, timestamp, primaryKey, text, jsonb } from 'drizzle-orm/pg-core';
import { listings } from './schema'; // assuming your existing schema exports listings/users

export const bids = pgTable('bids', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').references(() => listings.id).notNull(),
  bidderId: uuid('bidder_id').notNull(), // add FK to users if available
  amount: integer('amount').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const watches = pgTable('watches', {
  userId: uuid('user_id').notNull(),
  listingId: uuid('listing_id').references(() => listings.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.listingId] }),
}));

export const savedSearches = pgTable('saved_searches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  query: text('query'),
  facets: jsonb('facets'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
