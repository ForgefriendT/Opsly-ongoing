import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-base">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main body area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header toolbar */}
        <TopBar />

        {/* Dynamic page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-base">
          <div className="mx-auto max-w-[1200px] w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
