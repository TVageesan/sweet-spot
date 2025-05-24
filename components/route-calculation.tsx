"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Loader2, MapPin, Clock } from "lucide-react";

interface RouteCalculationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  onComplete: (results: RouteResult[]) => void;
}

interface RouteResult {
  destination: string;
  distance: string;
  duration: string;
  status: 'loading' | 'completed';
}

// Dummy server function that simulates API call
const calculateRoute = async (address: string, destination: string): Promise<{ distance: string; duration: string }> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const routeData = {
    "Alex's Office": { distance: "12.4 km", duration: "28 min" },
    "Sarah's Workplace": { distance: "8.7 km", duration: "22 min" },
    "Mike's Company": { distance: "15.2 km", duration: "35 min" }
  };
  
  return routeData[destination as keyof typeof routeData] || { distance: "10.0 km", duration: "25 min" };
};

export function RouteCalculation({ open, onOpenChange, address, onComplete }: RouteCalculationProps) {
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fairnessScore, setFairnessScore] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Initialize routes when dialog opens
  useEffect(() => {
    if (open) {
      const initialRoutes = [
        { destination: "Alex's Office", distance: "", duration: "", status: 'loading' as const },
        { destination: "Sarah's Workplace", distance: "", duration: "", status: 'loading' as const },
        { destination: "Mike's Company", distance: "", duration: "", status: 'loading' as const }
      ];
      
      setRoutes(initialRoutes);
      setCurrentIndex(0);
      setFairnessScore(null);
      setIsComplete(false);
    }
  }, [open]);

  // Calculate routes sequentially
  useEffect(() => {
    if (open && currentIndex < routes.length && routes.length > 0) {
      const calculateNext = async () => {
        const route = routes[currentIndex];
        const result = await calculateRoute(address, route.destination);
        
        setRoutes(prev => prev.map((r, idx) => 
          idx === currentIndex 
            ? { ...r, distance: result.distance, duration: result.duration, status: 'completed' as const }
            : r
        ));
        
        setCurrentIndex(prev => prev + 1);
      };
      
      calculateNext();
    }
  }, [open, currentIndex, routes.length, address]);

  // Calculate fairness score when all routes are done
  useEffect(() => {
    const allCompleted = routes.length > 0 && routes.every(route => route.status === 'completed');
    
    if (allCompleted && fairnessScore === null) {
      setTimeout(() => {
        setFairnessScore(78);
        
        setTimeout(() => {
          setIsComplete(true);
          
          setTimeout(() => {
            onComplete(routes);
          }, 1000);
        }, 1500);
      }, 500);
    }
  }, [routes, fairnessScore, onComplete]);

  // Prevent closing during calculations
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isComplete) {
      return; // Block closing
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-[480px] bg-gray-800 border-gray-700 text-white"
        onPointerDownOutside={(e) => !isComplete && e.preventDefault()}
        onEscapeKeyDown={(e) => !isComplete && e.preventDefault()}
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

          {routes.map((route) => (
            <div key={route.destination} className="border border-gray-700 rounded-lg p-4 bg-gray-750">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-300">
                  {route.destination}
                </div>
                
                <div className="flex items-center gap-4">
                  {route.status === 'loading' ? (
                    <div className="flex items-center gap-2 text-blue-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Calculating...</span>
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

          {routes.length > 0 && routes.every(route => route.status === 'completed') && (
            <div className="border-t border-gray-700 pt-4 mt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Fairness Score</span>
                {fairnessScore === null ? (
                  <div className="flex items-center gap-2 text-blue-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Calculating...</span>
                  </div>
                ) : (
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
                )}
              </div>
              
              {isComplete && (
                <div className="text-center mt-4">
                  <p className="text-xs text-gray-400">Calculation complete! Proceeding to confirmation...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}