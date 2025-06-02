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
import { Check, Filter } from "lucide-react";
import { ApartmentStatus, STATUS_LABELS } from "@/utils/apartment-service";

interface FilterOptions {
  sortBy: 'date' | 'rent' | 'fairness' | 'mean';
  sortOrder: 'asc' | 'desc';
  statusFilter: ApartmentStatus | 'all';
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

  const statusFilterOptions = [
    { value: 'all' as const, label: 'All Statuses' },
    { value: ApartmentStatus.AVAILABLE, label: STATUS_LABELS[ApartmentStatus.AVAILABLE] },
    { value: ApartmentStatus.BOOKING, label: STATUS_LABELS[ApartmentStatus.BOOKING] },
    { value: ApartmentStatus.ACCEPTED, label: STATUS_LABELS[ApartmentStatus.ACCEPTED] },
    { value: ApartmentStatus.REJECTED, label: STATUS_LABELS[ApartmentStatus.REJECTED] },
  ];

  const handleSortChange = (sortBy: FilterOptions['sortBy']) => {
    const newSortOrder = filters.sortBy === sortBy && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    onFiltersChange({ ...filters, sortBy, sortOrder: newSortOrder });
  };

  const handleStatusFilterChange = (statusFilter: FilterOptions['statusFilter']) => {
    onFiltersChange({ ...filters, statusFilter });
  };

  const getActiveSortLabel = () => {
    const activeOption = sortOptions.find(option => option.value === filters.sortBy);
    const direction = filters.sortOrder === 'asc' ? '↑' : '↓';
    return `${activeOption?.label || 'Date Added'} ${direction}`;
  };

  const getActiveStatusFilterLabel = () => {
    const activeOption = statusFilterOptions.find(option => option.value === filters.statusFilter);
    return activeOption?.label || 'All Statuses';
  };

  const hasActiveFilters = () => {
    return (
      filters.sortBy !== 'date' || 
      filters.sortOrder !== 'desc' || 
      filters.statusFilter !== 'all'
    );
  };

  const clearFilters = () => {
    onFiltersChange({ 
      sortBy: 'date', 
      sortOrder: 'desc', 
      statusFilter: 'all' 
    });
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

      {/* Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Filter className="h-4 w-4 mr-1" />
            {getActiveStatusFilterLabel()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-gray-800 border-gray-700">
          <DropdownMenuLabel className="text-gray-400">Filter by status</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-700" />
          {statusFilterOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleStatusFilterChange(option.value)}
              className="text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {option.value !== 'all' && (
                  <span className={`
                    w-2 h-2 rounded-full
                    ${option.value === ApartmentStatus.AVAILABLE ? 'bg-green-400' : ''}
                    ${option.value === ApartmentStatus.BOOKING ? 'bg-yellow-400' : ''}
                    ${option.value === ApartmentStatus.ACCEPTED ? 'bg-blue-400' : ''}
                    ${option.value === ApartmentStatus.REJECTED ? 'bg-red-400' : ''}
                  `} />
                )}
                <span>{option.label}</span>
              </div>
              {filters.statusFilter === option.value && (
                <Check className="h-4 w-4 text-blue-400" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear Filters */}
      {hasActiveFilters() && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
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