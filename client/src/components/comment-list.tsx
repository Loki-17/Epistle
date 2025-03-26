import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, getInitials, getRandomAvatar } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { useState } from "react";

interface CommentListProps {
  comments: Array<{
    id: number;
    content: string;
    createdAt: string;
    userId: number;
    user?: {
      id: number;
      username: string;
      displayName?: string;
      avatarUrl?: string;
    } | null;
  }>;
  postId: number;
}

export function CommentList({ comments, postId }: CommentListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed successfully.",
      });
      setCommentToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete comment: ${error.message}`,
        variant: "destructive",
      });
      setCommentToDelete(null);
    },
  });

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No comments yet. Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => {
        const isOwner = user?.id === comment.userId;
        const commentUser = comment.user || {
          id: comment.userId,
          username: "Unknown",
          displayName: "Unknown User",
        };
        
        const displayName = commentUser?.displayName || commentUser?.username || "User";
        const avatarUrl = commentUser?.avatarUrl || getRandomAvatar(displayName);
        const initials = getInitials(displayName);

        return (
          <div key={comment.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(comment.createdAt)}</span>
                </div>
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {comment.content}
                </div>
                {isOwner && (
                  <div className="mt-2 flex justify-end">
                    <AlertDialog open={commentToDelete === comment.id} onOpenChange={(open) => {
                      if (!open) setCommentToDelete(null);
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          onClick={() => setCommentToDelete(comment.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this comment. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            {deleteCommentMutation.isPending ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
