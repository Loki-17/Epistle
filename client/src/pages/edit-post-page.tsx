import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { PostForm } from "@/components/post-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const postId = parseInt(id);
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Get post
  const { data: post, isLoading, error } = useQuery({
    queryKey: ["/api/posts", postId],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${postId}`);
      if (!res.ok) throw new Error("Failed to fetch post");
      return await res.json();
    },
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async (postData: any) => {
      const res = await apiRequest("PUT", `/api/posts/${postId}`, postData);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/user", user?.id] });
      
      toast({
        title: "Post updated",
        description: "Your post has been updated successfully.",
      });
      navigate(`/post/${postId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update post: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: any) => {
    updatePostMutation.mutate(data);
  };

  // Check if the user is the author of the post
  if (post && user && post.userId !== user.id) {
    navigate("/");
    toast({
      title: "Access denied",
      description: "You don't have permission to edit this post",
      variant: "destructive",
    });
    return null;
  }

  return (
    <MainLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/post/${postId}`}>
            <Button variant="ghost" size="sm">
              Back to Post
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Post</h1>
        <p className="text-gray-500 dark:text-gray-400">Update your post content or settings</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-6 rounded-lg text-center">
          <p>Error loading post. It may have been deleted or you don't have permission to edit it.</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Return to Home
          </Button>
        </div>
      ) : post ? (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <PostForm 
            post={post}
            onSubmit={handleSubmit}
            isSubmitting={updatePostMutation.isPending}
          />
        </div>
      ) : null}
    </MainLayout>
  );
}
