import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [logoutTimerId, setLogoutTimerId] = useState(null);

  // Auto-logout after 30 minutes of inactivity
  const startLogoutTimer = () => {
    if (logoutTimerId) clearTimeout(logoutTimerId);

    const id = setTimeout(async () => {
      await supabase.auth.signOut();
      setUser(null);
      alert("Session expired. Please log in again.");
    }, 1000 * 60 * 30);

    setLogoutTimerId(id);
  };

  const clearLogoutTimer = () => {
    if (logoutTimerId) clearTimeout(logoutTimerId);
  };

  // Initialize authentication state when the app loads
  useEffect(() => {
    const init = async () => {
      // Read the user's Remember Me preference
      const remember = localStorage.getItem("remember_me") === "true";

      // If Remember Me is off, remove all Supabase auth keys from localStorage
      // This ensures the user is logged out on refresh or tab close
      if (!remember) {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("sb-") && key.includes("auth")) {
            localStorage.removeItem(key);
          }
        });
      }

      // Only restore the session if Remember Me is enabled
      let session = null;
      if (remember) {
        const { data } = await supabase.auth.getSession();
        session = data.session;
      }

      console.log("SESSION AFTER REDIRECT:", session);

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) startLogoutTimer();

      setAuthLoading(false);
    };

    init();

    // Listen for Supabase auth events (login, logout, token refresh)
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;

        if (event === "SIGNED_IN") {
          const userId = currentUser?.id;

          // Ensure user_profiles row exists for this user
          supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", userId)
            .single()
            .then(({ data, error }) => {
              // Error code PGRST116 means "no rows found"
              if (error && error.code === "PGRST116") {
                supabase.from("user_profiles").insert({ user_id: userId });
              }
            });

          setUser(currentUser);
          startLogoutTimer();
        }

        if (event === "SIGNED_OUT") {
          setUser(null);
          clearLogoutTimer();
        }
      }
    );

    return () => {
      subscription?.subscription?.unsubscribe();
      clearLogoutTimer();
    };
  }, []);

  const value = {
    user,
    setUser,
    authLoading,
    startLogoutTimer,
    clearLogoutTimer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
