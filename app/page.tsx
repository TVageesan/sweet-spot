// app/page.tsx
"use client";

import { LogOut, Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AddApartment, type ApartmentFormData } from "@/components/add-apartment";
import { RouteCalculation } from "@/components/route-calculation";
import { ConfirmApartment } from "@/components/confirm-apartment";
import { ApartmentCard } from "@/components/apartment-card";
import { createClient } from "@/utils/supabase/client";
import { ApartmentService, type Apartment } from "@/utils/apartment-service";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface RouteResult {
  destination: string;
  distance: string;
  duration: string;
  status: 'loading' | 'completed' | 'error';
}

export default function HomePage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [currentApartmentData, setCurrentApartmentData] = useState<ApartmentFormData | null>(null);
  const [routeResults, setRouteResults] = useState<RouteResult[]>([]);
  const [fairnessScore, setFairnessScore] = useState<number>(0);
  
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const router = useRouter();
  const [apartmentService] = useState(() => new ApartmentService());
  const [supabase] = useState(() => createClient());

  // Load apartments and set up real-time subscription
  useEffect(() => {
    loadApartments();
    
    const channel = supabase
      .channel('apartments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'apartments'
        },
        async (payload) => {
          console.log('Real-time update:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Fetch the complete apartment with routes
            const { data } = await supabase
              .from('apartments')
              .select(`
                *,
                routes:apartment_routes(*)
              `)
              .eq('id', payload.new.id)
              .single();
            
            if (data) {
              setApartments(prev => {
                // Check if apartment already exists (to avoid duplicates)
                if (prev.some(apt => apt.id === data.id)) {
                  return prev;
                }
                return [data, ...prev];
              });
            }
          } else if (payload.eventType === 'DELETE') {
            console.log('received DELETE event');
            setApartments(prev => prev.filter(apt => apt.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            // Fetch updated apartment with routes
            const { data } = await supabase
              .from('apartments')
              .select(`
                *,
                routes:apartment_routes(*)
              `)
              .eq('id', payload.new.id)
              .single();
            
            if (data) {
              setApartments(prev => prev.map(apt => 
                apt.id === data.id ? data : apt
              ));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const loadApartments = async () => {
    try {
      setLoading(true);
      const data = await apartmentService.getApartments();
      setApartments(data);
    } catch (error) {
      console.error('Failed to load apartments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleAddApartmentSubmit = (data: ApartmentFormData) => {
    setCurrentApartmentData(data);
    setShowAddDialog(false);
    setShowRouteDialog(true);
  };

  const handleRouteCalculationComplete = (results: RouteResult[], calculatedFairnessScore: number) => {
    setRouteResults(results);
    setFairnessScore(calculatedFairnessScore);
    setShowRouteDialog(false);
    setShowConfirmDialog(true);
  };

  const handleConfirmApartment = async () => {
    if (!currentApartmentData) return;
    
    setSaving(true);
    try {
      await apartmentService.createApartment(
        currentApartmentData,
        routeResults,
        fairnessScore
      );

      setCurrentApartmentData(null);
      setRouteResults([]);
      setFairnessScore(0);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Failed to save apartment:', error);
      alert('Failed to save apartment. Please scream at Thiru to fix it.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteApartment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this apartment?')) return;
    
    try {
      console.log('handledeletePaarmtnet fires', id)
      await apartmentService.deleteApartment(id);
    } catch (error) {
      alert('Failed to delete apartment. Please scream at Thiru to fix it.')
      console.error('Failed to delete apartment:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header with Logout */}
      <header className="flex justify-between items-center px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-light tracking-wide">Sweet Spot</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut} className="border-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center mt-20">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : apartments.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <p className="text-lg">No apartments added yet.</p>
              <p className="text-sm mt-2">Click the + button to add your first apartment!</p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-300">
                  {apartments.length} {apartments.length === 1 ? 'Apartment' : 'Apartments'}
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Real-time sync enabled</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {apartments.map((apartment) => (
                  <ApartmentCard
                    key={apartment.id}
                    apartment={apartment}
                    onDelete={handleDeleteApartment}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6">
        <button
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-500 text-white border-0 flex items-center justify-center"
          onClick={() => setShowAddDialog(true)}
          disabled={saving}
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
        onOpenChange={(open) => !saving && setShowConfirmDialog(open)}
        apartmentData={currentApartmentData || { url: "", address: "", rooms: "", rent: "" }}
        routeResults={routeResults}
        fairnessScore={fairnessScore}
        onConfirm={handleConfirmApartment}
      />
    </div>
  );
}