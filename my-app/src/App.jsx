// React Router imports
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Auth context (provides user + authLoading)
import { AuthProvider, useAuth } from "./AuthContext";

// Page and component imports
import Navbar from "./components/Navbar";
import Home from "./Home";
import Authorization from "./pages/Authorization";
import SignUp from "./pages/SignUp";
import Careers from "./pages/Careers";
import Research from "./pages/Research";
import Education from "./pages/Education";
import Resume from "./pages/Resume";
import Emails from "./pages/Emails";
import Profile from "./pages/Profile";
import Footer from "./components/Footer";

// ProtectedRoute wrapper (must exist at src/ProtectedRoute.jsx)
import ProtectedRoute from "./ProtectedRoute";

//Working at creating High Contrast mode
import { HighContrastProvider } from "./HighContrastContext";


import "./App.css";


// This component renders the actual app content.
// It uses useAuth(), so it MUST be inside <AuthProvider>.
function AppContent() {
  const { authLoading } = useAuth();

  // While Supabase checks the session, show a loading screen.
  // This prevents UI flashing and incorrect redirects.
  if (authLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <>
      {/* Navbar is always visible */}
      <Navbar />

      <div className="app-content">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/authorization" element={<Authorization />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/research" element={<Research />} />
          <Route path="/education" element={<Education />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/emails" element={<Emails />} />

          {/* Protected route: only logged-in users can access /profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      {/* Footer is always visible */}
      <Footer />
    </>
  );
}


// Root component: wraps everything in AuthProvider and Router.
// This ensures AppContent can safely use useAuth().
function App() {
  return (
    /*<div className="app-container">*/
      <AuthProvider>
        <HighContrastProvider>
          <div className="app-container">
            <Router>
              <AppContent />
            </Router>
          </div>
        </HighContrastProvider>
      </AuthProvider>
    //</div>
  );
}

export default App;
