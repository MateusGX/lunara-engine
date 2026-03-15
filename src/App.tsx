import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

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

function PageLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0d0d14]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin border-2 border-violet-500" />
        <span className="font-mono text-sm text-zinc-500">loading...</span>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<PageLoader />}>
        <HomePage />
      </Suspense>
    ),
  },
  {
    path: "/editor/:id",
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
]);

export default function App() {
  return <RouterProvider router={router} />;
}
