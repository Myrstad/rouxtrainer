import {pgTable, unique, integer, varchar, timestamp, boolean, text} from "drizzle-orm/pg-core"

export const users = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "users_id_seq", startWith: 10000, increment: 1, maxValue: 2147483647, cache: 1 }),
    user_name: varchar({ length: 64 }).notNull(),
    display_name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }),
    password: varchar({ length: 255 }).notNull(), // hashed by Argon2

}, (table) => [
    unique("users_email_unique").on(table.email),
    unique("users_username_unique").on(table.user_name)
]);

export const sessions = pgTable("sessions", {
    id: varchar({ length: 64 }).primaryKey(),
    user_id: integer().notNull().references(()=>users.id, {onDelete: "cascade"}),
    created_at: timestamp().defaultNow().notNull(),
    updated_at: timestamp().defaultNow().notNull(),
    expires_at : timestamp().notNull(),
    can_refresh: boolean().default(false),
    user_agent: text().default("No user agent given")
})

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;