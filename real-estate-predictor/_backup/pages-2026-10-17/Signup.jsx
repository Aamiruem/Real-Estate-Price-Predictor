import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signupUser } from "../services/api";
import BrandMark from "../components/BrandMark";
import "./Signup.css";

function Signup({ onAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/prediction";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const validateForm = () => {
    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();

    if (name.length < 2) {
      return "Please enter your full name.";
    }

    if (!email) {
      return "Please enter your email address.";
    }

    if (!/^\d{10,15}$/.test(phone)) {
      return "Please enter a valid phone number.";
    }

    if (formData.password.length < 8) {
      return "Password must contain at least 8 characters.";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const response = await signupUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        confirm_password: formData.confirmPassword,
      });

      onAuthenticated(response.user);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const backendMessage = err?.response?.data?.detail;

      setError(
        typeof backendMessage === "string"
          ? backendMessage
          : "Unable to create your account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const passwordLength = formData.password.length;

  return (
    <main className="signup-page">
      <div className="signup-background">
        <div className="signup-glow signup-glow-one"></div>
        <div className="signup-glow signup-glow-two"></div>
      </div>

      <section className="signup-card">
        {/* Brand */}
        <div className="signup-brand">
          <BrandMark className="signup-brand-mark" />

          <div className="signup-brand-name">
            <span>ESTATE</span>
            <strong>IQ</strong>
          </div>
        </div>

        {/* Header */}
        <div className="signup-header">
          <span className="signup-label">JOIN ESTATEIQ</span>

          <h1>Create Your Account</h1>

          <p>
            Build your personalized property valuation experience with EstateIQ.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="signup-error" role="alert">
            <span className="signup-error-icon">!</span>

            <span>{error}</span>
          </div>
        )}

        <form className="signup-form" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="signup-input-group">
            <label htmlFor="signup-name">Full Name</label>

            <div className="signup-input-wrapper">
              <span className="signup-input-icon">◉</span>

              <input
                id="signup-name"
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="signup-input-group">
            <label htmlFor="signup-email">Email Address</label>

            <div className="signup-input-wrapper">
              <span className="signup-input-icon">@</span>

              <input
                id="signup-email"
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

          {/* Phone */}
          <div className="signup-input-group">
            <label htmlFor="signup-phone">Phone Number</label>

            <div className="signup-input-wrapper">
              <span className="signup-input-icon">+</span>

              <input
                id="signup-phone"
                type="tel"
                name="phone"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
                inputMode="numeric"
                maxLength="15"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="signup-input-group">
            <label htmlFor="signup-password">Password</label>

            <div className="signup-input-wrapper">
              <span className="signup-input-icon">●</span>

              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading}
                required
              />

              <button
                type="button"
                className="signup-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Password strength */}
            {passwordLength > 0 && (
              <div className="password-strength">
                <div className="strength-bars">
                  <span className={passwordLength >= 1 ? "active" : ""}></span>

                  <span className={passwordLength >= 4 ? "active" : ""}></span>

                  <span className={passwordLength >= 8 ? "active" : ""}></span>

                  <span className={passwordLength >= 12 ? "active" : ""}></span>
                </div>

                <small>
                  {passwordLength < 4
                    ? "Weak password"
                    : passwordLength < 8
                      ? "Fair password"
                      : passwordLength < 12
                        ? "Good password"
                        : "Strong password"}
                </small>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="signup-input-group">
            <label htmlFor="signup-confirm-password">Confirm Password</label>

            <div className="signup-input-wrapper">
              <span className="signup-input-icon">●</span>

              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading}
                required
              />

              <button
                type="button"
                className="signup-password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Terms */}
          <label className="signup-terms">
            <input type="checkbox" required />

            <span>I agree to the EstateIQ terms and privacy policy.</span>
          </label>

          {/* Submit */}
          <button type="submit" className="signup-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="signup-spinner"></span>
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <span>→</span>
              </>
            )}
          </button>
        </form>

        {/* Login */}
        <div className="signup-divider">
          <span>Already have an account?</span>
        </div>

        <Link
          to="/login"
          state={{ from: redirectTo }}
          className="signup-login-link"
        >
          Sign in to EstateIQ
          <span>→</span>
        </Link>

        {/* Security */}
        <p className="signup-security">
          <span>🔒</span>
          Your information is encrypted and securely stored.
        </p>
      </section>
    </main>
  );
}

export default Signup;