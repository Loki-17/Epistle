import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { PostForm } from "@/components/post-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CreatePostPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      const res = await apiRequest("POST", "/api/posts", postData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Post created",
        description: "Your post has been published successfully.",
      });
      navigate(`/post/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create post: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: any) => {
    createPostMutation.mutate(data);
  };

  return (
    <MainLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Post</h1>
        <p className="text-gray-500 dark:text-gray-400">Draft your thoughts, then publish when you're ready</p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <PostForm 
          onSubmit={handleSubmit}
          isSubmitting={createPostMutation.isPending}
        />
      </div>
    </MainLayout>
  );
}
