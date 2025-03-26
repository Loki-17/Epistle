import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertCommentSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { getInitials, getRandomAvatar } from "@/lib/utils";

interface CommentFormProps {
  postId: number;
  onSubmit: (data: FormData) => void;
  isSubmitting: boolean;
}

// Extend the insertCommentSchema to add validation
const formSchema = insertCommentSchema.extend({
  content: z.string().min(3, { message: "Comment must be at least 3 characters" })
});

type FormData = z.infer<typeof formSchema>;

export function CommentForm({ postId, onSubmit, isSubmitting }: CommentFormProps) {
  const { user } = useAuth();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      postId: postId,
    },
  });

  const handleSubmit = (data: FormData) => {
    onSubmit(data);
    form.reset();
  };

  const displayName = user?.displayName || user?.username || '';
  const avatarUrl = user?.avatarUrl || getRandomAvatar(displayName);
  const initials = getInitials(displayName);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="flex space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Write your comment..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mt-2 flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
