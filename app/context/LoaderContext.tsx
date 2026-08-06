"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import AmleefaLogo from "../api/lib/AmleefaLogo"; // Adjust path if needed
import { Loader2 } from "lucide-react";

interface LoaderContextType {
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  isLoading: boolean;
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading...");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Show loader on manual triggers
  const showLoader = (message = "Loading...") => {
    setLoadingText(message);
    setIsLoading(true);
  };

  const hideLoader = () => {
    setIsLoading(false);
  };

  // Automatically hide loader when Next.js route navigation completes
  useEffect(() => {
    // Schedule state update asynchronously to avoid cascading sync renders
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);
  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader, isLoading }}>
      {children}

      {/* Global Loader Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md text-slate-100 transition-all duration-300">
          <AmleefaLogo className="w-12 h-12 mb-4 animate-bounce" />
          <div className="flex items-center gap-2 text-sm font-medium text-indigo-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{loadingText}</span>
          </div>
        </div>
      )}
    </LoaderContext.Provider>
  );
}

export function useGlobalLoader() {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error("useGlobalLoader must be used within a LoaderProvider");
  }
  return context;
}