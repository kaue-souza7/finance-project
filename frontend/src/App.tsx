import { Suspense } from "react";
import { useRoutes } from "react-router-dom";
import { routes } from "@/routes";
import { PwaInstallWrapper } from "@/pwa/components/PwaInstallWrapper";
import { Skeleton } from "@/components/Skeleton";

function App() {
  const element = useRoutes(routes);
  return (
    <>
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        }
      >
        {element}
      </Suspense>
      <PwaInstallWrapper />
    </>
  );
}

export default App;
