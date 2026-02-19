import { Link } from "react-router-dom";

function Authorization() {
  return (
    <div>
      <h2>LogIn/SignUp</h2>
      
      <Link to="/authorization/login">
        <button>Log In</button>
      </Link>

      <Link to="/authorization/signup">
        <button>SignUp</button>
      </Link>
    </div>

  );
}

export default Authorization;
