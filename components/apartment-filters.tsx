// components/apartment-filters.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";

interface FilterOptions {
  sortBy: 'date' | 'rent' | 'fairness' | 'mean';
  sortOrder: 'asc' | 'desc';
}

interface ApartmentFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  totalCount: number;
}

export function ApartmentFilters({ 
  filters, 
  onFiltersChange, 
  totalCount 
}: ApartmentFiltersProps) {
  
  const sortOptions = [
    { value: 'date' as const, label: 'Date Added' },
    { value: 'rent' as const, label: 'Rent Price' },
    { value: 'fairness' as const, label: 'Fairness Score' },
    { value: 'mean' as const, label: 'Average Time' },
  ];

  const handleSortChange = (sortBy: FilterOptions['sortBy']) => {
    const newSortOrder = filters.sortBy === sortBy && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    onFiltersChange({ ...filters, sortBy, sortOrder: newSortOrder });
  };

  const getActiveSortLabel = () => {
    const activeOption = sortOptions.find(option => option.value === filters.sortBy);
    const direction = filters.sortOrder === 'asc' ? '↑' : '↓';
    return `${activeOption?.label || 'Date Added'} ${direction}`;
  };

  return (
    <div className="flex items-center gap-2 mb-6">
      {/* Sort Options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            Sort: {getActiveSortLabel()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-gray-800 border-gray-700">
          <DropdownMenuLabel className="text-gray-400">Sort by</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-700" />
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className="text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer flex items-center justify-between"
            >
              <span>{option.label}</span>
              {filters.sortBy === option.value && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                  <Check className="h-4 w-4 text-blue-400" />
                </div>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear Filters */}
      {(filters.sortBy !== 'date' || filters.sortOrder !== 'desc') && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFiltersChange({ sortBy: 'date', sortOrder: 'desc' })}
          className="text-gray-400 hover:text-white hover:bg-gray-700"
        >
          Clear
        </Button>
      )}

      {/* Total Count */}
      <div className="ml-auto text-xs text-gray-500">
        {totalCount} {totalCount === 1 ? 'apartment' : 'apartments'}
      </div>
    </div>
  );
}