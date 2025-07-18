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
  theme?: "light" | "dark";
}

const TechnicianSelect: React.FC<TechnicianSelectProps> = ({
  control,
  name,
  technicians,
  placeholder = "Select Technicians",
  error,
  theme = "light",
}) => {
  const options: TechnicianOption[] = technicians.map((tech) => ({
    value: tech.id,
    label: tech.name.split(" ")[0] || "Unknown",
  }));

  const isDark = theme === "dark";

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
            className={`${error ? "border-red-500" : "border-gray-300"} rounded-md`}
            styles={{
              control: (provided, state) => ({
                ...provided,
                borderColor: error 
                  ? "#f87171" 
                  : state.isFocused 
                    ? isDark ? "#ffffff33" : "#3b82f6"
                    : isDark ? "#ffffff1a" : "#d1d5db",
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
                boxShadow: state.isFocused 
                  ? isDark ? "0 0 0 1px rgba(255,255,255,0.2)" : "0 0 0 1px #3b82f6"
                  : "none",
                "&:hover": {
                  borderColor: error 
                    ? "#f87171" 
                    : isDark ? "#ffffff33" : "#9ca3af",
                },
                minHeight: "38px",
              }),
              menu: (provided) => ({
                ...provided,
                backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                border: isDark ? "1px solid #374151" : "1px solid #d1d5db",
                zIndex: 9999,
              }),
              menuList: (provided) => ({
                ...provided,
                maxHeight: "150px",
                "::-webkit-scrollbar": {
                  width: "8px",
                },
                "::-webkit-scrollbar-track": {
                  background: isDark ? "#2d2d2d" : "#f3f4f6",
                },
                "::-webkit-scrollbar-thumb": {
                  background: isDark ? "#666" : "#9ca3af",
                  borderRadius: "4px",
                },
                "::-webkit-scrollbar-thumb:hover": {
                  background: isDark ? "#888" : "#6b7280",
                },
              }),
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isFocused 
                  ? isDark ? "#333" : "#f3f4f6"
                  : isDark ? "#1a1a1a" : "#ffffff",
                color: isDark ? "white" : "#374151",
                "&:hover": {
                  backgroundColor: isDark ? "#333" : "#f3f4f6",
                },
              }),
              multiValue: (provided) => ({
                ...provided,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#e5e7eb",
              }),
              multiValueLabel: (provided) => ({
                ...provided,
                color: isDark ? "white" : "#374151",
                fontSize: "12px",
              }),
              multiValueRemove: (provided) => ({
                ...provided,
                color: isDark ? "white" : "#6b7280",
                "&:hover": {
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.2)" : "#d1d5db",
                  color: isDark ? "white" : "#374151",
                },
              }),
              placeholder: (provided) => ({
                ...provided,
                color: isDark ? "rgba(255, 255, 255, 0.5)" : "#9ca3af",
                fontSize: "14px",
              }),
              input: (provided) => ({
                ...provided,
                color: isDark ? "white" : "#374151",
              }),
              singleValue: (provided) => ({
                ...provided,
                color: isDark ? "white" : "#374151",
              }),
            }}
            menuPlacement="auto"
            menuPosition="fixed"
          />
        )}
      />
      {error && (
        <p className={`mt-1 text-sm ${isDark ? "text-red-400" : "text-red-600"}`}>
          {error.message}
        </p>
      )}
    </div>
  );
};

export default TechnicianSelect;
