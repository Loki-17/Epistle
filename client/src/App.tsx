import { Route, Switch } from "wouter";
import { ProtectedRoute } from "@/lib/protected-route";
import { MainLayout } from "@/components/layout/main-layout";
import HomePage from "@/pages/home-page";
import LoginPage from "@/pages/login-page";
import RegisterPage from "@/pages/register-page";
import CreatePostPage from "@/pages/create-post-page";
import EditPostPage from "@/pages/edit-post-page";
import PostPage from "@/pages/post-page";
import ProfilePage from "@/pages/profile-page";
import ExplorePage from "@/pages/explore-page";
import BookmarksPage from "@/pages/bookmarks-page";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";

// Initialize query client
const queryClient = new QueryClient();

// Wrap components to ensure they always return an Element
const EditPostPageWrapper = () => {
  const result = EditPostPage();
  return result || <div>Loading...</div>;
};

const BookmarksPageWrapper = () => {
  const result = BookmarksPage();
  return result || <div>Loading...</div>;
};

const ProfilePageWrapper = () => {
  const result = ProfilePage();
  return result || <div>Loading...</div>;
};

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/post/:id" component={PostPage} />
      <ProtectedRoute path="/create-post" component={CreatePostPage} />
      <ProtectedRoute path="/edit-post/:id" component={EditPostPageWrapper} />
      <ProtectedRoute path="/explore" component={ExplorePage} />
      <ProtectedRoute path="/bookmarks" component={BookmarksPageWrapper} />
      <ProtectedRoute path="/profile" component={ProfilePageWrapper} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="epistle-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
