/**
 * Static build entry point — uses local tRPC link instead of HTTP.
 * No server, no OAuth, no database. All simulation runs in the browser.
 *
 * IMPORTANT: wraps App with wouter <Router base="..."> so that routes
 * resolve correctly under the GitHub Pages sub-path
 * /platinum_03b_future_power-ee/.
 */

import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import App from "./App";
import "./index.css";
import { createLocalLink } from "@/lib/localTrpcLink";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const trpcClient = trpc.createClient({
  links: [createLocalLink()],
});

// GitHub Pages serves the app under /platinum_03b_future_power-ee/
// Wouter needs to know the base path so "/" matches the root of the app.
const BASE_PATH = "/platinum_03b_future_power-ee";

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <Router base={BASE_PATH}>
        <App />
      </Router>
    </QueryClientProvider>
  </trpc.Provider>
);
