import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import Home from "./Home";
import About from "../pages/About";
import Authorization from "../pages/Authorization"; 
import SignUp from "../pages/SignUp";
import LogIn from "../pages/LogIn";


function App() {
  return (
    <Router>
      <Navbar />   {/* <-- this will show links on every page */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/authorization" element={<Authorization />}>
          <Route path="login" element={<LogIn />} />
          <Route path="signup" element={<SignUp />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
