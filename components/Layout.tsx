import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen max-w-md mx-auto bg-white border-x-2 border-gray-200 relative shadow-2xl overflow-hidden flex flex-col">
       {children}
    </div>
  );
};