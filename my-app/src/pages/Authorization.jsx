import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import "./Authorization.css";

function Authorization() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [user, setUser] = useState(null);

  // -------------------------
  // Ensure profile exists
  // -------------------------
  const ensureProfile = async (user) => {
    if (!user) return;

    const { data: existingProfile, error: selectError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      console.error("Error checking profile:", selectError.message);
      return;
    }

    if (!existingProfile) {
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert([{ id: user.id, email: user.email }])
        .select()
        .single();

      if (insertError) console.error("Error creating profile:", insertError.message);
      else console.log("Profile created for user:", newProfile);
    }
  };

  // -------------------------
  // Handle auth state
  // -------------------------
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSessionFromUrl({ storeSession: true });
      const currentUser = session?.user ?? null;

      if (currentUser) {
        setUser(currentUser);
        await ensureProfile(currentUser);
        navigate("/profile");
      } else {
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        if (activeSession?.user) {
          setUser(activeSession.user);
          await ensureProfile(activeSession.user);
          navigate("/profile");
        }
      }
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) await ensureProfile(currentUser);
    });

    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  // -------------------------
  // Google login
  // -------------------------
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/profile" },
    });
    if (error) console.error("Google login error:", error.message);
  };

  // -------------------------
  // Email/password login
  // -------------------------
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
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { persistSession: remember },
      });

      if (authError) {
        alert("Login failed: " + authError.message);
        return;
      }

      await ensureProfile(authData.user);
      setUser(authData.user);
      alert(`Login successful!\nWelcome, ${authData.user.email}`);
      navigate("/profile");
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred");
    }
  };

  // -------------------------
  // JSX
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
            style={{ ...styles.input, borderColor: errors.email ? "#d32f2f" : "#ccc" }}
          />
          {errors.email && <div style={styles.error}>{errors.email}</div>}

          <label style={styles.label}>Password</label>
          <input
            type="password"
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

          <button type="submit" style={styles.button}>Log in</button>
        </form>

        <div style={{ textAlign: "center", margin: "1rem 0", color: "#6b7280" }}>──────── OR ────────</div>

        <button
          onClick={signInWithGoogle}
          style={{
            width: "100%",
            padding: "0.75rem",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#fff",
            backgroundColor: "#4285F4",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
            alt="G"
            style={{ width: "20px", height: "20px" }}
          />
          Continue with Google
        </button>

        {user && (
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            Logged in as: <strong>{user.email}</strong>
            <button
              style={{ marginLeft: "1rem" }}
              onClick={async () => {
                await supabase.auth.signOut();
                setUser(null);
              }}
            >
              Sign Out
            </button>
          </div>
        )}

        <div style={styles.footerText}>
          Don&apos;t have an account? <Link to="/signup" style={styles.signUpLink}>Sign up</Link>
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