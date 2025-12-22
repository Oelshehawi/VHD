"use client";

import { useEffect } from "react";
import { useBreadcrumbName } from "./BreadcrumbNameProvider";

export function SetBreadcrumbName({ name }: { name: string }) {
  const { setName } = useBreadcrumbName();

  useEffect(() => {
    setName(name);
    // Cleanup: clear the name when component unmounts
    return () => {
      setName("");
    };
  }, [name, setName]);

  return null;
}
