import { useEffect } from "react";
import { useParams, Link } from "wouter";
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
      if (!post?.userId) return null;
      const res = await fetch(`/api/user/${post.userId}`);
      if (!res.ok) return null;
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
          <Link href="/">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Back button */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to feed
          </Button>
        </Link>
      </div>

      {/* Post header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Avatar>
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {displayName}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(post.createdAt)} · {readTime}
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {post.title}
        </h1>

        {category && (
          <CategoryBadge category={category} />
        )}
      </div>

      {/* Post content */}
      {post.coverImage && (
        <div className="mb-8">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-auto rounded-lg"
          />
        </div>
      )}

      <div className="prose dark:prose-invert max-w-none mb-8">
        {post.content}
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: any) => (
              <span
                key={tag.id}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-4 mb-8">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => likeMutation.mutate()}
                className={likes?.userLiked ? "text-red-500" : ""}
              >
                <Heart className="h-4 w-4 mr-2" />
                {likes?.count || 0}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{likes?.userLiked ? "Unlike" : "Like"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {}}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {comments?.length || 0}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Comment</p>
            </TooltipContent>
          </Tooltip>

          {user && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => bookmarkMutation.mutate()}
                  className={bookmarkStatus?.isBookmarked ? "text-primary-500" : ""}
                >
                  {bookmarkStatus?.isBookmarked ? (
                    <BookmarkCheck className="h-4 w-4 mr-2" />
                  ) : (
                    <Bookmark className="h-4 w-4 mr-2" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{bookmarkStatus?.isBookmarked ? "Remove bookmark" : "Bookmark"}</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share</p>
            </TooltipContent>
          </Tooltip>

          {isAuthor && (
            <Link href={`/edit-post/${postId}`}>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
        </TooltipProvider>
      </div>

      <Separator className="my-8" />

      {/* Comments section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Comments
        </h2>
        {user ? (
          <CommentForm 
            onSubmit={handleCommentSubmit} 
            postId={postId}
            isSubmitting={commentMutation.isPending}
          />
        ) : (
          <Link href="/auth">
            <Button variant="outline" size="sm">
              Sign in to comment
            </Button>
          </Link>
        )}
      </div>

      {isLoadingComments ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : comments?.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <CommentList comments={comments} postId={postId} />
      )}
    </MainLayout>
  );
}
