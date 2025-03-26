import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, FileText, Heart, MessageCircle, Edit, Trash2, ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Post } from "@shared/schema";

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("posts");

  // Get user stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return await res.json();
    },
  });

  // Get user posts
  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ["/api/posts/user", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/user/${user?.id}`);
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

  // Get bookmarks
  const { data: bookmarks, isLoading: isLoadingBookmarks } = useQuery({
    queryKey: ["/api/bookmarks"],
    queryFn: async () => {
      const res = await fetch("/api/bookmarks");
      if (!res.ok) throw new Error("Failed to fetch bookmarks");
      return await res.json();
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/user", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
      });
      setPostToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete post: ${error.message}`,
        variant: "destructive",
      });
      setPostToDelete(null);
    },
  });

  // Find category name by ID
  const getCategoryName = (categoryId: number | null | undefined) => {
    if (!categoryId || !categories) return "Uncategorized";
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  // Filter published/draft posts
  const publishedPosts = posts?.filter((post: Post) => post.published);
  const draftPosts = posts?.filter((post: Post) => !post.published);

  return (
    <MainLayout>
      <div className="border-b border-gray-200 dark:border-gray-700 pb-5 mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Manage your content and track performance
        </p>
      </div>

      {/* Stats Cards */}
      {isLoadingStats ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900 rounded-md p-3">
                  <Eye className="text-primary-600 dark:text-primary-400 h-5 w-5" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Views
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats?.totalViews || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 rounded-md p-3">
                  <FileText className="text-green-600 dark:text-green-400 h-5 w-5" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Published Posts
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats?.totalPosts || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 dark:bg-red-900 rounded-md p-3">
                  <Heart className="text-red-600 dark:text-red-400 h-5 w-5" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Likes
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats?.totalLikes || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 dark:bg-yellow-900 rounded-md p-3">
                  <MessageCircle className="text-yellow-600 dark:text-yellow-400 h-5 w-5" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Comments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats?.totalComments || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="border-b border-gray-200 dark:border-gray-700 w-full justify-start space-x-8 rounded-none bg-transparent p-0">
          <TabsTrigger 
            value="posts"
            className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 border-b-2 border-transparent pb-3 pt-2 px-1 rounded-none"
          >
            Posts
          </TabsTrigger>
          <TabsTrigger 
            value="drafts"
            className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 border-b-2 border-transparent pb-3 pt-2 px-1 rounded-none"
          >
            Drafts
          </TabsTrigger>
          <TabsTrigger 
            value="bookmarks"
            className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 border-b-2 border-transparent pb-3 pt-2 px-1 rounded-none"
          >
            Bookmarks
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="pt-4">
          {isLoadingPosts ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : publishedPosts?.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No published posts yet</h3>
              <p className="text-muted-foreground mb-6">Start creating and publishing your content</p>
              <Button as={Link} href="/create-post">
                Create Your First Post
              </Button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publishedPosts?.map((post: Post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>{getCategoryName(post.categoryId)}</TableCell>
                      <TableCell>{formatDate(post.createdAt)}</TableCell>
                      <TableCell>{post.views || 0}</TableCell>
                      <TableCell>{post.comments || 0}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/post/${post.id}`}>
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/edit-post/${post.id}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <AlertDialog open={postToDelete === post.id} onOpenChange={(open) => {
                          if (!open) setPostToDelete(null);
                        }}>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              onClick={() => setPostToDelete(post.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Post</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this post and all its comments. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletePostMutation.mutate(post.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                {deletePostMutation.isPending ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Drafts Tab */}
        <TabsContent value="drafts" className="pt-4">
          {isLoadingPosts ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : draftPosts?.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No drafts</h3>
              <p className="text-muted-foreground mb-6">Start creating your content</p>
              <Button as={Link} href="/create-post">
                Create New Post
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {draftPosts?.map((post: Post) => (
                <div key={post.id} className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="text-gray-400 mr-2 h-5 w-5" />
                        <p className="text-md font-medium text-primary-600 dark:text-primary-400 truncate">
                          {post.title}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-none">
                        Draft
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 sm:justify-between">
                      <div className="sm:flex space-y-2 sm:space-y-0 sm:space-x-6">
                        <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Tag className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {getCategoryName(post.categoryId)}
                        </p>
                        <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Eye className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          Last edited on {formatDate(post.updatedAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/edit-post/${post.id}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <AlertDialog open={postToDelete === post.id} onOpenChange={(open) => {
                          if (!open) setPostToDelete(null);
                        }}>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              onClick={() => setPostToDelete(post.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Draft</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this draft. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletePostMutation.mutate(post.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                {deletePostMutation.isPending ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Bookmarks Tab */}
        <TabsContent value="bookmarks" className="pt-4">
          {isLoadingBookmarks ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : !bookmarks || bookmarks.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No bookmarks yet</h3>
              <p className="text-muted-foreground mb-6">Bookmark posts to read them later</p>
              <Button as={Link} href="/">
                Browse Posts
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookmarks.map((bookmark: any) => (
                <Card key={bookmark.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <Link href={`/post/${bookmark.post.id}`} className="block p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center space-x-2 mb-2">
                        {bookmark.post.categoryId && categories && (
                          <Badge variant="secondary">
                            {getCategoryName(bookmark.post.categoryId)}
                          </Badge>
                        )}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Bookmarked on {formatDate(bookmark.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                        {bookmark.post.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {bookmark.post.excerpt || "No excerpt available"}
                      </p>
                      <Button size="sm" className="mt-2">
                        Read Post
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
