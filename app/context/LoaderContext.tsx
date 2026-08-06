"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import AmleefaLogo from "../api/lib/AmleefaLogo";
import { Loader2 } from "lucide-react";
import { SearchParamsHandler } from "./SearchParamsHandler";

interface LoaderContextType {
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  isLoading: boolean;
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading...");

  const showLoader = (message = "Loading...") => {
    setLoadingText(message);
    setIsLoading(true);
  };

  const hideLoader = () => {
    setIsLoading(false);
  };

  // Safe navigation handler passed to Suspense boundary
  const handleRouteChange = useCallback(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader, isLoading }}>
      <SearchParamsHandler onNavigation={handleRouteChange} />
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