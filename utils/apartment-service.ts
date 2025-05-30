// utils/apartment-service.ts
import { createClient } from '@/utils/supabase/client';

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
          mean: meanScore
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

      if (error) throw error;

      return apartments || [];
    } catch (error) {
      console.error('Error fetching apartments:', error);
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
        .select('name')
        .eq('auth_user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching roommate info:', error);
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