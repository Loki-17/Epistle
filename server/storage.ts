import { users, type User, type InsertUser, posts, type Post, type InsertPost, categories, type Category, type InsertCategory, tags, type Tag, type InsertTag, postTags, type PostTag, type InsertPostTag, comments, type Comment, type InsertComment, likes, type Like, type InsertLike, bookmarks, type Bookmark, type InsertBookmark, views, type View, type InsertView } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { pool } from "./db";
import { dbStorage } from "./db-storage";

const MemoryStore = createMemoryStore(session);

// Define the storage interface
export interface IStorage {
  // User related
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  
  // Category related
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Post related
  getPosts(limit?: number, offset?: number): Promise<Post[]>;
  getPostsByUser(userId: number): Promise<Post[]>;
  getPostsByCategory(categoryId: number): Promise<Post[]>;
  getPostById(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost, userId: number): Promise<Post>;
  updatePost(id: number, postData: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  
  // Tag related
  getTags(): Promise<Tag[]>;
  getTagById(id: number): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  getPostTags(postId: number): Promise<Tag[]>;
  addTagToPost(postId: number, tagId: number): Promise<PostTag>;
  removeTagFromPost(postId: number, tagId: number): Promise<boolean>;
  
  // Comment related
  getCommentsByPost(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment, userId: number): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;
  
  // Like related
  getLikesByPost(postId: number): Promise<Like[]>;
  getLikeCount(postId: number): Promise<number>;
  getLikeByUserAndPost(userId: number, postId: number): Promise<Like | undefined>;
  createLike(like: InsertLike, userId: number): Promise<Like>;
  deleteLike(userId: number, postId: number): Promise<boolean>;
  
  // Bookmark related
  getBookmarksByUser(userId: number): Promise<Bookmark[]>;
  getBookmarkByUserAndPost(userId: number, postId: number): Promise<Bookmark | undefined>;
  createBookmark(bookmark: InsertBookmark, userId: number): Promise<Bookmark>;
  deleteBookmark(userId: number, postId: number): Promise<boolean>;
  
  // View related
  createView(view: InsertView, userId?: number): Promise<View>;
  getViewCount(postId: number): Promise<number>;
  
  // Dashboard analytics
  getUserStats(userId: number): Promise<{
    totalPosts: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
  }>;
  
  // Session store
  sessionStore: session.Store;
}

// We're using the database storage implementation for our application
export const storage = dbStorage;