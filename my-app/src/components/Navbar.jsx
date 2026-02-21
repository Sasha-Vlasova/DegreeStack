import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <Link to="/">Home</Link>{"  "}
      <Link to="/authorization">LogIn/SignUp</Link>{"  "}
      <Link to="/careers">Careers</Link>{"  "}
      <Link to="/research">Research</Link>{"  "}
      <Link to="/education">Education</Link>{"  "}
      <Link to="/resume">Resume</Link>{"  "}
      <Link to="/emails">Emails</Link>{"  "}
      <Link to="/profile">Profile</Link>{"  "}

    </nav>
  );
}

export default Navbar;
