// components/TechnicianPill.tsx
"use client";


interface TechnicianPillProps {
  name: string;
}

const TechnicianPill: React.FC<TechnicianPillProps> = ({ name }) => {

  const initials = name
    .substring(0, 3)
    .toUpperCase();

  return (
    <span className="inline-flex gap-2  bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs">
      {initials}
    </span>
  );
};

export default TechnicianPill;
