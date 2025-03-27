import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { useTheme } from "@/components/ui/theme-provider";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { theme } = useTheme();

  const isDashboard = location.startsWith("/dashboard");

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'dark' : ''}`}>
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <div className={`${isDashboard ? 'max-w-7xl' : 'max-w-3xl'} mx-auto px-4 sm:px-6 lg:px-8 py-6`}>
            {children}
          </div>
        </main>
      </div>
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z" />
                <line x1="16" y1="8" x2="2" y2="22" />
                <line x1="17.5" y1="15" x2="9" y2="15" />
              </svg>
              <span className="text-lg font-bold">Epistle</span>
            </div>
            <p className="mt-2 sm:mt-0 text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Epistle. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
