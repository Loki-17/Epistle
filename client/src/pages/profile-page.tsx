import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Edit, Save, X } from "lucide-react";
import { formatDate, getInitials, getRandomAvatar } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { PostCard } from "@/components/post-card";
import { Category, Post } from "@shared/schema";

export default function ProfilePage() {
  const { user, updateProfileMutation } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    avatarUrl: user?.avatarUrl || "",
  });

  // Get user's posts
  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ["/api/posts/user", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/user/${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return await res.json();
    },
    enabled: !!user?.id,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData, {
      onSuccess: () => {
        setIsEditing(false);
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
      },
    });
  };

  const displayName = user?.displayName || user?.username || "";
  const avatarUrl = user?.avatarUrl || getRandomAvatar(displayName);
  const initials = getInitials(displayName);

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profile</CardTitle>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Display Name
                      </label>
                      <Input
                        value={formData.displayName}
                        onChange={(e) =>
                          setFormData({ ...formData, displayName: e.target.value })
                        }
                        placeholder="Your display name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bio
                      </label>
                      <Textarea
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                        placeholder="Tell us about yourself"
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Avatar URL
                      </label>
                      <Input
                        value={formData.avatarUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, avatarUrl: e.target.value })
                        }
                        placeholder="URL to your avatar image"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {displayName}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p className="text-gray-700 dark:text-gray-300 mt-4">
                        {user.bio}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Posts
          </h2>
          {isLoadingPosts ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          ) : posts?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
                No posts yet. Start writing to share your thoughts!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {posts?.map((post: Post) => {
                const category = categories?.find(
                  (c: Category) => c.id === post.categoryId
                );
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    category={category}
                    authorName={displayName}
                    authorImage={avatarUrl}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 