// components/status-dropdown.tsx
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { ApartmentStatus, STATUS_LABELS, STATUS_COLORS } from "@/utils/apartment-service";

interface StatusDropdownProps {
  currentStatus: ApartmentStatus;
  onStatusChange: (status: ApartmentStatus) => void;
  disabled?: boolean;
}

export function StatusDropdown({ currentStatus, onStatusChange, disabled = false }: StatusDropdownProps) {
  const statusOptions = [
    ApartmentStatus.AVAILABLE,
    ApartmentStatus.BOOKING,
    ApartmentStatus.ACCEPTED,
    ApartmentStatus.REJECTED
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button className={`
          inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border
          transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed
          ${STATUS_COLORS[currentStatus]}
        `}>
          {STATUS_LABELS[currentStatus]}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="bg-gray-800 border-gray-700" align="end">
        {statusOptions.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => onStatusChange(status)}
            className="text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
          >
            <span className={`
              inline-block w-2 h-2 rounded-full mr-2
              ${status === ApartmentStatus.AVAILABLE ? 'bg-green-400' : ''}
              ${status === ApartmentStatus.BOOKING ? 'bg-yellow-400' : ''}
              ${status === ApartmentStatus.ACCEPTED ? 'bg-blue-400' : ''}
              ${status === ApartmentStatus.REJECTED ? 'bg-red-400' : ''}
            `} />
            {STATUS_LABELS[status]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}