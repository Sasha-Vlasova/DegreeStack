import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../AuthContext";
import { supabase } from "../supabase";
import { useHighContrast } from "../HighContrastContext";

function Navbar() {
  const { user, setUser, clearLogoutTimer } = useAuth();
  const { isHighContrast, toggleHighContrast } = useHighContrast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearLogoutTimer();
    setUser(null);
    navigate("/authorization");
  };

  return (
    <nav className="nav">
      <div className="nav-left">
        <Link to="/">Home</Link>
        <Link to="/careers">Careers</Link>
        <Link to="/research">Research</Link>
        <Link to="/education">Education</Link>
        <Link to="/resume">Resume</Link>
        <Link to="/emails">Emails</Link>
      </div>

      <div className="nav-right">

        {/* High Contrast toggle — always visible */}
        <button className="nav-btn" onClick={toggleHighContrast}>
          {isHighContrast ? "Normal Mode" : "High Contrast"}
        </button>

        {!user ? (
          <>
            <Link to="/authorization" className="nav-btn">LogIn/SignUp</Link>
          </>
        ) : (
          <>
            <Link to="/profile" className="nav-btn">Profile</Link>
            <button className="nav-btn" onClick={handleLogout}>
              Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
