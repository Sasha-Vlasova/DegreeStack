import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
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
        <Link to="/authorization">LogIn/SignUp</Link>
        <Link to="/profile">Profile</Link>
      </div>
    </nav>
  );
}

export default Navbar;
