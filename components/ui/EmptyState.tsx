import React from 'react';

interface EmptyStateProps {
  illustration: React.ReactNode;
  title: string;
  message: string;
  children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ illustration, title, message, children }) => {
  return (
    <div className="text-center py-10 px-4 flex flex-col items-center">
      <div className="w-40 h-40 sm:w-48 sm:h-48 mx-auto text-gray-300">
        {illustration}
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">{message}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
};

export default EmptyState;
