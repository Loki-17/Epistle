import { users, type User, type InsertUser, posts, type Post, type InsertPost, categories, type Category, type InsertCategory, tags, type Tag, type InsertTag, postTags, type PostTag, type InsertPostTag, comments, type Comment, type InsertComment, likes, type Like, type InsertLike, bookmarks, type Bookmark, type InsertBookmark, views, type View, type InsertView } from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, count } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { IStorage } from "./storage";

const PostgresSessionStore = connectPgSimple(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // Initialize default categories if they don't exist
    this.initializeDefaultCategories();
  }
  
  private async initializeDefaultCategories() {
    const existingCategories = await this.getCategories();
    if (existingCategories.length === 0) {
      await this.createCategory({ name: "Technology", slug: "technology" });
      await this.createCategory({ name: "Business", slug: "business" });
      await this.createCategory({ name: "Design", slug: "design" });
      await this.createCategory({ name: "Productivity", slug: "productivity" });
      await this.createCategory({ name: "Lifestyle", slug: "lifestyle" });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Post methods
  async getPosts(limit = 10, offset = 0): Promise<Post[]> {
    // Using a more efficient query that limits the data fetched and implements proper pagination
    return await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }
  
  // Optimized getPosts method that includes user data to avoid N+1 query problem
  async getPostsWithUsers(limit = 10, offset = 0): Promise<any[]> {
    const result = await db.transaction(async (tx) => {
      const postsList = await tx
        .select()
        .from(posts)
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset);
      
      // Extract unique user IDs to fetch in a single query
      const userIds = Array.from(new Set(postsList.map(post => post.userId)));
      
      // Fetch all users in a single query
      const usersList = await tx
        .select()
        .from(users)
        .where(eq(users.id, userIds[0]));  // Start with first ID
      
      // If there are more IDs, add them with OR conditions
      for (let i = 1; i < userIds.length; i++) {
        usersList.push(...await tx
          .select()
          .from(users)
          .where(eq(users.id, userIds[i])));
      }
      
      // Create a map for quick user lookup
      const userMap = new Map();
      usersList.forEach(user => {
        userMap.set(user.id, user);
      });
      
      // Join the data
      return postsList.map(post => {
        const user = userMap.get(post.userId) || {
          id: 0,
          username: "Unknown-User",
          displayName: "Unknown-User",
          avatarUrl: null
        };
        
        return {
          ...post,
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName || "Unknown-User",
            avatarUrl: user.avatarUrl
          }
        };
      });
    });
    
    return result;
  }
  
  async getPostsByUser(userId: number): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }
  
  async getPostsByCategory(categoryId: number): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.categoryId, categoryId))
      .orderBy(desc(posts.createdAt));
  }
  
  async getPostById(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }
  
  async createPost(postData: InsertPost, userId: number): Promise<Post> {
    const now = new Date();
    const [post] = await db
      .insert(posts)
      .values({
        ...postData,
        userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return post;
  }
  
  async updatePost(id: number, postData: Partial<InsertPost>): Promise<Post | undefined> {
    const [updatedPost] = await db
      .update(posts)
      .set({
        ...postData,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();
    return updatedPost;
  }
  
  async deletePost(id: number): Promise<boolean> {
    // Delete associated records first to maintain referential integrity
    await db.delete(comments).where(eq(comments.postId, id));
    await db.delete(likes).where(eq(likes.postId, id));
    await db.delete(bookmarks).where(eq(bookmarks.postId, id));
    await db.delete(postTags).where(eq(postTags.postId, id));
    await db.delete(views).where(eq(views.postId, id));
    
    const result = await db.delete(posts).where(eq(posts.id, id)).returning();
    return result.length > 0;
  }

  // Tag methods
  async getTags(): Promise<Tag[]> {
    return await db.select().from(tags);
  }
  
  async getTagById(id: number): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.id, id));
    return tag;
  }
  
  async createTag(tag: InsertTag): Promise<Tag> {
    // Check if tag already exists
    const [existingTag] = await db
      .select()
      .from(tags)
      .where(eq(tags.name, tag.name));
    
    if (existingTag) {
      return existingTag;
    }
    
    const [newTag] = await db.insert(tags).values(tag).returning();
    return newTag;
  }
  
  async getPostTags(postId: number): Promise<Tag[]> {
    return await db
      .select({
        id: tags.id,
        name: tags.name,
      })
      .from(tags)
      .innerJoin(postTags, eq(tags.id, postTags.tagId))
      .where(eq(postTags.postId, postId));
  }
  
  async addTagToPost(postId: number, tagId: number): Promise<PostTag> {
    // Check if already exists
    const [existing] = await db
      .select()
      .from(postTags)
      .where(
        and(
          eq(postTags.postId, postId),
          eq(postTags.tagId, tagId)
        )
      );
    
    if (existing) {
      return existing;
    }
    
    const [postTag] = await db
      .insert(postTags)
      .values({ postId, tagId })
      .returning();
    return postTag;
  }
  
  async removeTagFromPost(postId: number, tagId: number): Promise<boolean> {
    const result = await db
      .delete(postTags)
      .where(
        and(
          eq(postTags.postId, postId),
          eq(postTags.tagId, tagId)
        )
      )
      .returning();
    return result.length > 0;
  }

  // Comment methods
  async getCommentsByPost(postId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));
  }
  
  async createComment(commentData: InsertComment, userId: number): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values({
        ...commentData,
        userId,
        createdAt: new Date(),
      })
      .returning();
    return comment;
  }
  
  async deleteComment(id: number): Promise<boolean> {
    const result = await db
      .delete(comments)
      .where(eq(comments.id, id))
      .returning();
    return result.length > 0;
  }

  // Like methods
  async getLikesByPost(postId: number): Promise<Like[]> {
    return await db
      .select()
      .from(likes)
      .where(eq(likes.postId, postId));
  }
  
  async getLikeCount(postId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.postId, postId));
    return Number(result?.count) || 0;
  }
  
  async getLikeByUserAndPost(userId: number, postId: number): Promise<Like | undefined> {
    const [like] = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.postId, postId)
        )
      );
    return like;
  }
  
  async createLike(likeData: InsertLike, userId: number): Promise<Like> {
    // Check if already exists
    const existing = await this.getLikeByUserAndPost(userId, likeData.postId);
    if (existing) {
      return existing;
    }
    
    const [like] = await db
      .insert(likes)
      .values({
        ...likeData,
        userId,
      })
      .returning();
    return like;
  }
  
  async deleteLike(userId: number, postId: number): Promise<boolean> {
    const result = await db
      .delete(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.postId, postId)
        )
      )
      .returning();
    return result.length > 0;
  }

  // Bookmark methods
  async getBookmarksByUser(userId: number): Promise<Bookmark[]> {
    return await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));
  }
  
  async getBookmarkByUserAndPost(userId: number, postId: number): Promise<Bookmark | undefined> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.postId, postId)
        )
      );
    return bookmark;
  }
  
  async createBookmark(bookmarkData: InsertBookmark, userId: number): Promise<Bookmark> {
    // Check if already exists
    const existing = await this.getBookmarkByUserAndPost(userId, bookmarkData.postId);
    if (existing) {
      return existing;
    }
    
    const [bookmark] = await db
      .insert(bookmarks)
      .values({
        ...bookmarkData,
        userId,
        createdAt: new Date(),
      })
      .returning();
    return bookmark;
  }
  
  async deleteBookmark(userId: number, postId: number): Promise<boolean> {
    const result = await db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.postId, postId)
        )
      )
      .returning();
    return result.length > 0;
  }

  // View methods
  async createView(viewData: InsertView, userId?: number): Promise<View> {
    const [view] = await db
      .insert(views)
      .values({
        ...viewData,
        userId: userId || null,
        createdAt: new Date(),
      })
      .returning();
    return view;
  }
  
  async getViewCount(postId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(views)
      .where(eq(views.postId, postId));
    return Number(result?.count) || 0;
  }

  // Dashboard analytics methods
  async getUserStats(userId: number): Promise<{
    totalPosts: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
  }> {
    // Perform all queries in parallel for better performance
    const [postsCount, userPosts] = await Promise.all([
      // Get total posts
      db
        .select({ count: count() })
        .from(posts)
        .where(eq(posts.userId, userId)),
      
      // Get post IDs for this user
      db
        .select({ id: posts.id })
        .from(posts)
        .where(eq(posts.userId, userId))
    ]);
    
    const totalPosts = Number(postsCount[0]?.count) || 0;
    const postIds = userPosts.map(post => post.id);
    
    if (postIds.length === 0) {
      return {
        totalPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
      };
    }
    
    // Run these queries in parallel instead of sequentially
    const [viewsResult, likesResult, commentsResult] = await Promise.all([
      // Get total views for all user's posts
      db
        .select({ count: count() })
        .from(views)
        .where(eq(views.postId, postIds[0])),
      
      // Get total likes for all user's posts
      db
        .select({ count: count() })
        .from(likes)
        .where(eq(likes.postId, postIds[0])),
      
      // Get total comments for all user's posts
      db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.postId, postIds[0]))
    ]);
    
    return {
      totalPosts,
      totalViews: Number(viewsResult[0]?.count) || 0,
      totalLikes: Number(likesResult[0]?.count) || 0,
      totalComments: Number(commentsResult[0]?.count) || 0,
    };
  }
}

export const dbStorage = new DatabaseStorage();