import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";


import Navbar from "./components/Navbar";
import Home from "./Home";
import Authorization from "./pages/Authorization"; 
import SignUp from "./pages/SignUp";
import Careers from "./pages/Careers";
import Research from "./pages/Research";
import Education from "./pages/Education";
import Resume from "./pages/Resume";
import Emails from "./pages/Emails";
import Profile from "./pages/Profile";
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <div className="app-container"> {}
      <Router>
        <Navbar />

        <div className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/authorization" element={<Authorization />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/research" element={<Research />} />
            <Route path="/education" element={<Education />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/emails" element={<Emails />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>

        <Footer />
      </Router>
    </div>
  );
}

export default App;
