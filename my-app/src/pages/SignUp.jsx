import React, { useState } from "react";
import { Link } from "react-router-dom";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "", confirmPassword: "" });

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
    if (!confirmPassword) {
      tempErrors.confirmPassword = "Confirm your password";
    } else if (password !== confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    alert(`Signed up!\nEmail: ${email}`);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setErrors({});
  };

  return (
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

        <label htmlFor="confirmPassword" style={styles.label}>Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          placeholder="••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ ...styles.input, borderColor: errors.confirmPassword ? "#d32f2f" : "#ccc" }}
        />
        {errors.confirmPassword && <div style={styles.error}>{errors.confirmPassword}</div>}

        <button type="submit" style={styles.button}>Sign up</button>
      </form>

      <div style={styles.footerText}>
        Already have an account?{" "}
        <Link to="/authorization/login" style={styles.signInLink}>Sign in</Link>
      </div>
    </div>
  );
}

export default SignUp;