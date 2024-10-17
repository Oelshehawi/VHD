// components/TechnicianSelect.tsx
"use client";

import React from "react";
import Select from "react-select";
import { Control, Controller } from "react-hook-form";

interface TechnicianOption {
  value: string;
  label: string;
}

interface TechnicianSelectProps {
  control: Control<any>;
  name: string;
  technicians: { id: string; name: string }[];
  placeholder?: string;
  error?: any;
}

const TechnicianSelect: React.FC<TechnicianSelectProps> = ({
  control,
  name,
  technicians,
  placeholder = "Select Technicians",
  error,
}) => {
  const options: TechnicianOption[] = technicians.map((tech) => ({
    value: tech.id,
    label: tech.name.split(" ")[0] || "Unknown",
  }));

  return (
    <div>
      <Controller
        control={control}
        name={name}
        rules={{ required: "At least one technician is required" }}
        render={({ field: { onChange, value, ref } }) => (
          <Select
            ref={ref}
            isMulti
            options={options}
            value={options.filter((option) => value.includes(option.value))}
            onChange={(selectedOptions) => {
              onChange(selectedOptions.map((option) => option.value));
            }}
            placeholder={placeholder}
            className={`${
              error ? "border-red-500 h-28" : "border-gray-300"
            } rounded-md`}
            styles={{
              control: (provided) => ({
                ...provided,
                borderColor: error ? "#f87171" : "#d1d5db",
                boxShadow: "none",
                "&:hover": {
                  borderColor: error ? "#f87171" : "#a3a3a3",
                },
              }),
            }}
            menuPlacement="bottom"
          />
        )}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
  );
};

export default TechnicianSelect;
