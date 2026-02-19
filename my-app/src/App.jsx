import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";


import Navbar from "./components/Navbar";
import Home from "./Home";
import About from "./pages/About";
import Authorization from "./pages/Authorization"; 
import SignUp from "./pages/SignUp";
import LogIn from "./pages/LogIn";


function App() {
  return (
    <Router>
      <Navbar />   
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />

        <Route path="/authorization" element={<Authorization />} />
        <Route path="/authorization/login" element={<LogIn />} />
        <Route path="/authorization/signup" element={<SignUp />} />

      </Routes>
    </Router>
  );
}

export default App;
