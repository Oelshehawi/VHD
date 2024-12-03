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
            className={`${error ? "border-red-500" : "border-gray-300"} rounded-md`}
            styles={{
              control: (provided, state) => ({
                ...provided,
                borderColor: error ? "#f87171" : state.isFocused ? "#ffffff33" : "#ffffff1a",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                boxShadow: "none",
                "&:hover": {
                  borderColor: error ? "#f87171" : "#ffffff33",
                },
              }),
              menu: (provided) => ({
                ...provided,
                backgroundColor: "#1a1a1a",
                zIndex: 9999,
              }),
              menuList: (provided) => ({
                ...provided,
                maxHeight: "150px",
                "::-webkit-scrollbar": {
                  width: "8px",
                },
                "::-webkit-scrollbar-track": {
                  background: "#2d2d2d",
                },
                "::-webkit-scrollbar-thumb": {
                  background: "#666",
                  borderRadius: "4px",
                },
                "::-webkit-scrollbar-thumb:hover": {
                  background: "#888",
                },
              }),
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isFocused ? "#333" : "#1a1a1a",
                color: "white",
                "&:hover": {
                  backgroundColor: "#333",
                },
              }),
              multiValue: (provided) => ({
                ...provided,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              }),
              multiValueLabel: (provided) => ({
                ...provided,
                color: "white",
              }),
              multiValueRemove: (provided) => ({
                ...provided,
                color: "white",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                },
              }),
              placeholder: (provided) => ({
                ...provided,
                color: "rgba(255, 255, 255, 0.5)",
              }),
              input: (provided) => ({
                ...provided,
                color: "white",
              }),
              singleValue: (provided) => ({
                ...provided,
                color: "white",
              }),
            }}
            menuPlacement="auto"
            menuPosition="fixed"
          />
        )}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error.message}</p>}
    </div>
  );
};

export default TechnicianSelect;
