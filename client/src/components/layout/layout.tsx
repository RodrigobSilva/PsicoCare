import { ReactNode, useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import MobileNavigation from "./mobile-navigation";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-100 font-sans antialiased">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header toggleSidebar={toggleSidebar} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>

        {/* Mobile Navigation */}
        <MobileNavigation />
      </div>
    </div>
  );
}