import React, { createContext, useContext, ReactNode } from 'react';

interface ExportContextType {
  handleExportPDF: () => Promise<void>;
  isExporting: boolean;
}

const ExportContext = createContext<ExportContextType | undefined>(undefined);

export const useExport = () => {
  const context = useContext(ExportContext);
  if (!context) {
    throw new Error('useExport must be used within an ExportProvider');
  }
  return context;
};

interface ExportProviderProps {
  children: ReactNode;
  value: ExportContextType;
}

export const ExportProvider: React.FC<ExportProviderProps> = ({ children, value }) => {
  return (
    <ExportContext.Provider value={value}>
      {children}
    </ExportContext.Provider>
  );
};