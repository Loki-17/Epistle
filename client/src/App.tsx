import { Route, Switch } from "wouter";
import { ProtectedRoute } from "@/lib/protected-route";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

// Initialize query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute stale time
      retry: 1, // Only retry failed queries once
    },
  },
});

// Lazy load components
const LazyHomePage = lazy(() => import("@/pages/home-page"));
const LazyCreatePostPage = lazy(() => import("@/pages/create-post-page"));
const LazyEditPostPage = lazy(() => import("@/pages/edit-post-page"));
const LazyPostPage = lazy(() => import("@/pages/post-page"));
const LazyProfilePage = lazy(() => import("@/pages/profile-page"));
const LazyExplorePage = lazy(() => import("@/pages/explore-page"));
const LazyBookmarksPage = lazy(() => import("@/pages/bookmarks-page"));
const LazyNotFound = lazy(() => import("@/pages/not-found"));
const LazyAuthPage = lazy(() => import("@/pages/auth-page"));
const LazyDashboardPage = lazy(() => import("@/pages/dashboard-page"));

// Loading component
const LoadingFallback = () => <div className="flex items-center justify-center h-screen">Loading...</div>;

// Non-lazy wrappers for the lazy components
const HomePage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyHomePage />
  </Suspense>
);

const CreatePostPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyCreatePostPage />
  </Suspense>
);

const EditPostPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyEditPostPage />
  </Suspense>
);

const PostPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyPostPage />
  </Suspense>
);

const ProfilePage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyProfilePage />
  </Suspense>
);

const ExplorePage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyExplorePage />
  </Suspense>
);

const BookmarksPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyBookmarksPage />
  </Suspense>
);

const NotFound = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyNotFound />
  </Suspense>
);

const AuthPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyAuthPage />
  </Suspense>
);

const DashboardPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyDashboardPage />
  </Suspense>
);

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/post/:id" component={PostPage} />
      <ProtectedRoute path="/create-post" component={CreatePostPage} />
      <ProtectedRoute path="/edit-post/:id" component={EditPostPage} />
      <ProtectedRoute path="/explore" component={ExplorePage} />
      <ProtectedRoute path="/bookmarks" component={BookmarksPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
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
