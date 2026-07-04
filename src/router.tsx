import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Cache inteligente: reduz drasticamente requisições redundantes
        staleTime: 60_000, // 1 min — dados são considerados frescos
        gcTime: 5 * 60_000, // 5 min em memória
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: (failureCount, error: unknown) => {
          // Não repetir em 4xx (erro do cliente / auth)
          const status =
            (error as { status?: number } | null)?.status ??
            (error as { statusCode?: number } | null)?.statusCode;
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
      mutations: {
        retry: 0,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent", // pré-carrega rotas no hover/focus
    defaultPreloadStaleTime: 0,
  });

  return router;
};
