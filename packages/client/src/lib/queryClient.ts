import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Matches the app's current fetch-on-demand behavior — no surprise
      // refetch when the browser tab regains focus.
      refetchOnWindowFocus: false,
    },
  },
});
