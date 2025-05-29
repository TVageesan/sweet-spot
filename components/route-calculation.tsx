// components/route-calculation.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Loader2, MapPin, Clock, AlertCircle } from "lucide-react";

interface RouteCalculationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  onComplete: (results: RouteResult[], mean: number, fairness: number) => void;
}

interface RouteResult {
  destination: string;
  distance: string;
  duration: string;
  status: 'loading' | 'completed' | 'error';
}

export function RouteCalculation({ open, onOpenChange, address, onComplete }: RouteCalculationProps) {
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [mean, setMean] = useState<number | null>(null);
  const [variance, setVariance] = useState<number | null>(null);
  const [fairnessScore, setFairnessScore] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate routes when dialog opens
  useEffect(() => {
    if (open && address) {
      calculateRoutes();
    }
  }, [open, address]);

  const calculateRoutes = async () => {
    setIsCalculating(true);
    setError(null);
    setRoutes([]);
    setMean(null);
    setVariance(null);
    setFairnessScore(null);

    try {
      const response = await fetch('/api/calculate-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apartmentAddress: address }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate routes');
      }

      const data = await response.json();
      
      setRoutes(data.routes);
      
      setMean(data.mean);
      setFairnessScore(data.fairnessScore);

      // Wait a moment before completing to show the results
      setTimeout(() => {
        onComplete(data.routes, data.mean, data.fairnessScore);
      }, 1500);

    } catch (err) {
      console.error('Error calculating routes:', err);
      setError('Failed to calculate routes. Please try again.');
      setIsCalculating(false);
    }
  };

  // Prevent closing during calculations
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isCalculating) {
      return; // Block closing
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-[480px] bg-gray-800 border-gray-700 text-white"
        onPointerDownOutside={(e) => isCalculating && e.preventDefault()}
        onEscapeKeyDown={(e) => isCalculating && e.preventDefault()}
      >
        <DialogHeader className="pb-4">
          <DialogTitle className="text-white text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Calculating Routes
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-400 mb-4">
            From: <span className="text-white">{address}</span>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {isCalculating && routes.length === 0 && !error && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                <span className="text-gray-300">Calculating optimal routes...</span>
              </div>
            </div>
          )}

          {routes.map((route) => (
            <div key={route.destination} className="border border-gray-700 rounded-lg p-4 bg-gray-750">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-300 max-w-[60%] truncate">
                  {route.destination}
                </div>
                
                <div className="flex items-center gap-4">
                  {route.status === 'error' ? (
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Error</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-green-400">
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
              </div>
            </div>
          ))}

          {fairnessScore !== null && (
            <div className="border-t border-gray-700 pt-4 mt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Location Fairness</span>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-green-400">{fairnessScore}/100</div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    fairnessScore >= 80 ? 'bg-green-900 text-green-300' :
                    fairnessScore >= 60 ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {fairnessScore >= 80 ? 'Excellent' : fairnessScore >= 60 ? 'Good' : 'Fair'}
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                Based on public transit commute times for Monday 8 AM
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}