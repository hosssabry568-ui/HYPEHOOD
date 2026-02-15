import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export chat models from integration
export * from "./models/chat";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  category: text("category").notNull(), // PANTS, HOODIES, SWEATSHIRTS, JACKETS
  icon: text("icon").notNull(), // FontAwesome icon class suffix e.g. "socks"
  description: text("description"),
  image: text("image"), // Optional URL
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
