
import React from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-15%] right-[-5%] w-[45%] h-[45%] bg-accent-primary/[0.04] rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-success/[0.03] rounded-full blur-[100px]" />
          <div className="absolute top-[40%] left-[30%] w-[25%] h-[25%] bg-accent-warning/[0.02] rounded-full blur-[80px]" />
        </div>
        {children}
      </main>
    </div>
  );
};
