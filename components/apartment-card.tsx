// components/apartment-card.tsx
"use client";

import { Home, MapPin, Clock, Euro, ExternalLink, Users, Trash2, Target, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { StatusActions } from "@/components/status-actions";
import type { Apartment, BookingStatus } from "@/utils/apartment-service";

interface ApartmentCardProps {
  apartment: Apartment;
  currentUserId?: string;
  currentUserName?: string;
  bookerName?: string;
  onDelete?: (id: string) => void;
  onStatusChange?: (apartmentId: string, newStatus: BookingStatus) => void;
}

export function ApartmentCard({ 
  apartment, 
  currentUserId,
  currentUserName,
  bookerName,
  onDelete,
  onStatusChange 
}: ApartmentCardProps) {
  const isCurrentUserBooking = true;
  const canModifyStatus = apartment.status === 'not_booking' || isCurrentUserBooking;

  const handleStatusChange = (newStatus: BookingStatus) => {
    if (onStatusChange) {
      onStatusChange(apartment.id, newStatus);
    }
  };

  // Determine card styling based on status
  const getCardBorderClass = () => {
    switch (apartment.status) {
      case 'booked':
        return 'border-green-600 bg-green-900/10';
      case 'rejected':
        return 'border-red-600 bg-red-900/10';
      case 'booking':
        return 'border-blue-600 bg-blue-900/10';
      default:
        return 'border-gray-700';
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg border overflow-hidden hover:border-gray-600 transition-colors ${getCardBorderClass()}`}>
      {/* Header with Status */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-start justify-between gap-2 mb-2">
          <StatusBadge 
            status={apartment.status} 
            bookerName={bookerName}
            updatedAt={apartment.status_updated_at}
          />
          {apartment.url && (
            <a
              href={apartment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-gray-700 transition-colors"
              title="View listing"
            >
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </a>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Home className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <h3 className="text-sm font-medium text-white truncate">
              {apartment.address}
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-400">
              {apartment.rooms} {apartment.rooms === 1 ? 'room' : 'rooms'}
            </span>
            <div className="flex items-center gap-1 text-green-400">
              <Euro className="h-3 w-3" />
              <span className="font-medium">{apartment.rent}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Scores */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-blue-400" />
              <span className="text-xs text-gray-400">Fairness Score</span>
            </div>
            <span className="text-sm font-medium text-white">{apartment.fairness_score}/100</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Timer className="h-3 w-3 text-orange-400" />
              <span className="text-xs text-gray-400">Average Time</span>
            </div>
            <span className="text-sm font-medium text-white">{apartment.mean || 0} mins</span>
          </div>
        </div>
      </div>

      {/* Commute Times */}
      {apartment.routes && apartment.routes.length > 0 && (
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-400">Commute Times</span>
          </div>
          <div className="space-y-1">
            {apartment.routes.map((route, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-gray-500 truncate max-w-[140px]" title={route.destination}>
                  {route.destination}
                </span>
                {route.status === 'error' ? (
                  <span className="text-red-400">Error</span>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-gray-400">
                      <MapPin className="h-3 w-3" />
                      <span>{route.distance}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-400">
                      <Clock className="h-3 w-3" />
                      <span>{route.duration}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-700 flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Added {new Date(apartment.created_at).toLocaleDateString()}
          </span>
          {apartment.status !== 'not_booking' && (
            <span className="text-xs text-gray-500">
              • Updated {new Date(apartment.status_updated_at).toLocaleDateString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {onStatusChange && (
            <StatusActions
              currentStatus={apartment.status}
              canModify={canModifyStatus}
              isCurrentUserBooking={isCurrentUserBooking}
              onStatusChange={handleStatusChange}
            />
          )}
          
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(apartment.id)}
              className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}