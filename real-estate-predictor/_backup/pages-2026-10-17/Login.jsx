import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import BrandMark from "../components/BrandMark";
import "./Login.css";

function Login({ onAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/prediction";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      const response = await loginUser({ email, password });
      onAuthenticated(response.user);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;

      if (status === 401) {
        setError("Invalid email or password.");
      } else if (status === 422) {
        setError("Please check your email and password format.");
      } else if (typeof detail === "string") {
        setError(detail);
      } else if (status === 500) {
        setError("The login service encountered an error. Please try again.");
      } else {
        setError("Unable to login. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="login-page">
      <div className="login-background">
        <div className="login-glow login-glow-one"></div>
        <div className="login-glow login-glow-two"></div>
      </div>

      <section className="login-card">
        <div className="login-brand">
          <BrandMark className="login-brand-mark" />

          <div>
            <span>ESTATE</span>
            <strong>IQ</strong>
          </div>
        </div>

        <div className="login-header">
          <span className="login-label">SECURE ACCESS</span>

          <h1>Welcome Back</h1>

          <p>
            Sign in to continue using your AI-powered property valuation
            dashboard.
          </p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <span className="error-icon">!</span>
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-input-group">
            <label htmlFor="login-email">Email Address</label>

            <div className="login-input-wrapper">
              <span className="input-icon">@</span>

              <input
                id="login-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="login-input-group">
            <div className="password-label-row">
              <label htmlFor="login-password">Password</label>

              <button
                type="button"
                className="forgot-button"
                onClick={() => {
                  alert("Password reset will be available soon.");
                }}
              >
                Forgot password?
              </button>
            </div>

            <div className="login-input-wrapper">
              <span className="input-icon">●</span>

              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                disabled={loading}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <label className="remember-row">
            <input type="checkbox" />

            <span>Remember me</span>
          </label>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="login-spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <span>→</span>
              </>
            )}
          </button>
        </form>

        <div className="login-divider">
          <span>New to EstateIQ?</span>
        </div>

        <Link
          to="/signup"
          state={{ from: redirectTo }}
          className="login-signup-link"
        >
          Create your account
          <span>→</span>
        </Link>

        <p className="login-security">
          <span>🔒</span>
          Your account information is securely protected.
        </p>
      </section>
    </main>
  );
}

export default Login;
