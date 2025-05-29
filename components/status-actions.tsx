// components/status-actions.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Clock, CheckCircle, XCircle, Users } from "lucide-react";
import type { BookingStatus } from "@/utils/apartment-service";

interface StatusActionsProps {
  currentStatus: BookingStatus;
  canModify: boolean;
  isCurrentUserBooking: boolean;
  onStatusChange: (newStatus: BookingStatus) => void;
  disabled?: boolean;
}

export function StatusActions({ 
  currentStatus, 
  canModify, 
  isCurrentUserBooking,
  onStatusChange, 
  disabled = false 
}: StatusActionsProps) {

  if (!canModify && currentStatus === 'not_booking') {
    return (
      <Button
        size="sm"
        onClick={() => onStatusChange('booking')}
        disabled={disabled}
        className="bg-blue-600 hover:bg-blue-500 text-white"
      >
        <Clock className="h-3 w-3 mr-1" />
        Start Booking
      </Button>
    );
  }

  if (!canModify) {
    return null;
  }

  const getAvailableStatuses = (): Array<{ status: BookingStatus; label: string; icon: any }> => {
    if (currentStatus === 'not_booking') {
      return [];
    }
    
    if (currentStatus === 'booking') {
      return [
        { status: 'not_booking', label: 'Release Claim', icon: Users },
        { status: 'booked', label: 'Mark as Accepted', icon: CheckCircle },
        { status: 'rejected', label: 'Mark as Rejected', icon: XCircle },
      ];
    }
    
    if (currentStatus === 'booked' || currentStatus === 'rejected') {
      return [
        { status: 'not_booking', label: 'Reset to Available', icon: Users },
      ];
    }
    
    return [];
  };

  const availableStatuses = getAvailableStatuses();

  if (availableStatuses.length === 0) {
    return null;
  }

  const handleStatusSelect = (newStatus: BookingStatus) => {
    if (newStatus === currentStatus) return;
    
    // Add confirmation for important actions
    if (newStatus === 'booked') {
      if (!confirm('Are you sure this apartment was accepted by the landlord?')) {
        return;
      }
    } else if (newStatus === 'rejected') {
      if (!confirm('Are you sure this apartment was rejected?')) {
        return;
      }
    } else if (newStatus === 'not_booking' && currentStatus === 'booked') {
      if (!confirm('Are you sure you want to reset this accepted apartment?')) {
        return;
      }
    }
    
    onStatusChange(newStatus);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          Update Status
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-800 border-gray-700">
        {availableStatuses.map(({ status, label, icon: Icon }) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleStatusSelect(status)}
            className="text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}