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
import { Filter, Check } from "lucide-react";
import type { BookingStatus } from "@/utils/apartment-service";

interface FilterOptions {
  status: BookingStatus | 'all';
  sortBy: 'date' | 'rent' | 'fairness' | 'status' | 'mean';
  sortOrder: 'asc' | 'desc';
}

interface ApartmentFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  apartmentCounts: Record<BookingStatus | 'all', number>;
}

export function ApartmentFilters({ 
  filters, 
  onFiltersChange, 
  apartmentCounts 
}: ApartmentFiltersProps) {
  
  const statusOptions = [
    { value: 'all' as const, label: 'All Apartments', count: apartmentCounts.all },
    { value: 'not_booking' as const, label: 'Available', count: apartmentCounts.not_booking },
    { value: 'booking' as const, label: 'In Progress', count: apartmentCounts.booking },
    { value: 'booked' as const, label: 'Accepted', count: apartmentCounts.booked },
    { value: 'rejected' as const, label: 'Rejected', count: apartmentCounts.rejected },
  ];

  const sortOptions = [
    { value: 'date' as const, label: 'Date Added' },
    { value: 'rent' as const, label: 'Rent Price' },
    { value: 'fairness' as const, label: 'Fairness Score' },
    { value: 'mean' as const, label: 'Average Time' },
    { value: 'status' as const, label: 'Status' },
  ];

  const handleStatusChange = (status: BookingStatus | 'all') => {
    onFiltersChange({ ...filters, status });
  };

  const handleSortChange = (sortBy: FilterOptions['sortBy']) => {
    const newSortOrder = filters.sortBy === sortBy && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    onFiltersChange({ ...filters, sortBy, sortOrder: newSortOrder });
  };

  const getActiveStatusLabel = () => {
    const activeOption = statusOptions.find(option => option.value === filters.status);
    return activeOption?.label || 'All Apartments';
  };

  const getActiveSortLabel = () => {
    const activeOption = sortOptions.find(option => option.value === filters.sortBy);
    const direction = filters.sortOrder === 'asc' ? '↑' : '↓';
    return `${activeOption?.label || 'Date Added'} ${direction}`;
  };

  return (
    <div className="flex items-center gap-2 mb-6">
      {/* Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Filter className="h-4 w-4 mr-2" />
            {getActiveStatusLabel()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-gray-800 border-gray-700 w-48">
          <DropdownMenuLabel className="text-gray-400">Filter by Status</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-700" />
          {statusOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className="text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer flex items-center justify-between"
            >
              <span>{option.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">({option.count})</span>
                {filters.status === option.value && (
                  <Check className="h-4 w-4 text-blue-400" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

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
      {(filters.status !== 'all' || filters.sortBy !== 'date' || filters.sortOrder !== 'desc') && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFiltersChange({ status: 'all', sortBy: 'date', sortOrder: 'desc' })}
          className="text-gray-400 hover:text-white hover:bg-gray-700"
        >
          Clear
        </Button>
      )}
    </div>
  );
}