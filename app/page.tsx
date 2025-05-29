// app/page.tsx
"use client";

import { LogOut, Plus, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AddApartment, type ApartmentFormData } from "@/components/add-apartment";
import { RouteCalculation } from "@/components/route-calculation";
import { ConfirmApartment } from "@/components/confirm-apartment";
import { ApartmentCard } from "@/components/apartment-card";
import { ApartmentFilters } from "@/components/apartment-filters";
import { createClient } from "@/utils/supabase/client";
import { ApartmentService, type Apartment, type BookingStatus } from "@/utils/apartment-service";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface RouteResult {
  destination: string;
  distance: string;
  duration: string;
  status: 'loading' | 'completed' | 'error';
}

interface FilterOptions {
  status: BookingStatus | 'all';
  sortBy: 'date' | 'rent' | 'fairness' | 'status' | 'mean';
  sortOrder: 'asc' | 'desc';
}

export default function HomePage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [currentApartmentData, setCurrentApartmentData] = useState<ApartmentFormData | null>(null);
  const [routeResults, setRouteResults] = useState<RouteResult[]>([]);
  const [fairnessScore, setFairnessScore] = useState<number>(0);
  const [meanScore, setMeanScore] = useState<number>(0);
  
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [roommateNames, setRoommateNames] = useState<Record<string, string>>({});
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  const router = useRouter();
  const [apartmentService] = useState(() => new ApartmentService());
  const [supabase] = useState(() => createClient());

  // Load apartments and set up real-time subscription
  useEffect(() => {
    loadCurrentUser();
    loadApartments();
    loadRoommateNames();
    
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

  const loadCurrentUser = async () => {
    try {
      const user = await apartmentService.getCurrentUser();
      setCurrentUser(user);
      
      if (user) {
        const roommateInfo = await apartmentService.getRoommateInfo(user.id);
        if (roommateInfo) {
          setCurrentUserName(roommateInfo.name);
        }
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadRoommateNames = async () => {
    try {
      const { data: roommates, error } = await supabase
        .from('roommates')
        .select('auth_user_id, name');
      
      if (error) throw error;
      
      const nameMap: Record<string, string> = {};
      roommates?.forEach(roommate => {
        if (roommate.auth_user_id) {
          nameMap[roommate.auth_user_id] = roommate.name;
        }
      });
      
      setRoommateNames(nameMap);
    } catch (error) {
      console.error('Failed to load roommate names:', error);
    }
  };

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

  const handleRouteCalculationComplete = (results: RouteResult[], calculatedMeanScore: number, calculatedFairnessScore: number) => {
    setRouteResults(results);
    setMeanScore(calculatedMeanScore);
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
        fairnessScore,
        meanScore
      );

      setCurrentApartmentData(null);
      setRouteResults([]);
      setFairnessScore(0);
      setMeanScore(0);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Failed to save apartment:', error);
      alert('Failed to save apartment. Please scream at Thiru to fix it.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (apartmentId: string, newStatus: BookingStatus) => {
    try {
      const userId = newStatus === 'booking' ? currentUser?.id : undefined;
      await apartmentService.updateApartmentStatus(apartmentId, newStatus, userId);
    } catch (error) {
      console.error('Failed to update apartment status:', error);
      alert('Failed to update apartment status. Please try again.');
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

  // Filter and sort apartments
  const filteredAndSortedApartments = useMemo(() => {
    let filtered = apartments;
    
    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'rent':
          comparison = a.rent - b.rent;
          break;
        case 'fairness':
          comparison = a.fairness_score - b.fairness_score;
          break;
        case 'mean':
          comparison = (a.mean || 0) - (b.mean || 0);
          break;
        case 'status':
          const statusOrder = { 'booked': 0, 'booking': 1, 'not_booking': 2, 'rejected': 3 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [apartments, filters]);

  // Calculate apartment counts for filter badges
  const apartmentCounts = useMemo(() => {
    const counts = {
      all: apartments.length,
      not_booking: 0,
      booking: 0,
      booked: 0,
      rejected: 0
    };
    
    apartments.forEach(apt => {
      counts[apt.status]++;
    });
    
    return counts;
  }, [apartments]);

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
                  {apartmentCounts.all} {apartmentCounts.all === 1 ? 'Apartment' : 'Apartments'}
                  {filters.status !== 'all' && (
                    <span className="text-gray-500 ml-2">
                      ({filteredAndSortedApartments.length} shown)
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Real-time sync enabled</span>
                </div>
              </div>
              
              <ApartmentFilters
                filters={filters}
                onFiltersChange={setFilters}
                apartmentCounts={apartmentCounts}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedApartments.map((apartment) => {
                  const bookerName = apartment.booking_user_id ? roommateNames[apartment.booking_user_id] : undefined;
                  
                  return (
                    <ApartmentCard
                      key={apartment.id}
                      apartment={apartment}
                      currentUserId={currentUser?.id}
                      currentUserName={currentUserName}
                      bookerName={bookerName}
                      onDelete={handleDeleteApartment}
                      onStatusChange={handleStatusChange}
                    />
                  );
                })}
              </div>
              
              {filteredAndSortedApartments.length === 0 && filters.status !== 'all' && (
                <div className="text-center text-gray-500 mt-10">
                  <p>No apartments found with the current filters.</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ status: 'all', sortBy: 'date', sortOrder: 'desc' })}
                    className="mt-2 text-blue-400 hover:text-blue-300"
                  >
                    Clear filters
                  </Button>
                </div>
              )}
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
        meanScore={meanScore}
        onConfirm={handleConfirmApartment}
      />
    </div>
  );
}