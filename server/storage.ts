import { users, type User, type InsertUser, posts, type Post, type InsertPost, categories, type Category, type InsertCategory, tags, type Tag, type InsertTag, postTags, type PostTag, type InsertPostTag, comments, type Comment, type InsertComment, likes, type Like, type InsertLike, bookmarks, type Bookmark, type InsertBookmark, views, type View, type InsertView } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private posts: Map<number, Post>;
  private tags: Map<number, Tag>;
  private postTags: Map<number, PostTag>;
  private comments: Map<number, Comment>;
  private likes: Map<number, Like>;
  private bookmarks: Map<number, Bookmark>;
  private views: Map<number, View>;
  sessionStore: session.SessionStore;
  
  private userId: number;
  private categoryId: number;
  private postId: number;
  private tagId: number;
  private postTagId: number;
  private commentId: number;
  private likeId: number;
  private bookmarkId: number;
  private viewId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.posts = new Map();
    this.tags = new Map();
    this.postTags = new Map();
    this.comments = new Map();
    this.likes = new Map();
    this.bookmarks = new Map();
    this.views = new Map();
    
    this.userId = 1;
    this.categoryId = 1;
    this.postId = 1;
    this.tagId = 1;
    this.postTagId = 1;
    this.commentId = 1;
    this.likeId = 1;
    this.bookmarkId = 1;
    this.viewId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with some default categories
    this.createCategory({ name: "Technology", slug: "technology" });
    this.createCategory({ name: "Business", slug: "business" });
    this.createCategory({ name: "Design", slug: "design" });
    this.createCategory({ name: "Productivity", slug: "productivity" });
    this.createCategory({ name: "Lifestyle", slug: "lifestyle" });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.slug === slug
    );
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  // Post methods
  async getPosts(limit = 10, offset = 0): Promise<Post[]> {
    return Array.from(this.posts.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
  }
  
  async getPostsByUser(userId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getPostsByCategory(categoryId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.categoryId === categoryId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getPostById(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }
  
  async createPost(postData: InsertPost, userId: number): Promise<Post> {
    const id = this.postId++;
    const now = new Date();
    const post: Post = {
      ...postData,
      id,
      userId,
      createdAt: now,
      updatedAt: now,
      published: postData.published ?? true,
    };
    this.posts.set(id, post);
    return post;
  }
  
  async updatePost(id: number, postData: Partial<InsertPost>): Promise<Post | undefined> {
    const post = await this.getPostById(id);
    if (!post) return undefined;
    
    const updatedPost: Post = {
      ...post,
      ...postData,
      updatedAt: new Date(),
    };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }
  
  async deletePost(id: number): Promise<boolean> {
    const exists = this.posts.has(id);
    if (exists) {
      this.posts.delete(id);
      // Clean up related entities
      const commentsToDelete = Array.from(this.comments.values())
        .filter(comment => comment.postId === id);
      
      commentsToDelete.forEach(comment => {
        this.comments.delete(comment.id);
      });
      
      const likesToDelete = Array.from(this.likes.values())
        .filter(like => like.postId === id);
      
      likesToDelete.forEach(like => {
        this.likes.delete(like.id);
      });
      
      const bookmarksToDelete = Array.from(this.bookmarks.values())
        .filter(bookmark => bookmark.postId === id);
      
      bookmarksToDelete.forEach(bookmark => {
        this.bookmarks.delete(bookmark.id);
      });
      
      const postTagsToDelete = Array.from(this.postTags.values())
        .filter(postTag => postTag.postId === id);
      
      postTagsToDelete.forEach(postTag => {
        this.postTags.delete(postTag.id);
      });
      
      const viewsToDelete = Array.from(this.views.values())
        .filter(view => view.postId === id);
      
      viewsToDelete.forEach(view => {
        this.views.delete(view.id);
      });
    }
    return exists;
  }

  // Tag methods
  async getTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }
  
  async getTagById(id: number): Promise<Tag | undefined> {
    return this.tags.get(id);
  }
  
  async createTag(tag: InsertTag): Promise<Tag> {
    const existingTag = Array.from(this.tags.values()).find(
      t => t.name.toLowerCase() === tag.name.toLowerCase()
    );
    
    if (existingTag) {
      return existingTag;
    }
    
    const id = this.tagId++;
    const newTag: Tag = { ...tag, id };
    this.tags.set(id, newTag);
    return newTag;
  }
  
  async getPostTags(postId: number): Promise<Tag[]> {
    const postTagIds = Array.from(this.postTags.values())
      .filter(pt => pt.postId === postId)
      .map(pt => pt.tagId);
    
    return Array.from(this.tags.values())
      .filter(tag => postTagIds.includes(tag.id));
  }
  
  async addTagToPost(postId: number, tagId: number): Promise<PostTag> {
    // Check if already exists
    const existing = Array.from(this.postTags.values()).find(
      pt => pt.postId === postId && pt.tagId === tagId
    );
    
    if (existing) {
      return existing;
    }
    
    const id = this.postTagId++;
    const postTag: PostTag = { id, postId, tagId };
    this.postTags.set(id, postTag);
    return postTag;
  }
  
  async removeTagFromPost(postId: number, tagId: number): Promise<boolean> {
    const postTag = Array.from(this.postTags.values()).find(
      pt => pt.postId === postId && pt.tagId === tagId
    );
    
    if (postTag) {
      this.postTags.delete(postTag.id);
      return true;
    }
    
    return false;
  }

  // Comment methods
  async getCommentsByPost(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async createComment(commentData: InsertComment, userId: number): Promise<Comment> {
    const id = this.commentId++;
    const comment: Comment = {
      ...commentData,
      id,
      userId,
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    return comment;
  }
  
  async deleteComment(id: number): Promise<boolean> {
    const exists = this.comments.has(id);
    if (exists) {
      this.comments.delete(id);
    }
    return exists;
  }

  // Like methods
  async getLikesByPost(postId: number): Promise<Like[]> {
    return Array.from(this.likes.values())
      .filter(like => like.postId === postId);
  }
  
  async getLikeCount(postId: number): Promise<number> {
    return (await this.getLikesByPost(postId)).length;
  }
  
  async getLikeByUserAndPost(userId: number, postId: number): Promise<Like | undefined> {
    return Array.from(this.likes.values()).find(
      like => like.userId === userId && like.postId === postId
    );
  }
  
  async createLike(likeData: InsertLike, userId: number): Promise<Like> {
    // Check if already exists
    const existing = await this.getLikeByUserAndPost(userId, likeData.postId);
    if (existing) {
      return existing;
    }
    
    const id = this.likeId++;
    const like: Like = {
      ...likeData,
      id,
      userId,
    };
    this.likes.set(id, like);
    return like;
  }
  
  async deleteLike(userId: number, postId: number): Promise<boolean> {
    const like = await this.getLikeByUserAndPost(userId, postId);
    if (like) {
      this.likes.delete(like.id);
      return true;
    }
    return false;
  }

  // Bookmark methods
  async getBookmarksByUser(userId: number): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getBookmarkByUserAndPost(userId: number, postId: number): Promise<Bookmark | undefined> {
    return Array.from(this.bookmarks.values()).find(
      bookmark => bookmark.userId === userId && bookmark.postId === postId
    );
  }
  
  async createBookmark(bookmarkData: InsertBookmark, userId: number): Promise<Bookmark> {
    // Check if already exists
    const existing = await this.getBookmarkByUserAndPost(userId, bookmarkData.postId);
    if (existing) {
      return existing;
    }
    
    const id = this.bookmarkId++;
    const bookmark: Bookmark = {
      ...bookmarkData,
      id,
      userId,
      createdAt: new Date(),
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }
  
  async deleteBookmark(userId: number, postId: number): Promise<boolean> {
    const bookmark = await this.getBookmarkByUserAndPost(userId, postId);
    if (bookmark) {
      this.bookmarks.delete(bookmark.id);
      return true;
    }
    return false;
  }

  // View methods
  async createView(viewData: InsertView, userId?: number): Promise<View> {
    const id = this.viewId++;
    const view: View = {
      ...viewData,
      id,
      userId: userId || null,
      createdAt: new Date(),
    };
    this.views.set(id, view);
    return view;
  }
  
  async getViewCount(postId: number): Promise<number> {
    return Array.from(this.views.values())
      .filter(view => view.postId === postId)
      .length;
  }

  // Dashboard analytics methods
  async getUserStats(userId: number): Promise<{
    totalPosts: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
  }> {
    const userPosts = Array.from(this.posts.values())
      .filter(post => post.userId === userId);
    
    const totalPosts = userPosts.length;
    
    const postIds = userPosts.map(post => post.id);
    
    const totalViews = Array.from(this.views.values())
      .filter(view => postIds.includes(view.postId))
      .length;
    
    const totalLikes = Array.from(this.likes.values())
      .filter(like => postIds.includes(like.postId))
      .length;
    
    const totalComments = Array.from(this.comments.values())
      .filter(comment => postIds.includes(comment.postId))
      .length;
    
    return {
      totalPosts,
      totalViews,
      totalLikes,
      totalComments,
    };
  }
}

export const storage = new MemStorage();
