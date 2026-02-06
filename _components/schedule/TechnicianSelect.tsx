// components/TechnicianSelect.tsx
"use client";

import React from "react";
import { Control, Controller } from "react-hook-form";
import { MultiSelect, MultiSelectOption } from "../ui/multi-select";

interface TechnicianSelectProps {
  control: Control<any>;
  name: string;
  technicians: { id: string; name: string }[];
  placeholder?: string;
  error?: any;
  theme?: "light" | "dark";
  required?: boolean;
}

const TechnicianSelect: React.FC<TechnicianSelectProps> = ({
  control,
  name,
  technicians,
  placeholder = "Select Technicians",
  error,
  theme = "light",
  required = true,
}) => {
  const options: MultiSelectOption[] = technicians.map((tech) => ({
    value: tech.id,
    label: tech.name.split(" ")[0] || "Unknown",
  }));

  return (
    <div>
      <Controller
        control={control}
        name={name}
        rules={
          required ? { required: "At least one technician is required" } : {}
        }
        render={({ field: { onChange, value } }) => (
          <MultiSelect
            options={options}
            onValueChange={onChange}
            defaultValue={value || []}
            placeholder={placeholder}
            className={error ? "border-destructive" : ""}
            variant="default"
            maxCount={3}
            searchable={true}
          />
        )}
      />
      {error && (
        <p
          className={`mt-1 text-sm ${theme === "dark" ? "text-red-400" : "text-destructive"}`}
        >
          {error.message}
        </p>
      )}
    </div>
  );
};

export default TechnicianSelect;
