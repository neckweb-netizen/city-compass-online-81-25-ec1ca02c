import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface FastNavItemProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

// Optimized navigation component with instant visual feedback
export const FastNavItem = ({ to, children, className }: FastNavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "block transition-colors duration-100", // Faster transition
        "hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground",
        className
      )}
      // Preload on hover for instant navigation
      onMouseEnter={() => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = to;
        document.head.appendChild(link);
      }}
    >
      {children}
    </Link>
  );
};

// Optimized navigation hook with visual feedback
export const useInstantNavigation = () => {
  const navigate = (path: string) => {
    // Add visual feedback immediately
    document.body.style.cursor = 'wait';
    
    // Navigate
    window.location.href = path;
    
    // Reset cursor after navigation starts
    setTimeout(() => {
      document.body.style.cursor = 'default';
    }, 100);
  };

  return { navigate };
};