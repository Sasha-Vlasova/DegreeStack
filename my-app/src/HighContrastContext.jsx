import { createContext, useContext, useEffect, useState } from "react";
// createContext: creates a new context object for managing high contrast mode state across the app
// useContext: allows components to consume the context value
// useEffect: runs side effects (like applying CSS classes) when the high contrast state changes
// useState: manages the isHighContrast state and toggle function

import { useAuth } from "./AuthContext";

const HighContrastContext = createContext();
// Custom hook to consume the HighContrastContext like a box where we store isHighContrast and toggleHighContrast function

export function HighContrastProvider({ children }) {
// children is the content wrapped by this provider, allowing it to access the context value
    const { user } = useAuth(); // access logged-in user
    const [isHighContrast, setIsHighContrast] = useState(false); 
    // isHighContrast - current mode (T/F)
    // setIsHighContrast - function to update it
    // useState is initialized with a function that reads the saved preference from localStorage, ensuring the user's choice persists across sessions
    
    // Load preference when user changes (login/logout)
    useEffect(() => {
        if (user) {
        // Logged-in user → load their saved preference
        const saved = localStorage.getItem(`highContrast_${user.id}`);
        setIsHighContrast(saved === "true");
        } else {
        // Viewer mode → always default to OFF
        setIsHighContrast(false);
        }
    }, [user]);
    

    const toggleHighContrast = () => {
        setIsHighContrast(prev => {
        const newValue = !prev;

        if (user) {
            // Save only for logged-in users
            localStorage.setItem(`highContrast_${user.id}`, newValue);
        }

        return newValue;
        });
    };

  // Apply/remove class on <body>
  useEffect(() => {
    const root = document.getElementById("root");

    if (isHighContrast) {
        document.body.classList.add("high-contrast");
        root.classList.add("high-contrast");
    } else {
        document.body.classList.remove("high-contrast");
        root.classList.remove("high-contrast");
    }
    }, [isHighContrast]);


  return (
    <HighContrastContext.Provider value={{ isHighContrast, toggleHighContrast }}>
      {children}
    </HighContrastContext.Provider>
  );
}

export function useHighContrast() {
  return useContext(HighContrastContext);
}
