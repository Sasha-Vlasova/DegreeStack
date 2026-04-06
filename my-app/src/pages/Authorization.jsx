import { Link, useNavigate } from "react-router-dom"; // link is needed for navigation without reloading page, useNavigate is programmic navigation = redirection after log in
import React, { useState, useEffect } from "react"; //useState manages (stores) form and user state while useEffect runs logic when component loads
import { supabase } from "../supabase"; //supabase connection -? handles auth and database
import { useAuth } from "../AuthContext";
import "./Authorization.css"; // styling


function Authorization() {
  //console.log("AUTH PAGE MOUNTED");
  const navigate = useNavigate();  // gives a functuon navigate that let changing pages in the web
  const { user, setUser, startLogoutTimer } = useAuth();// "global auth state"
  // fields: 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  // validation:
  const [errors, setErrors] = useState({ email: "", password: "" });
  
  // -------------------------
  // Email/password login
  // -------------------------
  const validate = () => {
    let tempErrors = {};
    if (!email.trim()) tempErrors.email = "Email is required"; // .trim removes spaces, if email empty, then an error
    else if (!/\S+@\S+\.\S+/.test(email)) tempErrors.email = "Email is invalid"; // check if email looks like actual email/ regular, if it does not it produces the error
    if (!password) tempErrors.password = "Password is required";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0; // return an array of errors if they are there, if not, then form is valid. basically if invalide then return
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    localStorage.setItem("remember_me", remember ? "true" : "false");
    
    /* Trying to fix remember me issue for Google Auth
    if (!remember) {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("sb-") && key.includes("auth")) {
          localStorage.removeItem(key);
        }
      });
    }*/
   

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { persistSession: remember },
    });

    if (error) {
      alert("Login failed: " + error.message);
      return;
    }

    // Create user_profiles row immediately after signup
    await supabase
    .from("user_profiles")
    .insert({ user_id: authData.user.id });

    setUser(authData.user);
    startLogoutTimer();
    navigate("/profile");
  };

  const signInWithGoogle = async () => {
    // Save remember_me choice
    localStorage.setItem("remember_me", remember ? "true" : "false");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://crispy-space-umbrella-5gp779gr6j5ph4rqw-5173.app.github.dev/profile",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      alert("Google login failed: " + error.message);
    }
  };

  
      /*
      await ensureProfile(authData.user); // check if user has a prof
      setUser(authData.user);
      alert(`Login successful!\nWelcome, ${authData.user.email}`); 
      //navigate("/profile"); // move the user to profile page
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred");
    }*/

  // -------------------------
  // CSS
  // -------------------------
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Log in</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              ...styles.input,
              borderColor: errors.email ? "#d32f2f" : "#ccc",
            }}
          />
          {errors.email && <div style={styles.error}>{errors.email}</div>}

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              ...styles.input,
              borderColor: errors.password ? "#d32f2f" : "#ccc",
            }}
          />
          {errors.password && <div style={styles.error}>{errors.password}</div>}

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={styles.checkbox}
            />
            Remember me
          </label>
          <button type="button" onClick={signInWithGoogle} style={styles.button}>
            Continue with Google
          </button>



          <button type="submit" style={styles.button}>Log in</button>
        </form>

        

        <div style={styles.footerText}>
          Don&apos;t have an account?{" "}
          <Link to="/signup" style={styles.signUpLink}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

// -------------------------
// STYLES
// -------------------------
const styles = {
  page: { minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#1e3c72", padding: "2rem" },
  card: { backgroundColor: "white", padding: "2.5rem 3rem", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxWidth: "400px", width: "100%" },
  heading: { marginBottom: "1.5rem", fontWeight: 700, fontSize: "2rem", color: "#111827", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  label: { fontWeight: 600, fontSize: "0.875rem", color: "#374151", marginBottom: "0.25rem", display: "block" },
  input: { width: "100%", padding: "0.75rem 1rem", fontSize: "1rem", borderRadius: "6px", border: "1.5px solid #ccc", outline: "none", transition: "border-color 0.2s ease" },
  button: { marginTop: "1rem", width: "100%", padding: "0.75rem", fontSize: "1rem", fontWeight: 600, color: "white", backgroundColor: "#111827", border: "none", borderRadius: "6px", cursor: "pointer" },
  error: { color: "#d32f2f", fontSize: "0.75rem", marginTop: "0.25rem" },
  checkboxLabel: { display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#374151", cursor: "pointer", userSelect: "none" },
  checkbox: { width: "16px", height: "16px" },
  footerText: { fontSize: "0.875rem", color: "#6b7280", textAlign: "center", marginTop: "1rem" },
  signUpLink: { color: "#2563eb", fontWeight: 600, textDecoration: "underline", cursor: "pointer" },
};

export default Authorization;