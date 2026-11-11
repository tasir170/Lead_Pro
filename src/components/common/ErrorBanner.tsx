import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry, className = '' }) => {
  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-900 flex items-start justify-between gap-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-rose-900">Unable to load data</h4>
          <p className="text-xs text-rose-700 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button variant="outline" size="xs" onClick={onRetry} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry
        </Button>
      )}
    </div>
  );
};
