'use client';

import React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'lg',
  className = '',
  ...props
}) => {
  const sizeMap = {
    sm: 'max-w-4xl',
    md: 'max-w-6xl',
    lg: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${sizeMap[size]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Container;
