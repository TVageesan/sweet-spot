// utils/apartment-service.ts
import { createClient } from '@/utils/supabase/client';

// Status enum for apartment booking status
export enum ApartmentStatus {
  AVAILABLE = 0,
  BOOKING = 1,
  ACCEPTED = 2,
  REJECTED = 3
}

export const STATUS_LABELS = {
  [ApartmentStatus.AVAILABLE]: 'Available',
  [ApartmentStatus.BOOKING]: 'Booking',
  [ApartmentStatus.ACCEPTED]: 'Accepted',
  [ApartmentStatus.REJECTED]: 'Rejected'
};

export const STATUS_COLORS = {
  [ApartmentStatus.AVAILABLE]: 'bg-green-900/20 text-green-300 border-green-700',
  [ApartmentStatus.BOOKING]: 'bg-yellow-900/20 text-yellow-300 border-yellow-700',
  [ApartmentStatus.ACCEPTED]: 'bg-blue-900/20 text-blue-300 border-blue-700',
  [ApartmentStatus.REJECTED]: 'bg-red-900/20 text-red-300 border-red-700'
};

export interface Apartment {
  id: string;
  url: string;
  address: string;
  rooms: number;
  rent: number;
  fairness_score: number;
  mean: number;
  created_at: string;
  created_by?: string;
  status: ApartmentStatus;
  booked_by?: string;
  routes?: ApartmentRoute[];
}

export interface ApartmentRoute {
  id?: string;
  apartment_id?: string;
  destination: string;
  distance: string;
  duration: string;
  status: string;
}

export interface RoommateInfo {
  id: string;
  name: string;
  auth_user_id: string;
  avatar_color: string;
}

export class ApartmentService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  async createApartment(
    apartmentData: {
      url: string;
      address: string;
      rooms: string;
      rent: string;
    },
    routes: ApartmentRoute[],
    fairnessScore: number,
    meanScore: number
  ): Promise<Apartment> {
    try {
      // Insert apartment
      console.log('creatingApartment', apartmentData);
      
      const { data: apartment, error: apartmentError } = await this.supabase
        .from('apartments')
        .insert({
          url: apartmentData.url || null,
          address: apartmentData.address,
          rooms: parseInt(apartmentData.rooms),
          rent: parseFloat(apartmentData.rent),
          fairness_score: fairnessScore,
          mean: meanScore,
          status: ApartmentStatus.AVAILABLE, // Default to available
          booked_by: null
        })
        .select()
        .single();

      if (apartmentError) throw apartmentError;

      // Insert routes
      if (apartment && routes.length > 0) {
        console.log("Inserting route", routes);

        const routesData = routes.map(route => ({
          apartment_id: apartment.id,
          destination: route.destination,
          distance: route.distance,
          duration: route.duration
        }));

        const { error: routesError } = await this.supabase
          .from('apartment_routes')
          .insert(routesData);

        if (routesError) {
          console.error('Error inserting routes:', routesError);
        }
      }

      return apartment;
    } catch (error) {
      console.error('Error creating apartment:', error);
      throw error;
    }
  }

  async getApartments(): Promise<Apartment[]> {
    try {
      const { data: apartments, error } = await this.supabase
        .from('apartments')
        .select(`
          *,
          routes:apartment_routes(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching apartments:', error);
        throw error;
      }

      // Ensure status field exists and has a default value
      const processedApartments = (apartments || []).map(apt => ({
        ...apt,
        status: apt.status ?? ApartmentStatus.AVAILABLE, // Default to available if null
        booked_by: apt.booked_by || undefined
      }));

      console.log('Processed apartments with status:', processedApartments[0]);
      return processedApartments;
    } catch (error) {
      console.error('Error fetching apartments:', error);
      throw error;
    }
  }

  async updateApartmentStatus(apartmentId: string, status: ApartmentStatus, bookedBy?: string): Promise<void> {
    try {
      const updateData: any = { status };
      
      // Set booked_by based on status
      if (status === ApartmentStatus.BOOKING && bookedBy) {
        updateData.booked_by = bookedBy;
      } else if (status !== ApartmentStatus.BOOKING) {
        updateData.booked_by = null;
      }

      console.log('Updating apartment status:', { apartmentId, updateData });

      const { data, error } = await this.supabase
        .from('apartments')
        .update(updateData)
        .eq('id', apartmentId)
        .select(); // Add select to see what was actually updated

      console.log('Supabase update response:', { data, error });

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Apartment status updated successfully, returned data:', data);
    } catch (error) {
      console.error('Error updating apartment status:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async getRoommateInfo(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('roommates')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching roommate info:', error);
      return null;
    }
  }

  async getRoommateById(roommateId: string): Promise<RoommateInfo | null> {
    try {
      const { data, error } = await this.supabase
        .from('roommates')
        .select('*')
        .eq('auth_user_id', roommateId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching roommate by id:', error);
      return null;
    }
  }

  async deleteApartment(id: string): Promise<void> {
    try {
      console.log('deleteApartment fires', id)
      const { error } = await this.supabase
        .from('apartments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      console.log('deleteApartment no error')
    } catch (error) {
      console.error('Error deleting apartment:', error);
      throw error;
    }
  }
}