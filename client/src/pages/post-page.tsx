import { useEffect } from "react";
import { useParams, Link as RouterLink } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Heart, MessageCircle, Bookmark, Share2, BookmarkCheck, Edit, ArrowLeft } from "lucide-react";
import { formatDate, getInitials, getRandomAvatar, getReadingTime } from "@/lib/utils";
import { CategoryBadge } from "@/components/category-badge";
import { CommentForm } from "@/components/comment-form";
import { CommentList } from "@/components/comment-list";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const postId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();

  // Get post
  const { data: post, isLoading: isLoadingPost, error: postError } = useQuery({
    queryKey: ["/api/posts", postId],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${postId}`);
      if (!res.ok) throw new Error("Failed to fetch post");
      return await res.json();
    },
  });

  // Get post author
  const { data: author } = useQuery({
    queryKey: ["/api/user", post?.userId],
    queryFn: async () => {
      const res = await fetch(`/api/user/${post?.userId}`);
      if (!res.ok) return { username: "Unknown", displayName: "Unknown Author" };
      return await res.json();
    },
    enabled: !!post?.userId,
  });

  // Get post category
  const { data: category } = useQuery({
    queryKey: ["/api/categories", post?.categoryId],
    queryFn: async () => {
      if (!post?.categoryId) return null;
      const res = await fetch(`/api/categories/${post.categoryId}`);
      if (!res.ok) return null;
      return await res.json();
    },
    enabled: !!post?.categoryId,
  });

  // Get post tags
  const { data: tags } = useQuery({
    queryKey: ["/api/posts", postId, "tags"],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${postId}/tags`);
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!postId,
  });

  // Get post likes
  const { data: likes } = useQuery({
    queryKey: ["/api/posts", postId, "likes"],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${postId}/likes`);
      if (!res.ok) return { count: 0, userLiked: false };
      return await res.json();
    },
    enabled: !!postId,
  });

  // Get post comments
  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ["/api/posts", postId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!postId,
  });

  // Get bookmark status
  const { data: bookmarkStatus } = useQuery({
    queryKey: ["/api/bookmarks", postId],
    queryFn: async () => {
      if (!user) return { isBookmarked: false };
      try {
        const res = await fetch("/api/bookmarks");
        if (!res.ok) return { isBookmarked: false };
        const bookmarks = await res.json();
        return { 
          isBookmarked: bookmarks.some((b: any) => b.postId === postId) 
        };
      } catch (e) {
        return { isBookmarked: false };
      }
    },
    enabled: !!user && !!postId,
  });

  // Like post mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (likes?.userLiked) {
        await apiRequest("DELETE", `/api/likes/${postId}`);
      } else {
        await apiRequest("POST", "/api/likes", { postId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "likes"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update like: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Bookmark post mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (bookmarkStatus?.isBookmarked) {
        await apiRequest("DELETE", `/api/bookmarks/${postId}`);
      } else {
        await apiRequest("POST", "/api/bookmarks", { postId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks", postId] });
      
      toast({
        title: bookmarkStatus?.isBookmarked ? "Bookmark removed" : "Bookmark added",
        description: bookmarkStatus?.isBookmarked 
          ? "This post has been removed from your bookmarks" 
          : "This post has been added to your bookmarks",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update bookmark: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add comment mutation
  const commentMutation = useMutation({
    mutationFn: async (data: { content: string, postId: number }) => {
      const res = await apiRequest("POST", "/api/comments", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add comment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCommentSubmit = (data: { content: string, postId: number }) => {
    commentMutation.mutate(data);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Post link copied to clipboard",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const isAuthor = user?.id === post?.userId;
  const displayName = author?.displayName || author?.username || 'Unknown';
  const avatarUrl = author?.avatarUrl || getRandomAvatar(displayName);
  const initials = getInitials(displayName);
  const readTime = post?.readTime || (post?.content ? getReadingTime(post.content) : "5 min read");

  if (isLoadingPost) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        </div>
      </MainLayout>
    );
  }

  if (postError || !post) {
    return (
      <MainLayout>
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold mb-2">Error Loading Post</h2>
          <p>We couldn't load this post. It may have been deleted or you may not have permission to view it.</p>
          <Button as={RouterLink} href="/" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Back button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" as={RouterLink} href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to feed
        </Button>
      </div>

      {/* Post Header */}
      <div className="mb-8">
        {category && (
          <div className="mb-3">
            <CategoryBadge category={category} />
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(post.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <span className="mr-2">{readTime}</span>
            <span>·</span>
            <span className="ml-2">{likes?.count || 0} likes</span>
          </div>
        </div>
      </div>

      {/* Cover image */}
      {post.coverImage && (
        <div className="mb-8">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-auto rounded-lg object-cover max-h-[500px]"
          />
        </div>
      )}

      {/* Post content */}
      <div 
        className="prose dark:prose-invert max-w-none mb-8"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: any) => (
              <span 
                key={tag.id}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <Separator className="my-8" />

      {/* Action buttons */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={likes?.userLiked ? "default" : "outline"} 
                  size="sm"
                  onClick={() => likeMutation.mutate()}
                  disabled={!user || likeMutation.isPending}
                  className={likes?.userLiked ? "bg-red-500 hover:bg-red-600" : ""}
                >
                  <Heart className={`h-4 w-4 mr-1 ${likes?.userLiked ? "fill-current" : ""}`} />
                  {likes?.count || 0}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {user ? (likes?.userLiked ? "Unlike" : "Like") : "Sign in to like"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.getElementById("comments-section")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {comments?.length || 0}
                </Button>
              </TooltipTrigger>
              <TooltipContent>View comments</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={bookmarkStatus?.isBookmarked ? "default" : "outline"} 
                  size="sm"
                  onClick={() => bookmarkMutation.mutate()}
                  disabled={!user || bookmarkMutation.isPending}
                  className={bookmarkStatus?.isBookmarked ? "bg-primary-500 hover:bg-primary-600" : ""}
                >
                  {bookmarkStatus?.isBookmarked ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {user 
                  ? (bookmarkStatus?.isBookmarked ? "Remove from bookmarks" : "Add to bookmarks") 
                  : "Sign in to bookmark"
                }
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>

          {isAuthor && (
            <Button variant="outline" size="sm" as={RouterLink} href={`/edit-post/${post.id}`}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Comments section */}
      <div id="comments-section" className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Comments {comments?.length > 0 && `(${comments.length})`}
        </h2>

        {user ? (
          <div className="mb-8">
            <CommentForm 
              postId={post.id} 
              onSubmit={handleCommentSubmit} 
              isSubmitting={commentMutation.isPending} 
            />
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-8 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Sign in to join the conversation
            </p>
            <Button as={RouterLink} href="/auth">
              Sign In
            </Button>
          </div>
        )}

        {isLoadingComments ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <CommentList comments={comments || []} postId={post.id} />
        )}
      </div>
    </MainLayout>
  );
}
