import { useState, useCallback, useMemo } from "react";

export interface UseInfiniteScrollOptions<T> {
  data: T[];
  pageSize?: number;
  loadDelay?: number;
  filter?: (item: T) => boolean;
}

export interface UseInfiniteScrollReturn<T> {
  displayedData: T[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
  totalCount: number;
  displayedCount: number;
}

export function useInfiniteScroll<T>({
  data,
  pageSize = 20,
  loadDelay = 300,
  filter,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const filteredData = useMemo(() => {
    return filter ? data.filter(filter) : data;
  }, [data, filter]);

  const displayedData = useMemo(() => {
    return filteredData.slice(0, currentPage * pageSize);
  }, [filteredData, currentPage, pageSize]);

  const hasMore = useMemo(() => {
    const result = displayedData.length < filteredData.length;
    console.log("hasMore calculation:", {
      displayedDataLength: displayedData.length,
      filteredDataLength: filteredData.length,
      currentPage,
      pageSize,
      hasMore: result,
    });
    return result;
  }, [displayedData.length, filteredData.length, currentPage, pageSize]);

  const loadMore = useCallback(async () => {
    console.log("loadMore called:", { loading, hasMore });
    if (loading || !hasMore) {
      console.log("loadMore cancelled:", { loading, hasMore });
      return;
    }

    console.log("Loading more items, current page:", currentPage);
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, loadDelay));

    setCurrentPage((prev) => {
      console.log("Incrementing page from", prev, "to", prev + 1);
      return prev + 1;
    });
    setLoading(false);
  }, [loading, hasMore, loadDelay, currentPage]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setLoading(false);
  }, []);

  return {
    displayedData,
    loading,
    hasMore,
    loadMore,
    reset,
    totalCount: filteredData.length,
    displayedCount: displayedData.length,
  };
}
