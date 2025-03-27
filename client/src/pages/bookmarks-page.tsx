import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { PostCard } from "@/components/post-card";
import { Category, Post } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface Bookmark {
  id: number;
  userId: number;
  postId: number;
  createdAt: string;
  post: Post;
}

export default function BookmarksPage() {
  // Get bookmarked posts
  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ["/api/bookmarks"],
    queryFn: async () => {
      const res = await fetch("/api/bookmarks");
      if (!res.ok) throw new Error("Failed to fetch bookmarks");
      return await res.json();
    },
  });

  // Get categories for posts
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return await res.json();
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </MainLayout>
    );
  }

  if (!bookmarks?.length) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No bookmarks yet
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Save posts you want to read later by clicking the bookmark icon.
              </p>
              <Link href="/">
                <Button>Browse Posts</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Bookmarks
        </h1>
        <div className="space-y-6">
          {bookmarks.map((bookmark: Bookmark) => {
            const category = categories?.find(
              (c: Category) => c.id === bookmark.post.categoryId
            );
            return (
              <PostCard
                key={bookmark.post.id}
                post={bookmark.post}
                category={category}
              />
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
} 