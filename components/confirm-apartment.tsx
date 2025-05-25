// components/confirm-apartment.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Home, Euro, ExternalLink, AlertCircle } from "lucide-react";

interface ConfirmApartmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentData: {
    url: string;
    address: string;
    rooms: string;
    rent: string;
  };
  routeResults: RouteResult[];
  fairnessScore: number;
  onConfirm: () => void;
}

interface RouteResult {
  destination: string;
  distance: string;
  duration: string;
  status: 'loading' | 'completed' | 'error';
}

export function ConfirmApartment({ 
  open, 
  onOpenChange, 
  apartmentData, 
  routeResults, 
  fairnessScore,
  onConfirm 
}: ConfirmApartmentProps) {
  
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-gray-800 border-gray-700 text-white max-h-[80vh] flex flex-col">
        <DialogHeader className="pb-3 flex-shrink-0">
          <DialogTitle className="text-white text-lg flex items-center gap-2">
            <Home className="h-5 w-5" />
            Confirm Apartment Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          {/* Apartment Details */}
          <div className="bg-gray-750 rounded-lg p-3 border border-gray-700">
            <h3 className="text-xs font-medium text-gray-300 mb-2">Apartment Information</h3>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Address:</span>
                <span className="text-xs text-white max-w-[200px] text-right truncate">{apartmentData.address}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Rooms:</span>
                <span className="text-xs text-white">{apartmentData.rooms}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Monthly Rent:</span>
                <div className="flex items-center gap-1">
                  <Euro className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">{apartmentData.rent}</span>
                </div>
              </div>
              {apartmentData.url && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Listing:</span>
                  <a 
                    href={apartmentData.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Listing
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Route Results */}
          <div className="bg-gray-750 rounded-lg p-3 border border-gray-700">
            <h3 className="text-xs font-medium text-gray-300 mb-2">Commute Times (Public Transit - Monday 8 AM)</h3>
            <div className="space-y-1.5">
              {routeResults.map((route) => (
                <div key={route.destination} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 max-w-[50%] truncate">{route.destination}:</span>
                  {route.status === 'error' ? (
                    <div className="flex items-center gap-1 text-red-400 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      <span>Error</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 text-gray-300">
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

          {/* Fairness Score */}
          <div className="bg-gray-750 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-gray-300">Location Fairness</h3>
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold text-green-400">{fairnessScore}/100</div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  fairnessScore >= 80 ? 'bg-green-900 text-green-300' :
                  fairnessScore >= 60 ? 'bg-yellow-900 text-yellow-300' :
                  'bg-red-900 text-red-300'
                }`}>
                  {fairnessScore >= 80 ? 'Excellent' : fairnessScore >= 60 ? 'Good' : 'Fair'}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Based on commute balance for all roommates
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-3 pt-3 flex-shrink-0 border-t border-gray-700 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-500 text-white"
          >
            Add to List
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}