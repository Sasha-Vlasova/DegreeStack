import { Link } from "react-router-dom";
import "./Authorization.css";

function Authorization() {
  return (
    <div className="home">
    <div className="auth-container">
      <h2>Choose your path:</h2>
      
      <div className="auth-buttons">
      <Link to="/authorization/login">
        <button>Log In</button>
      </Link>

      <Link to="/authorization/signup">
        <button>Submit (SignIn)</button>
      </Link>

      </div>
    </div>
    </div>

  );
}

export default Authorization;
