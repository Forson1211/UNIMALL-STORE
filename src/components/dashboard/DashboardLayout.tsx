import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";

interface DashboardLayoutProps {
  children: ReactNode;
  type: 'admin' | 'vendor';
  title: string;
  userName?: string;
  userRole?: string;
}

export function DashboardLayout({ children, type, title, userName, userRole }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar type={type} />
        <div className="flex-1 flex flex-col min-h-screen">
          <DashboardHeader 
            title={title} 
            userName={userName || (type === 'admin' ? 'Admin User' : 'Vendor User')} 
            userRole={userRole || (type === 'admin' ? 'Administrator' : 'Vendor')} 
          />
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
