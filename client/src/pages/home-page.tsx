import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Filter, Tag } from "lucide-react";
import { Post, Category } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Get all posts
  const { data: posts, isLoading: isLoadingPosts, error: postsError } = useQuery({
    queryKey: ["/api/posts", page, limit, selectedCategory, sortBy],
    queryFn: async () => {
      let url = `/api/posts?limit=${limit}&offset=${(page - 1) * limit}`;
      if (selectedCategory) {
        url = `/api/posts/category/${selectedCategory}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return await res.json();
    },
  });

  // Get all categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return await res.json();
    },
  });

  // Filter posts based on search query
  const filteredPosts = posts?.filter((post: Post) => {
    if (!searchQuery.trim()) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(searchLower) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchLower))
    );
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSortBy("latest");
  };

  const getCategoryById = (id: number | null): Category | undefined => {
    if (!id || !categories) return undefined;
    return categories.find((cat: Category) => cat.id === id);
  };

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setFilterOpen(false);
  };

  const handleSortChange = (sort: "latest" | "popular") => {
    setSortBy(sort);
    setFilterOpen(false);
  };

  return (
    <MainLayout>
      {/* Feed Header with Filters */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">Your Feed</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-auto"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex gap-2">
            <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="font-medium px-2 py-1.5 text-sm">Categories</div>
                <DropdownMenuItem 
                  onClick={() => handleCategoryChange(null)}
                  className={!selectedCategory ? "bg-accent text-accent-foreground" : ""}
                >
                  All Categories
                </DropdownMenuItem>
                {categories?.map((category: Category) => (
                  <DropdownMenuItem 
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={selectedCategory === category.id ? "bg-accent text-accent-foreground" : ""}
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Tag className="h-4 w-4" />
                  {sortBy === "latest" ? "Latest" : "Popular"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => handleSortChange("latest")}
                  className={sortBy === "latest" ? "bg-accent text-accent-foreground" : ""}
                >
                  Latest
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleSortChange("popular")}
                  className={sortBy === "popular" ? "bg-accent text-accent-foreground" : ""}
                >
                  Popular
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {(searchQuery || selectedCategory || sortBy !== "latest") && (
              <Button variant="ghost" onClick={clearFilters} size="sm">
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {selectedCategory && (
        <div className="mb-4 flex items-center text-sm text-muted-foreground">
          <span className="font-medium mr-2">Filtered by:</span>
          <span className="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-2 py-1 rounded-full text-xs flex items-center">
            {getCategoryById(selectedCategory)?.name}
            <button 
              onClick={() => setSelectedCategory(null)} 
              className="ml-1 hover:text-primary-900 dark:hover:text-primary-300"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* Posts List */}
      {isLoadingPosts ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : postsError ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
          <p>Error loading posts. Please try again later.</p>
        </div>
      ) : filteredPosts?.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">No posts found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? `No posts match your search for "${searchQuery}"`
              : selectedCategory
                ? "No posts in this category"
                : "There are no posts yet"
            }
          </p>
          {(searchQuery || selectedCategory) && (
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {filteredPosts?.map((post: Post) => (
            <PostCard
              key={post.id}
              post={post}
              category={getCategoryById(post.categoryId || 0)}
              hasImage={!!post.coverImage}
            />
          ))}
          
          {/* Pagination */}
          {filteredPosts?.length >= limit && (
            <div className="mt-8 flex justify-center">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </MainLayout>
  );
}
