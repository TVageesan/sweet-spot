'use client';

import { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";

interface Roommate {
  id: string;
  auth_user_id: string | null;
  name: string;
  work_address: string;
  avatar_color: string;
  created_at: string;
}

export default function LoginPage() {
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchRoommates();
  }, []);

  const fetchRoommates = async () => {
    console.log('Fetching roommates...');
    
    try {
      const { data, error } = await supabase
        .from('roommates')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching roommates:', error);
        return;
      }

      console.log('Roommates fetched:', data);
      setRoommates(data || []);
    } catch (error) {
      console.error('Exception fetching roommates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = async (roommateId: string, roommateName: string) => {
    console.log(`Signing in as ${roommateName} (ID: ${roommateId})`);
    setSelectedUser(roommateId);
    setSigningIn(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            roommate_id: roommateId,
            roommate_name: roommateName,
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        alert(`Failed to sign in: ${authError.message}`);
        return;
      }

      console.log('Auth session created:', {
        user_id: authData.user?.id,
        metadata: authData.user?.user_metadata
      });

      if (authData.user) {
        console.log('Linking auth user to roommate record...');
        const { error: updateError } = await supabase
          .from('roommates')
          .update({ auth_user_id: authData.user.id })
          .eq('id', roommateId);

        if (updateError) {
          console.error('Failed to link user to roommate:', updateError);
        } else {
          console.log('Successfully linked auth user to roommate');
        }
      }

      console.log('Verifying current session...');
      const { data: session } = await supabase.auth.getSession();
      console.log('Current session:', {
        user_id: session.session?.user?.id,
        expires_at: session.session?.expires_at,
        metadata: session.session?.user?.user_metadata
      });

      console.log('Sign in successful!');
    } catch (error) {
      console.error('Exception during sign in:', error);
    } finally {
      setSigningIn(false);
      setSelectedUser(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-16">
          <h1 className="text-3xl font-light text-slate-200 mb-2">
            Who's hunting today?
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {roommates.map((roommate) => (
            <button
              key={roommate.id}
              onClick={() => handleUserSelect(roommate.id, roommate.name)}
              disabled={signingIn}
              className={`
                relative group p-6 rounded-2xl transition-all duration-200
                ${selectedUser === roommate.id 
                  ? 'scale-105' 
                  : 'hover:scale-105'
                }
                ${signingIn && selectedUser !== roommate.id 
                  ? 'opacity-40 cursor-not-allowed' 
                  : 'cursor-pointer hover:bg-slate-800/50'
                }
              `}
            >
              {/* Avatar */}
              <div 
                className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-lg font-medium text-white"
                style={{ backgroundColor: roommate.avatar_color }}
              >
                {roommate.name.charAt(0).toUpperCase()}
              </div>

              {/* Name */}
              <h3 className="text-base font-medium text-slate-200">
                {roommate.name}
              </h3>

              {/* Loading Spinner */}
              {signingIn && selectedUser === roommate.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-2xl">
                  <div className="w-5 h-5 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          ))}
        </div>

        {roommates.length === 0 && (
          <div className="text-center text-slate-500">
            <p>No roommates found.</p>
          </div>
        )}
      </div>
    </div>
  );
}