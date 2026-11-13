import { useCallback, useMemo, useState } from "react";
import { useBanners, type Banner } from "@/context/BannerContext";

/** Hook da camada de apresentação para gestão de banners sobre o BannerContext. */
export function useManagementBanners() {
  const {
    banners: rawBanners,
    addBanner,
    updateBanner,
    deleteBanner,
    toggleActive,
    moveUp,
    moveDown,
  } = useBanners();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const banners = useMemo(
    () => [...rawBanners].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)),
    [rawBanners],
  );

  const publishedCount = useMemo(
    () => banners.filter((banner) => banner.active).length,
    [banners],
  );

  const draftCount = useMemo(
    () => banners.filter((banner) => !banner.active).length,
    [banners],
  );

  const refetch = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const createBanner = useCallback(
    (data: Omit<Banner, "id" | "order">) => {
      addBanner(data);
    },
    [addBanner],
  );

  return {
    banners,
    publishedCount,
    draftCount,
    isLoading,
    error,
    setError,
    refetch,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleActive,
    moveUp,
    moveDown,
  };
}
