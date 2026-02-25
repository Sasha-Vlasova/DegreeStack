import React, { useState } from "react";
import { Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const validate = () => {
    let tempErrors = {};

    if (!email.trim()) {
      tempErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = "Email is invalid";
    }

    if (!password) {
      tempErrors.password = "Password is required";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    alert(
      `Logged in!\nEmail: ${email}\nRemember me: ${remember ? "Yes" : "No"}`
    );

    setEmail("");
    setPassword("");
    setRemember(false);
    setErrors({});
  };

  return (
    <div style={styles.card}>
      <h1 style={styles.heading}>Sign in</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label htmlFor="email" style={styles.label}>
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            ...styles.input,
            borderColor: errors.email ? "#d32f2f" : "#ccc",
          }}
        />
        {errors.email && <div style={styles.error}>{errors.email}</div>}

        <label htmlFor="password" style={styles.label}>
          Password
        </label>
        <input
          id="password"
          type="password"
          placeholder="••••••"
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

        <button type="submit" style={styles.button}>
          Sign in
        </button>
      </form>

      <div style={styles.forgotPasswordContainer}>
        <a href="#!" style={styles.forgotPasswordLink}>
          Forgot your password?
        </a>
      </div>

      <div style={styles.divider}>or</div>

      <button
        style={styles.socialButton}
        onClick={() => alert("Sign in with Google")}
        aria-label="Sign in with Google"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png"
          alt="Google"
          style={styles.socialIcon}
        />
        Sign in with Google
      </button>

      <button
        style={styles.socialButton}
        onClick={() => alert("Sign in with Facebook")}
        aria-label="Sign in with Facebook"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_(2019).png"
          alt="Facebook"
          style={styles.socialIcon}
        />
        Sign in with Facebook
      </button>

      <div style={styles.footerText}>
        Don&apos;t have an account?{" "}
        <Link to="/authorization/signup" style={styles.signUpLink}>
          Sign up
        </Link>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "white",
    padding: "2.5rem 3rem",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    maxWidth: "400px",
    width: "100%",
    margin: "auto",
  },
  heading: {
    marginBottom: "1.5rem",
    fontWeight: 700,
    fontSize: "2rem",
    color: "#111827",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  label: {
    fontWeight: 600,
    fontSize: "0.875rem",
    color: "#374151",
    marginBottom: "0.25rem",
    display: "block",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1.5px solid #ccc",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  button: {
    marginTop: "1rem",
    width: "100%",
    padding: "0.75rem",
    fontSize: "1rem",
    fontWeight: "600",
    color: "white",
    backgroundColor: "#111827",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  error: {
    color: "#d32f2f",
    fontSize: "0.75rem",
    marginTop: "0.25rem",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.875rem",
    color: "#374151",
    cursor: "pointer",
    userSelect: "none",
  },
  checkbox: {
    width: "16px",
    height: "16px",
  },
  forgotPasswordContainer: {
    marginTop: "0.5rem",
    textAlign: "right",
  },
  forgotPasswordLink: {
    fontSize: "0.875rem",
    color: "#2563eb",
    textDecoration: "none",
    cursor: "pointer",
  },
  divider: {
    textAlign: "center",
    margin: "1.5rem 0",
    color: "#6b7280",
    fontWeight: "500",
  },
  socialButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    justifyContent: "center",
    width: "100%",
    padding: "0.75rem",
    marginBottom: "0.75rem",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1.5px solid #d1d5db",
    backgroundColor: "white",
    color: "#374151",
    cursor: "pointer",
  },
  socialIcon: {
    width: "20px",
    height: "20px",
  },
  footerText: {
    fontSize: "0.875rem",
    color: "#6b7280",
    textAlign: "center",
    marginTop: "1rem",
  },
  signUpLink: {
    color: "#2563eb",
    fontWeight: "600",
    textDecoration: "underline",
    cursor: "pointer",
  },
};

export default Login;