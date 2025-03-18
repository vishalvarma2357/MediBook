import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SpecialtyFiltersProps {
  onSelect: (specialization: string | null) => void;
  selected: string | null;
}

export default function SpecialtyFilters({
  onSelect,
  selected,
}: SpecialtyFiltersProps) {
  const { data: specializations, isLoading } = useQuery({
    queryKey: ["/api/specializations"],
    staleTime: Infinity, // Specializations rarely change
  });

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-32 bg-neutral-100 rounded-full animate-pulse shrink-0"></div>
        ))}
      </div>
    );
  }

  if (!specializations || specializations.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 mb-6 no-scrollbar">
      <Button
        variant={selected === null ? "default" : "outline"}
        className="whitespace-nowrap rounded-full"
        onClick={() => onSelect(null)}
      >
        All Specialties
      </Button>
      
      {specializations.map((specialty) => (
        <Button
          key={specialty.id}
          variant={selected === specialty.name ? "default" : "outline"}
          className="whitespace-nowrap rounded-full"
          onClick={() => onSelect(specialty.name)}
        >
          {specialty.name}
        </Button>
      ))}
    </div>
  );
}
