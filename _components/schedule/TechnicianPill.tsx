// components/TechnicianPill.tsx
"use client";

import { Badge } from "../ui/badge";

interface TechnicianPillProps {
  name: string;
}

const TechnicianPill: React.FC<TechnicianPillProps> = ({ name }) => {
  const initials = name
    .substring(0, 3)
    .toUpperCase();

  return (
    <Badge variant="secondary" className="text-xs">
      {initials}
    </Badge>
  );
};

export default TechnicianPill;
