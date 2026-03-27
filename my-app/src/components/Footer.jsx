import { Link } from "react-router-dom";
import "./Footer.css";
import { useAuth } from "../AuthContext";

function Footer() {
  const { user } = useAuth();

  return (
    <footer className="footer">
      <div className="footer-left">
        <Link to="/">Home</Link>
        <Link to="/careers">Careers</Link>
        <Link to="/research">Research</Link>
        <Link to="/education">Education</Link>
        <Link to="/resume">Resume</Link>
        <Link to="/emails">Emails</Link>
      </div>

      <div className="footer-right">
        {!user ? (
          <Link to="/authorization">LogIn/SignUp</Link>
        ) : (
          <Link to="/profile">Profile</Link>
        )}
      </div>
    </footer>
  );
}

export default Footer;
