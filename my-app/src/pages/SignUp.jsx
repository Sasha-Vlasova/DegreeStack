import { Link, useNavigate } from "react-router-dom";
import "./Authorization.css";
import React, { useState } from "react";
import { supabase } from "../supabase";

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const validate = () => {
    let tempErrors = {};
    if (!email.trim()) tempErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) tempErrors.email = "Email is invalid";
    if (!password) tempErrors.password = "Password is required";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      // Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        alert("Signup failed: " + authError.message);
        return;
      }

      // Insert user into profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .insert([{ id: authData.user.id, email }]);

      if (profileError) {
        console.error(profileError);
        alert("Signup succeeded, but failed to add user to table.");
      } else {
        alert("Signup successful! Please log in.");
        navigate("/authorization");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Sign up</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label htmlFor="email" style={styles.label}>Email</label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...styles.input, borderColor: errors.email ? "#d32f2f" : "#ccc" }}
          />
          {errors.email && <div style={styles.error}>{errors.email}</div>}

          <label htmlFor="password" style={styles.label}>Password</label>
          <input
            id="password"
            type="password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...styles.input, borderColor: errors.password ? "#d32f2f" : "#ccc" }}
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

          <button type="submit" style={styles.button}>Sign up</button>
        </form>

        <div style={styles.footerText}>
          Already have an account? <Link to="/authorization" style={styles.signUpLink}>Log in</Link>
        </div>
      </div>
    </div>
  );
}

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

export default Signup;