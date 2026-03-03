import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { useStore } from "./store";

// Bootstrap auth before first render so the AuthGate has session state
useStore.getState().bootstrapAuth();

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: ONE_DAY_MS,
      staleTime: 1000 * 60,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      gcTime: ONE_DAY_MS,
      retry: 1,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: window.localStorage,
});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "2rem",
            color: "red",
            background: "#fee",
            height: "100vh",
            fontFamily: "monospace",
          }}
        >
          <h1>React Crash Log:</h1>
          <p>{this.state.error?.message}</p>
          <pre style={{ overflow: "auto" }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: ONE_DAY_MS,
          dehydrateOptions: {
            shouldDehydrateQuery: () => true,
            shouldDehydrateMutation: () => true,
          },
        }}
      >
        <App />
      </PersistQueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
