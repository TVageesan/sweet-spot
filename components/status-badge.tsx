// components/status-badge.tsx
"use client";

import { Clock, CheckCircle, XCircle, Users } from "lucide-react";
import type { BookingStatus } from "@/utils/apartment-service";

interface StatusBadgeProps {
  status: BookingStatus;
  bookerName?: string;
  updatedAt?: string;
  className?: string;
}

export function StatusBadge({ 
  status, 
  bookerName, 
  updatedAt, 
  className = "" 
}: StatusBadgeProps) {
  
  const getStatusConfig = (status: BookingStatus) => {
    switch (status) {
      case 'not_booking':
        return {
          icon: Users,
          text: 'Available',
          bgColor: 'bg-gray-700',
          textColor: 'text-gray-300',
          borderColor: 'border-gray-600'
        };
      case 'booking':
        return {
          icon: Clock,
          text: `Booking by ${bookerName || 'Someone'}`,
          bgColor: 'bg-blue-900/50',
          textColor: 'text-blue-300',
          borderColor: 'border-blue-600'
        };
      case 'booked':
        return {
          icon: CheckCircle,
          text: 'Accepted',
          bgColor: 'bg-green-900/50',
          textColor: 'text-green-300',
          borderColor: 'border-green-600'
        };
      case 'rejected':
        return {
          icon: XCircle,
          text: 'Rejected',
          bgColor: 'bg-red-900/50',
          textColor: 'text-red-300',
          borderColor: 'border-red-600'
        };
      default:
        return {
          icon: Users,
          text: 'Unknown',
          bgColor: 'bg-gray-700',
          textColor: 'text-gray-300',
          borderColor: 'border-gray-600'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}>
      <Icon className="h-3 w-3" />
      <span className="truncate max-w-[120px]">{config.text}</span>
      {updatedAt && status !== 'not_booking' && (
        <span className="text-xs opacity-70 ml-1">
          {new Date(updatedAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}