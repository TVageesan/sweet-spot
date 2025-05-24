// app/protected/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface Roommate {
  id: string;
  auth_user_id: string | null;
  name: string;
  work_address: string;
  avatar_color: string;
  created_at: string;
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [roommate, setRoommate] = useState<Roommate | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      // Get current auth user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.log("❌ No authenticated user found");
        router.push("/");
        return;
      }

      console.log("✅ Authenticated user:", {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      });

      setUser(user);

      // Get linked roommate
      const { data: roommateData, error: roommateError } = await supabase
        .from("roommates")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (!roommateError && roommateData) {
        console.log("✅ Linked roommate found:", roommateData);
        setRoommate(roommateData);
      } else {
        console.log("⚠️ No roommate linked to this auth user");
      }
    } catch (error) {
      console.error("❌ Error getting current user:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return; // Prevent double execution

    setLoggingOut(true);
    console.log("🔄 Logging out...");

    try {
      // Just sign out - no need to clear roommate link
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("❌ Logout error:", error);
        alert(`Logout failed: ${error.message}`);
        return;
      }

      console.log("✅ Successfully logged out");

      // Clear local state
      setUser(null);
      setRoommate(null);

      // Redirect to login
      router.push("/login");
    } catch (error) {
      console.error("❌ Exception during logout:", error);
      alert("Logout failed. Please try again.");
    } finally {
      setLoggingOut(false);
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
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light text-slate-200 mb-4">
            Protected Page
          </h1>
          <p className="text-slate-400">Authentication successful! 🎉</p>
        </div>

        {/* User Info Card */}
        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-medium text-slate-200 mb-4">
            Auth User Info
          </h2>
          <div className="space-y-2 text-sm">
            <p className="text-slate-300">
              <strong>User ID:</strong>{" "}
              <span className="text-slate-400">{user?.id}</span>
            </p>
            <p className="text-slate-300">
              <strong>Email:</strong>{" "}
              <span className="text-slate-400">{user?.email || "N/A"}</span>
            </p>
            <p className="text-slate-300">
              <strong>Created:</strong>{" "}
              <span className="text-slate-400">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleString()
                  : "N/A"}
              </span>
            </p>
          </div>
        </div>

        {/* Roommate Info Card */}
        {roommate && (
          <div className="bg-slate-800 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-medium text-slate-200 mb-4">
              Roommate Profile
            </h2>
            <div className="flex items-center space-x-4 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: roommate.avatar_color }}
              >
                {roommate.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-slate-200">{roommate.name}</p>
                <p className="text-sm text-slate-400">Linked successfully</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-400">
              <p>
                <strong className="text-slate-300">Work:</strong>{" "}
                {roommate.work_address.split(",")[0]}
              </p>
              <p>
                <strong className="text-slate-300">Roommate ID:</strong>{" "}
                {roommate.id}
              </p>
            </div>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-6 py-3 bg-slate-200 text-slate-900 rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-slate-800 rounded-xl border border-slate-700">
            <h3 className="font-medium text-slate-200 mb-2">🔧 Debug Info</h3>
            <div className="text-xs text-slate-400 space-y-1">
              <p>✅ Authentication working</p>
              <p>✅ Middleware redirected to /protected</p>
              <p>✅ {roommate ? "Roommate linked" : "No roommate linked"}</p>
              <p>Check console for detailed logs</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
