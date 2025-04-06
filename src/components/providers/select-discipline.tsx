import { useEffect, useState } from "react";

import { useAsyncChunk, useChunk } from "stunk/react";

import { Select, SelectItem } from "@heroui/select";
import { SharedSelection } from "@heroui/system";
import { appChunk } from "@/lib/store/app-store";

import { Discipline, disciplineChunk } from "@/lib/store/discipline-store";

const desiredDisciplines = [
  "General",
  "Paedatric",
  "Gynaecology",
  "Optometry",
  "Dentistry",
  "Dermatology",
  "Cardiologist",
  "Orthopaedic",
  "Gym",
  "Pathology-lab",
];

const mapDisciplines = (data: Discipline[] | null): Discipline[] => {
  const disciplineMap: { [key: string]: Discipline | undefined } = {};

  data?.forEach((d) => {
    switch (d.Department) {
      case "General Practitioner":
        disciplineMap["General"] = d;
        break;
      case "Pediatrician":
      case "Pediatric":
        disciplineMap["Paedatric"] = d;
        break;
      case "Obstretician & Genaecology":
        disciplineMap["Gynaecology"] = d;
        break;
      case "Optometry":
        disciplineMap["Optometry"] = d;
        break;
      case "Dentistry":
        disciplineMap["Dentistry"] = d;
        break;
      case "Dermatology":
        disciplineMap["Dermatology"] = d;
        break;
      case "Cardiologist":
        disciplineMap["Cardiologist"] = d;
        break;
      case "Orthopedic surgeon":
        disciplineMap["Orthopaedic"] = d;
        break;
      case "Pathology(Laborotary)":
        disciplineMap["Pathology-lab"] = d;
        break;
      // "Gym" is not in the API, will use default
    }
  });

  return desiredDisciplines
    .map((desired) => {
      const matched = disciplineMap[desired];
      return (
        matched || {
          Department_id: Number(desired), // Use desired name as a fallback ID if no match
          Department: desired,
          Department_Code: "N/A", // Default code if not in API
        }
      );
    })
    .sort((a, b) => a.Department.localeCompare(b.Department)); // Sort alphabetically
};

export default function SelectDiscipline() {
  const [_, setState] = useChunk(appChunk);
  const { data, loading: initLoading, error } = useAsyncChunk(disciplineChunk);

  const [selectedDisc, setSelectedDisc] = useState<Set<string>>(new Set([]));
  const [filteredDisc, setFilteredDisc] = useState<Discipline[]>([]);

  // Map and filter the disciplines
  const discipline = Array.isArray(data) ? mapDisciplines(data) : [];

  useEffect(() => {
    if (discipline.length > 0 && filteredDisc.length === 0) {
      setFilteredDisc(discipline);
      if (selectedDisc.size === 0 && discipline.length > 0) {
        setSelectedDisc(new Set([String(discipline[0].Department_id)]));
      }
    }
  }, [discipline, selectedDisc, filteredDisc]);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      disciplineId: Array.from(selectedDisc)[0] || "",
    }));
  }, [selectedDisc, setState]);

  const handleSelectionChange = (keys: SharedSelection) => {
    setSelectedDisc(new Set(Array.from(keys as Iterable<string>)));
  };

  if (error) {
    return (
      <div>
        <p className="text-red-500 text-sm">
          Failed to load disciplines. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Select
        label="Select Discipline"
        radius="sm"
        size="lg"
        isLoading={initLoading}
        items={filteredDisc}
        isDisabled={filteredDisc.length === 0 || initLoading}
        selectedKeys={selectedDisc}
        onSelectionChange={handleSelectionChange}
      >
        {(discipline) => (
          <SelectItem key={discipline.Department_id}>
            {discipline.Department}
          </SelectItem>
        )}
      </Select>
    </div>
  );
}
