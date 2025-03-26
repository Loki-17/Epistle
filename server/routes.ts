import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertPostSchema, insertCommentSchema, insertTagSchema, insertLikeSchema, insertBookmarkSchema, insertViewSchema } from "@shared/schema";

// Middleware to ensure user is authenticated
function ensureAuthenticated(req: Request, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send("Unauthorized");
}

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Categories
  app.get("/api/categories", async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get("/api/categories/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send("Invalid category ID");
    }
    
    const category = await storage.getCategoryById(id);
    if (!category) {
      return res.status(404).send("Category not found");
    }
    
    res.json(category);
  });

  // Posts
  app.get("/api/posts", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    
    const posts = await storage.getPosts(limit, offset);
    res.json(posts);
  });

  app.get("/api/posts/user/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).send("Invalid user ID");
    }
    
    const posts = await storage.getPostsByUser(userId);
    res.json(posts);
  });

  app.get("/api/posts/category/:categoryId", async (req, res) => {
    const categoryId = parseInt(req.params.categoryId);
    if (isNaN(categoryId)) {
      return res.status(400).send("Invalid category ID");
    }
    
    const posts = await storage.getPostsByCategory(categoryId);
    res.json(posts);
  });

  app.get("/api/posts/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send("Invalid post ID");
    }
    
    const post = await storage.getPostById(id);
    if (!post) {
      return res.status(404).send("Post not found");
    }
    
    // Record a view
    if (req.isAuthenticated()) {
      await storage.createView({ postId: id }, req.user.id);
    } else {
      await storage.createView({ postId: id });
    }
    
    res.json(post);
  });

  app.post("/api/posts", ensureAuthenticated, async (req, res) => {
    try {
      const postData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(postData, req.user.id);
      
      // Handle tags if provided
      if (req.body.tags && Array.isArray(req.body.tags)) {
        for (const tagName of req.body.tags) {
          const tag = await storage.createTag({ name: tagName });
          await storage.addTagToPost(post.id, tag.id);
        }
      }
      
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Error creating post");
    }
  });

  app.put("/api/posts/:id", ensureAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send("Invalid post ID");
    }
    
    const post = await storage.getPostById(id);
    if (!post) {
      return res.status(404).send("Post not found");
    }
    
    if (post.userId !== req.user.id) {
      return res.status(403).send("You don't have permission to edit this post");
    }
    
    try {
      const postData = insertPostSchema.partial().parse(req.body);
      const updatedPost = await storage.updatePost(id, postData);
      
      // Handle tags if provided
      if (req.body.tags && Array.isArray(req.body.tags)) {
        // Get current tags
        const currentTags = await storage.getPostTags(id);
        const currentTagNames = currentTags.map(tag => tag.name);
        
        // Add new tags
        for (const tagName of req.body.tags) {
          if (!currentTagNames.includes(tagName)) {
            const tag = await storage.createTag({ name: tagName });
            await storage.addTagToPost(id, tag.id);
          }
        }
        
        // Remove tags not in the new list
        for (const tag of currentTags) {
          if (!req.body.tags.includes(tag.name)) {
            await storage.removeTagFromPost(id, tag.id);
          }
        }
      }
      
      res.json(updatedPost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Error updating post");
    }
  });

  app.delete("/api/posts/:id", ensureAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send("Invalid post ID");
    }
    
    const post = await storage.getPostById(id);
    if (!post) {
      return res.status(404).send("Post not found");
    }
    
    if (post.userId !== req.user.id) {
      return res.status(403).send("You don't have permission to delete this post");
    }
    
    const success = await storage.deletePost(id);
    if (success) {
      res.sendStatus(204);
    } else {
      res.status(500).send("Error deleting post");
    }
  });

  // Tags
  app.get("/api/tags", async (req, res) => {
    const tags = await storage.getTags();
    res.json(tags);
  });

  app.get("/api/posts/:id/tags", async (req, res) => {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).send("Invalid post ID");
    }
    
    const tags = await storage.getPostTags(postId);
    res.json(tags);
  });

  // Comments
  app.get("/api/posts/:id/comments", async (req, res) => {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).send("Invalid post ID");
    }
    
    const comments = await storage.getCommentsByPost(postId);
    
    // Get user info for each comment
    const commentsWithUser = await Promise.all(
      comments.map(async (comment) => {
        const user = await storage.getUser(comment.userId);
        return {
          ...comment,
          user: user ? {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl
          } : null
        };
      })
    );
    
    res.json(commentsWithUser);
  });

  app.post("/api/comments", ensureAuthenticated, async (req, res) => {
    try {
      const commentData = insertCommentSchema.parse(req.body);
      const post = await storage.getPostById(commentData.postId);
      
      if (!post) {
        return res.status(404).send("Post not found");
      }
      
      const comment = await storage.createComment(commentData, req.user.id);
      
      // Include user info with the response
      const user = await storage.getUser(req.user.id);
      const responseData = {
        ...comment,
        user: user ? {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl
        } : null
      };
      
      res.status(201).json(responseData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Error creating comment");
    }
  });

  app.delete("/api/comments/:id", ensureAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).send("Invalid comment ID");
    }
    
    const comment = await storage.getCommentsByPost(id)
      .then(comments => comments.find(c => c.id === id));
    
    if (!comment) {
      return res.status(404).send("Comment not found");
    }
    
    if (comment.userId !== req.user.id) {
      return res.status(403).send("You don't have permission to delete this comment");
    }
    
    const success = await storage.deleteComment(id);
    if (success) {
      res.sendStatus(204);
    } else {
      res.status(500).send("Error deleting comment");
    }
  });

  // Likes
  app.get("/api/posts/:id/likes", async (req, res) => {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).send("Invalid post ID");
    }
    
    const count = await storage.getLikeCount(postId);
    const userLiked = req.isAuthenticated() ? 
      !!(await storage.getLikeByUserAndPost(req.user.id, postId)) : false;
    
    res.json({ count, userLiked });
  });

  app.post("/api/likes", ensureAuthenticated, async (req, res) => {
    try {
      const likeData = insertLikeSchema.parse(req.body);
      const post = await storage.getPostById(likeData.postId);
      
      if (!post) {
        return res.status(404).send("Post not found");
      }
      
      const like = await storage.createLike(likeData, req.user.id);
      res.status(201).json(like);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Error creating like");
    }
  });

  app.delete("/api/likes/:postId", ensureAuthenticated, async (req, res) => {
    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) {
      return res.status(400).send("Invalid post ID");
    }
    
    const success = await storage.deleteLike(req.user.id, postId);
    if (success) {
      res.sendStatus(204);
    } else {
      res.status(404).send("Like not found");
    }
  });

  // Bookmarks
  app.get("/api/bookmarks", ensureAuthenticated, async (req, res) => {
    const bookmarks = await storage.getBookmarksByUser(req.user.id);
    
    // Get post info for each bookmark
    const bookmarksWithPosts = await Promise.all(
      bookmarks.map(async (bookmark) => {
        const post = await storage.getPostById(bookmark.postId);
        return {
          ...bookmark,
          post
        };
      })
    );
    
    res.json(bookmarksWithPosts);
  });

  app.post("/api/bookmarks", ensureAuthenticated, async (req, res) => {
    try {
      const bookmarkData = insertBookmarkSchema.parse(req.body);
      const post = await storage.getPostById(bookmarkData.postId);
      
      if (!post) {
        return res.status(404).send("Post not found");
      }
      
      const bookmark = await storage.createBookmark(bookmarkData, req.user.id);
      res.status(201).json(bookmark);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Error creating bookmark");
    }
  });

  app.delete("/api/bookmarks/:postId", ensureAuthenticated, async (req, res) => {
    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) {
      return res.status(400).send("Invalid post ID");
    }
    
    const success = await storage.deleteBookmark(req.user.id, postId);
    if (success) {
      res.sendStatus(204);
    } else {
      res.status(404).send("Bookmark not found");
    }
  });

  // Dashboard statistics
  app.get("/api/dashboard/stats", ensureAuthenticated, async (req, res) => {
    const stats = await storage.getUserStats(req.user.id);
    res.json(stats);
  });

  const httpServer = createServer(app);
  return httpServer;
}
