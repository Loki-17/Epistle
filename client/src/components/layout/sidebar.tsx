import { Link, useLocation } from "wouter";
import { 
  Home, 
  LayoutDashboard, 
  Compass, 
  Bookmark, 
  PlusCircle, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getRandomAvatar } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function Sidebar({ open, setOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const displayName = user?.displayName || user?.username || '';
  const avatarUrl = user?.avatarUrl || getRandomAvatar(displayName);
  const initials = getInitials(displayName);

  const links = [
    {
      href: "/",
      label: "Feed",
      icon: Home,
      active: location === "/",
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: location.startsWith("/dashboard"),
    },
    {
      href: "/explore",
      label: "Explore",
      icon: Compass,
      active: location.startsWith("/explore"),
    },
    {
      href: "/bookmarks",
      label: "Bookmarks",
      icon: Bookmark,
      active: location.startsWith("/bookmarks"),
    },
  ];

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar for mobile */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out lg:hidden",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z" />
              <line x1="16" y1="8" x2="2" y2="22" />
              <line x1="17.5" y1="15" x2="9" y2="15" />
            </svg>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Blogify</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        <div className="flex flex-col h-full px-4 py-4">
          <div className="mb-8">
            <Link 
              href="/create-post" 
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={() => setOpen(false)}
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              New Post
            </Link>
          </div>

          <nav className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  link.active
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <link.icon className={cn(
                  "mr-3 h-5 w-5",
                  link.active
                    ? "text-primary-500 dark:text-primary-400"
                    : "text-gray-400 dark:text-gray-500"
                )} />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center px-2 py-2">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{displayName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">@{user?.username}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4 mb-5">
                <Link href="/" className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z" />
                    <line x1="16" y1="8" x2="2" y2="22" />
                    <line x1="17.5" y1="15" x2="9" y2="15" />
                  </svg>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">Blogify</span>
                </Link>
              </div>
              
              <div className="px-4 mb-8">
                <Link
                  href="/create-post"
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  New Post
                </Link>
              </div>
              
              <nav className="flex-1 px-2 space-y-1">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                      link.active
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <link.icon className={cn(
                      "mr-3 h-5 w-5",
                      link.active
                        ? "text-primary-500 dark:text-primary-400"
                        : "text-gray-400 dark:text-gray-500"
                    )} />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
              <Link href="/profile" className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">@{user?.username}</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
