import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  // Tracks whether the app is still checking the session
  const [authLoading, setAuthLoading] = useState(true);

  // Stores the logged-in user (or null)
  const [user, setUser] = useState(null);

  // Stores the inactivity logout timer ID
  const [logoutTimerId, setLogoutTimerId] = useState(null);

  // ------------------------------------------------------------
  // AUTO‑LOGOUT TIMER (30 minutes)
  // ------------------------------------------------------------
  const startLogoutTimer = () => {
    // Clear any existing timer so only one runs
    if (logoutTimerId) clearTimeout(logoutTimerId);

    // Start a new 30‑minute timer
    const id = setTimeout(async () => {
      await supabase.auth.signOut(); // invalidate session
      setUser(null);                 // clear user in React state
      alert("Session expired. Please log in again.");
    }, 1000 * 60 * 30);

    setLogoutTimerId(id);
  };

  const clearLogoutTimer = () => {
    if (logoutTimerId) clearTimeout(logoutTimerId);
  };

  // ------------------------------------------------------------
  // INITIAL SESSION RESTORE ON PAGE LOAD
  // ------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      // Read Remember Me preference
      const remember = localStorage.getItem("remember_me") === "true";

      // Always let Supabase attempt to restore the session
      // (This is REQUIRED for Google OAuth to work)
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      // Extract user from session (or null)
      const currentUser = session?.user ?? null;

      // If Remember Me is OFF:
      // still allow login to work normally
      // do NOT persist the user across refresh
      if (!remember) {
        setUser(null); // treat session as temporary
      } else {
        setUser(currentUser); // persist user
      }

      // If user exists AND Remember Me is ON → start inactivity timer
      if (currentUser && remember) {
        startLogoutTimer();
      }

      // Done loading initial auth state
      setAuthLoading(false);
    };

    init();

    // SUPABASE AUTH EVENT LISTENER - Fires on SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
    
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;

        if (event === "SIGNED_IN") {
          const userId = currentUser?.id;

          // Ensure user_profiles row exists
          supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", userId)
            .single()
            .then(({ data, error }) => {
              // PGRST116 = no row found → create one
              if (error && error.code === "PGRST116") {
                supabase.from("user_profiles").insert({ user_id: userId });
              }
            });

          const remember = localStorage.getItem("remember_me") === "true";

          // If Remember Me is ON → persist user + start timer
          if (remember) {
            setUser(currentUser);
            startLogoutTimer();
          } else {
            // If Remember Me is OFF → user exists only for this session
            setUser(currentUser);
          }
        }

        if (event === "SIGNED_OUT") {
          setUser(null);
          clearLogoutTimer();
        }
      }
    );

    // Cleanup listener on unmount
    return () => {
      subscription?.subscription?.unsubscribe();
      clearLogoutTimer();
    };
  }, []);

  // Values exposed to the rest of the app
  const value = {
    user,
    setUser,
    authLoading,
    startLogoutTimer,
    clearLogoutTimer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
