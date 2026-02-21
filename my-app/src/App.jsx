import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";


import Navbar from "./components/Navbar";
import Home from "./Home";
import Authorization from "./pages/Authorization"; 
import SignUp from "./pages/SignUp";
import LogIn from "./pages/LogIn";
import Careers from "./pages/Careers";
import Research from "./pages/Research";
import Education from "./pages/Education";
import Resume from "./pages/Resume";
import Emails from "./pages/Emails";
import Profile from "./pages/Profile";

function App() {
  return (
    <Router>
      <Navbar />   
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/authorization" element={<Authorization />} />
        <Route path="/authorization/login" element={<LogIn />} />
        <Route path="/authorization/signup" element={<SignUp />} />
        <Route path="/Careers" element={<Careers />} />
        <Route path="/Research" element={<Research />} />
        <Route path="/Education" element={<Education />} />
        <Route path="/Resume" element={<Resume />} />
        <Route path="/Emails" element={<Emails />} />
        <Route path="/Profile" element={<Profile />} />

      </Routes>
    </Router>
  );
}

export default App;
