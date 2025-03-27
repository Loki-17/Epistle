import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { PostCard } from "@/components/post-card";
import { Category, Post } from "@shared/schema";

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Get all posts
  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ["/api/posts"],
    queryFn: async () => {
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error("Failed to fetch posts");
      return await res.json();
    },
  });

  // Get categories
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return await res.json();
    },
  });

  // Get tags
  const { data: tags } = useQuery({
    queryKey: ["/api/tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags");
      if (!res.ok) throw new Error("Failed to fetch tags");
      return await res.json();
    },
  });

  // Filter and sort posts
  const filteredPosts = posts
    ?.filter((post: Post) => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      return (
        post.title.toLowerCase().includes(searchLower) ||
        post.excerpt?.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower)
      );
    })
    .sort((a: Post, b: Post) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Explore
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoadingPosts ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        ) : filteredPosts?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
              No posts found. Try adjusting your search.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredPosts?.map((post: Post) => {
              const category = categories?.find(
                (c: Category) => c.id === post.categoryId
              );
              return (
                <PostCard
                  key={post.id}
                  post={post}
                  category={category}
                />
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 