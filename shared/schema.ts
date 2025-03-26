import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  bio: true,
  avatarUrl: true,
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const insertCategorySchema = createInsertSchema(categories);

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  userId: integer("user_id").notNull(),
  categoryId: integer("category_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  published: boolean("published").default(true).notNull(),
  coverImage: text("cover_image"),
  readTime: integer("read_time"),
});

export const insertPostSchema = createInsertSchema(posts).pick({
  title: true,
  content: true,
  excerpt: true,
  categoryId: true,
  coverImage: true,
  readTime: true,
  published: true,
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertTagSchema = createInsertSchema(tags);

export const postTags = pgTable("post_tags", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  tagId: integer("tag_id").notNull(),
});

export const insertPostTagSchema = createInsertSchema(postTags);

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  postId: true,
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
});

export const insertLikeSchema = createInsertSchema(likes).pick({
  postId: true,
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).pick({
  postId: true,
});

export const views = pgTable("views", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertViewSchema = createInsertSchema(views).pick({
  postId: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

export type InsertPostTag = z.infer<typeof insertPostTagSchema>;
export type PostTag = typeof postTags.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;

export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;

export type InsertView = z.infer<typeof insertViewSchema>;
export type View = typeof views.$inferSelect;
