import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        "block transition-colors duration-100", // Faster transition
        "hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground",
        className
      )}
    >
      {children}
    </Link>
  );
};

// Optimized navigation hook with visual feedback
export const useInstantNavigation = () => {
  const routerNavigate = useNavigate();
  const navigate = (path: string) => {
    routerNavigate(path);
  };

  return { navigate };
};