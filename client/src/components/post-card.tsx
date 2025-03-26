import { Link } from "wouter";
import { Heart, MessageCircle, Bookmark, BookmarkCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate, getInitials, getRandomAvatar, truncateText } from "@/lib/utils";
import { CategoryBadge } from "./category-badge";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Post, Category } from "@shared/schema";
import { useState } from "react";

interface PostCardProps {
  post: Post;
  category?: Category | null;
  authorName?: string;
  authorImage?: string;
  hasImage?: boolean;
  onLikeToggle?: () => void;
  onBookmarkToggle?: () => void;
}

export function PostCard({
  post,
  category,
  authorName = "",
  authorImage,
  hasImage = false,
  onLikeToggle,
  onBookmarkToggle,
}: PostCardProps) {
  const { user } = useAuth();
  const [optimisticLiked, setOptimisticLiked] = useState(false);
  const [optimisticBookmarked, setOptimisticBookmarked] = useState(false);

  // Fetch category if not provided
  const { data: fetchedCategory } = useQuery({
    queryKey: ["/api/categories", post.categoryId],
    queryFn: async () => {
      if (!post.categoryId) return null;
      const res = await fetch(`/api/categories/${post.categoryId}`);
      if (!res.ok) return null;
      return await res.json();
    },
    enabled: !category && !!post.categoryId,
  });

  // Fetch post author info
  const { data: author } = useQuery({
    queryKey: ["/api/user", post.userId],
    queryFn: async () => {
      const res = await fetch(`/api/user/${post.userId}`);
      if (!res.ok) return { username: "Unknown", displayName: "Unknown Author" };
      return await res.json();
    },
  });

  // Fetch likes
  const { data: likes } = useQuery({
    queryKey: ["/api/posts", post.id, "likes"],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${post.id}/likes`);
      if (!res.ok) return { count: 0, userLiked: false };
      return await res.json();
    },
  });

  // Add or remove like
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (likes?.userLiked || optimisticLiked) {
        await apiRequest("DELETE", `/api/likes/${post.id}`);
      } else {
        await apiRequest("POST", "/api/likes", { postId: post.id });
      }
    },
    onMutate: () => {
      setOptimisticLiked(!optimisticLiked);
      if (onLikeToggle) onLikeToggle();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id, "likes"] });
    },
    onError: () => {
      setOptimisticLiked(!optimisticLiked);
      if (onLikeToggle) onLikeToggle();
    },
  });

  // Fetch bookmark status
  const { data: bookmarkStatus } = useQuery({
    queryKey: ["/api/bookmarks", post.id],
    queryFn: async () => {
      if (!user) return { isBookmarked: false };
      try {
        const res = await fetch("/api/bookmarks");
        if (!res.ok) return { isBookmarked: false };
        const bookmarks = await res.json();
        return { 
          isBookmarked: bookmarks.some((b: any) => b.postId === post.id) 
        };
      } catch (e) {
        return { isBookmarked: false };
      }
    },
    enabled: !!user,
  });

  // Add or remove bookmark
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (bookmarkStatus?.isBookmarked || optimisticBookmarked) {
        await apiRequest("DELETE", `/api/bookmarks/${post.id}`);
      } else {
        await apiRequest("POST", "/api/bookmarks", { postId: post.id });
      }
    },
    onMutate: () => {
      setOptimisticBookmarked(!optimisticBookmarked);
      if (onBookmarkToggle) onBookmarkToggle();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
    },
    onError: () => {
      setOptimisticBookmarked(!optimisticBookmarked);
      if (onBookmarkToggle) onBookmarkToggle();
    },
  });

  // Fetch comments count
  const { data: comments } = useQuery({
    queryKey: ["/api/posts", post.id, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      if (!res.ok) return [];
      return await res.json();
    },
  });

  const displayCategory = category || fetchedCategory;
  const displayAuthorName = authorName || author?.displayName || author?.username || "Unknown";
  const displayAuthorImage = authorImage || getRandomAvatar(displayAuthorName);
  const isLiked = likes?.userLiked || optimisticLiked;
  const isBookmarked = bookmarkStatus?.isBookmarked || optimisticBookmarked;
  const likeCount = likes?.count || 0;
  const commentCount = comments?.length || 0;

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    likeMutation.mutate();
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    bookmarkMutation.mutate();
  };

  return (
    <article className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300">
      <Link href={`/post/${post.id}`} className="block">
        {hasImage && post.coverImage && (
          <img 
            src={post.coverImage}
            alt={post.title}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-5">
          <div className="flex items-center space-x-2 mb-2">
            {displayCategory && (
              <CategoryBadge category={displayCategory} />
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {post.readTime ? `${post.readTime} min read` : "5 min read"}
            </span>
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{post.title}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
            {post.excerpt || truncateText(post.content.replace(/<[^>]*>?/gm, ''), 150)}
          </p>
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={displayAuthorImage} alt={displayAuthorName} />
              <AvatarFallback>{getInitials(displayAuthorName)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{displayAuthorName}</span>
            <span className="mx-2 text-gray-500">·</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(post.createdAt)}</span>
            <div className="ml-auto flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`flex items-center text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 ${isLiked ? 'text-red-500 dark:text-red-400' : ''}`}
                onClick={handleLikeClick}
              >
                <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                <span>{commentCount}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"
                onClick={handleBookmarkClick}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4 fill-current" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
