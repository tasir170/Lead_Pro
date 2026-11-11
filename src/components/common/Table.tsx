import React from 'react';

export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className={`w-full text-left border-collapse text-xs sm:text-sm ${className}`}>{children}</table>
    </div>
  );
};

export const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <thead className={`bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium ${className}`}>{children}</thead>;
};

export const TableBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <tbody className={`divide-y divide-slate-100 ${className}`}>{children}</tbody>;
};

export const TableRow: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors hover:bg-slate-50/70 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
};

export const TableHead: React.FC<{
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}> = ({ children, className = '', align = 'left' }) => {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 ${alignClass} ${className}`}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<{
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  isNumeric?: boolean;
}> = ({ children, className = '', align = 'left', isNumeric = false }) => {
  const alignClass = align === 'right' || isNumeric ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <td className={`px-4 py-3 text-slate-700 ${alignClass} ${isNumeric ? 'font-mono tabular-nums' : ''} ${className}`}>
      {children}
    </td>
  );
};
