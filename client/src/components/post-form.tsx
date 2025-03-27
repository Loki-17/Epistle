import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Post } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { X, Mic, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getReadingTime } from "@/lib/utils";
import { categories } from "@shared/schema";

// Define the form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category: z.string().min(1, "Category is required"), // Use string instead of enum for flexibility
  excerpt: z.string().optional().default(""),
  coverImage: z.string().optional().default(""),
  published: z.boolean().default(true),
  readTime: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

// Define a type for our form data
type FormData = z.infer<typeof formSchema>;

// Define a type for the data we'll submit to the parent
type SubmitData = {
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  published: boolean;
  category: string;
  readTime?: number;
  tags?: string[];
};

interface PostFormProps {
  post?: Post;
  onSubmit: (data: SubmitData) => Promise<void>;
}

export function PostForm({ post, onSubmit }: PostFormProps) {
  const { toast } = useToast();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Get categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      return await res.json(); // Ensure this returns an array of objects like [{ id, name }]
    },
  });

  // Get post tags if editing
  const { data: postTags } = useQuery({
    queryKey: ["/api/posts", post?.id, "tags"],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${post?.id}/tags`);
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!post?.id,
  });

  // Set up the form with default values
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: post?.title || "",
      content: post?.content || "",
      excerpt: post?.excerpt || "",
      category: post?.categoryId ? categories?.find(c => c.id === post.categoryId)?.name : categories?.[0]?.name,
      coverImage: post?.coverImage || "",
      published: post?.published ?? true,
      tags: [],
    },
  });

  // Watch content to update reading time
  const content = form.watch("content");
  
  // Update reading time when content changes
  useEffect(() => {
    if (content) {
      const readTime = getReadingTime(content.replace(/<[^>]*>?/gm, ''));
      form.setValue("readTime", parseInt(readTime));
    }
  }, [content, form]);

  // Initialize tags when postTags are loaded
  useEffect(() => {
    if (postTags?.length) {
      const tagNames = postTags.map((tag: any) => tag.name);
      setTags(tagNames);
      form.setValue("tags", tagNames);
    }
  }, [postTags, form]);

  const handleTagAdd = () => {
    if (tagInput && !tags.includes(tagInput)) {
      const newTags = [...tags, tagInput];
      setTags(newTags);
      form.setValue("tags", newTags);
      setTagInput('');
    }
  };

  const handleTagRemove = (tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    form.setValue("tags", newTags);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTagAdd();
    }
  };

  const handleSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      const submitData: SubmitData = {
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || "",
        coverImage: data.coverImage || "",
        published: data.published,
        category: data.category,
        readTime: data.readTime,
        tags: tags,
      };
      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("audio", audioBlob);

        try {
          const response = await fetch("/api/ai/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error("Failed to transcribe audio");

          const { text } = await response.json();
          const currentContent = form.getValues("content");
          form.setValue("content", currentContent + "\n" + text);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to transcribe audio",
            variant: "destructive",
          });
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const generateContent = async () => {
    try {
      setIsGenerating(true);
      const currentContent = form.getValues("content");
      
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: currentContent }),
      });

      if (!response.ok) throw new Error("Failed to generate content");

      const { content } = await response.json();
      form.setValue("content", currentContent + "\n" + content);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate content",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter post title..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((category: { id: number; name: string }) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="coverImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Image URL</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://example.com/image.jpg" 
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Enter URL for your cover image
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel>Tags</FormLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button 
                  type="button" 
                  onClick={() => handleTagRemove(tag)}
                  className="ml-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex">
            <Input
              placeholder="Add a tag (press Enter)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="flex-1"
            />
            <Button 
              type="button" 
              onClick={handleTagAdd} 
              variant="outline"
              className="ml-2"
            >
              Add
            </Button>
          </div>
          <FormDescription>
            Tags help readers discover your content
          </FormDescription>
        </div>

        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excerpt</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Brief description of your post"
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                A short summary that will appear in previews
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isGenerating}
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    {isRecording ? "Stop Recording" : "Record Audio"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateContent}
                    disabled={isRecording || isGenerating}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    {isGenerating ? "Generating..." : "Generate Content"}
                  </Button>
                </div>
                <FormControl>
                  <RichTextEditor 
                    value={field.value} 
                    onChange={field.onChange}
                    minHeight="300px"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <FormField
          control={form.control}
          name="published"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <FormLabel>Publish post</FormLabel>
                <FormDescription>
                  When turned off, the post will be saved as a draft
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : post ? "Update Post" : "Publish Post"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
