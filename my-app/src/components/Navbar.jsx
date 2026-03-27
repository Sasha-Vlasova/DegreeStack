import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../AuthContext";
import { supabase } from "../supabase";

function Navbar() {
  const { user, setUser, clearLogoutTimer } = useAuth();
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
        {!user ? (
          <>
            <Link to="/authorization">LogIn/SignUp</Link>
          </>
        ) : (
          <>
            <Link to="/profile">Profile</Link>
            <button className="logout-btn" onClick={handleLogout}>
              Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
