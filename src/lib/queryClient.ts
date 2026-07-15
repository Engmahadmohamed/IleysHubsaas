import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes by default.
      // We will override this for specific collections in AppContext.
      staleTime: 5 * 60 * 1000, 
      // Garbage collect inactive queries after 30 minutes
      gcTime: 30 * 60 * 1000,
      // Do not refetch on window focus since this is a management portal
      // and we want to minimize reads. We rely on cache invalidation on writes.
      refetchOnWindowFocus: false,
      // Retry failed queries a couple of times before throwing an error
      retry: 2,
    },
  },
});
