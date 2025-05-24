"use client";

import { LogOut, Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AddApartment, type ApartmentFormData } from "@/components/add-apartment";
import { RouteCalculation } from "@/components/route-calculation";
import { ConfirmApartment } from "@/components/confirm-apartment";
import { createClient } from "@/utils/supabase/client";

interface RouteResult {
  destination: string;
  distance: string;
  duration: string;
  status: 'loading' | 'completed';
}

export default function HomePage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [currentApartmentData, setCurrentApartmentData] = useState<ApartmentFormData | null>(null);
  const [routeResults, setRouteResults] = useState<RouteResult[]>([]);
  const [fairnessScore, setFairnessScore] = useState<number>(0);
  
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const handleAddApartmentSubmit = (data: ApartmentFormData) => {
    setCurrentApartmentData(data);
    setShowAddDialog(false);
    setShowRouteDialog(true);
  };

  const handleRouteCalculationComplete = (results: RouteResult[]) => {
    setRouteResults(results);
    setFairnessScore(78); // This would come from the calculation
    setShowRouteDialog(false);
    setShowConfirmDialog(true);
  };

  const handleConfirmApartment = () => {
    // Here you would save the apartment to the database
    console.log('Saving apartment:', {
      apartmentData: currentApartmentData,
      routeResults,
      fairnessScore
    });
    
    // Reset state
    setCurrentApartmentData(null);
    setRouteResults([]);
    setFairnessScore(0);
    setShowConfirmDialog(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header with Logout */}
      <header className="flex justify-between items-center px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <img src="/favicon.ico" alt="Sweet Spot" className="w-6 h-6" />
          <h1 className="text-xl font-light tracking-wide">Sweet Spot</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut} className="border-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </header>

      {/* Main Content Area - Empty for now */}
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Main apartment listings will go here */}
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg">No apartments added yet.</p>
            <p className="text-sm mt-2">Click the + button to add your first apartment!</p>
          </div>
        </div>
      </main>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6">
        <button
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-500 text-white border-0 flex items-center justify-center"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="h-6 w-6 text-white" strokeWidth={2} />
        </button>
      </div>

      {/* Dialog Components */}
      <AddApartment 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onSubmit={handleAddApartmentSubmit}
      />
      
      <RouteCalculation
        open={showRouteDialog}
        onOpenChange={setShowRouteDialog}
        address={currentApartmentData?.address || ""}
        onComplete={handleRouteCalculationComplete}
      />
      
      <ConfirmApartment
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        apartmentData={currentApartmentData || { url: "", address: "", rooms: "", rent: "" }}
        routeResults={routeResults}
        fairnessScore={fairnessScore}
        onConfirm={handleConfirmApartment}
      />
    </div>
  );
}