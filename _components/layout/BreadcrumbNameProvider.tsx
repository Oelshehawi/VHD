"use client";

import { createContext, useContext, ReactNode, useState } from "react";

interface BreadcrumbNameContextType {
  name?: string;
  setName: (name: string) => void;
}

const BreadcrumbNameContext = createContext<BreadcrumbNameContextType>({
  name: undefined,
  setName: () => {},
});

export function BreadcrumbNameProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState<string | undefined>(undefined);

  return (
    <BreadcrumbNameContext.Provider value={{ name, setName }}>
      {children}
    </BreadcrumbNameContext.Provider>
  );
}

export function useBreadcrumbName() {
  return useContext(BreadcrumbNameContext);
}
