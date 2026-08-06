"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface SearchParamsHandlerProps {
  onNavigation: () => void;
}

function SearchParamsListener({ onNavigation }: SearchParamsHandlerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    onNavigation();
  }, [pathname, searchParams, onNavigation]);

  return null;
}

export function SearchParamsHandler({ onNavigation }: SearchParamsHandlerProps) {
  return (
    <Suspense fallback={null}>
      <SearchParamsListener onNavigation={onNavigation} />
    </Suspense>
  );
}