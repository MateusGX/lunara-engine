import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const LandingPage = lazy(() =>
  import("@/routes/landing").then((m) => ({ default: m.LandingPage })),
);
const HomePage = lazy(() =>
  import("@/routes/home").then((m) => ({ default: m.HomePage })),
);
const EditorPage = lazy(() =>
  import("@/routes/editor").then((m) => ({ default: m.EditorPage })),
);
const PlayerPage = lazy(() =>
  import("@/routes/player").then((m) => ({ default: m.PlayerPage })),
);
const LaunchPage = lazy(() =>
  import("@/routes/launcher").then((m) => ({ default: m.LaunchPage })),
);
const EmbedPage = lazy(() =>
  import("@/routes/embed").then((m) => ({ default: m.EmbedPage })),
);

function PageLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-surface-base">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin border-2 border-violet-500" />
        <span className="font-mono text-sm text-zinc-300">loading...</span>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<PageLoader />}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: "/studio",
    element: (
      <Suspense fallback={<PageLoader />}>
        <HomePage />
      </Suspense>
    ),
  },
  {
    path: "/studio/editor/:id",
    element: (
      <Suspense fallback={<PageLoader />}>
        <EditorPage />
      </Suspense>
    ),
  },
  {
    path: "/play/:id",
    element: (
      <Suspense fallback={<PageLoader />}>
        <PlayerPage />
      </Suspense>
    ),
  },
  {
    path: "/launch",
    element: (
      <Suspense fallback={<PageLoader />}>
        <LaunchPage />
      </Suspense>
    ),
  },
  {
    path: "/embed",
    element: (
      <Suspense fallback={<PageLoader />}>
        <EmbedPage />
      </Suspense>
    ),
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
