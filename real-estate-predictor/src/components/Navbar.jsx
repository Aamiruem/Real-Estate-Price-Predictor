import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import BrandMark from "./BrandMark";
import "./Navbar.css";

function DropdownIcon({ name }) {
  const paths = {
    home: (
      <>
        <path d="m3.5 10 8.5-7 8.5 7v10a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V10Z" />
        <path d="M9 21v-7h6v7" />
      </>
    ),
    history: (
      <>
        <path d="M3.5 11a8.5 8.5 0 1 1 2.3 6.1" />
        <path d="M3.5 4.5V11h6.5M12 7v5l3.5 2" />
      </>
    ),
    about: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
    contact: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
        <path d="M14 16l4-4-4-4M18 12H9" />
      </>
    ),
  };

  return (
    <svg
      className="dropdown-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("estateai-theme");

    if (savedTheme === "light") {
      return false;
    }

    return true;
  });

  const profileRef = useRef(null);

  /* =====================================================
     THEME
  ===================================================== */

  useEffect(() => {
    const theme = darkMode ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("estateai-theme", theme);
  }, [darkMode]);

  /* =====================================================
     CLOSE PROFILE WHEN CLICKING OUTSIDE
  ===================================================== */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /* =====================================================
     ESCAPE KEY
  ===================================================== */

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  /* =====================================================
     MENU HANDLERS
  ===================================================== */

  const closeMenus = () => {
    setMobileOpen(false);
    setProfileOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileOpen((previous) => !previous);
    setProfileOpen(false);
  };

  const toggleProfileMenu = () => {
    setProfileOpen((previous) => !previous);
    setMobileOpen(false);
  };

  const toggleTheme = () => {
    setDarkMode((previous) => !previous);
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = async () => {
    const loggedOut = await onLogout();
    setProfileOpen(false);
    setMobileOpen(false);

    if (loggedOut) {
      navigate("/", { replace: true });
    }
  };

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const navLinks = [
    {
      label: "Home",
      path: "/",
      end: true,
    },
    {
      label: "Predict Price",
      path: "/prediction",
      end: true,
    },
    {
      label: "Requirements",
      path: "/requirements",
      end: true,
    },
    {
      label: "AI Assistant",
      path: "/assistant",
      end: true,
    },
    {
      label: "About",
      path: "/about",
      end: true,
    },
    {
      label: "Contact",
      path: "/contact",
      end: true,
    },
  ];

  return (
    <header className="navbar-wrapper">
      <nav className="navbar">
        {/* =================================================
            BRAND
        ================================================= */}

        <Link
          to="/"
          className="navbar-brand"
          onClick={closeMenus}
          aria-label="EstateIQ Home"
        >
          <BrandMark className="brand-mark" />

          <span className="brand-text">
            Estate<span>IQ</span>
          </span>
        </Link>

        {/* =================================================
            DESKTOP NAVIGATION
        ================================================= */}

        <div className="desktop-nav-links">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              onClick={closeMenus}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* =================================================
            RIGHT SECTION
        ================================================= */}

        <div className="navbar-right">
          {/* AI STATUS */}

          <div
            className="ai-badge"
            title="EstateIQ AI-powered property valuation"
          >
            <span className="ai-status-dot"></span>
            <span>AI VALUATION</span>
          </div>

          {/* THEME BUTTON */}

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="theme-icon">{darkMode ? "☀" : "☾"}</span>
          </button>

          {/* LOGIN */}

          {!user && (
            <>
              <Link to="/login" className="login-link" onClick={closeMenus}>
                Login
              </Link>

              <Link to="/signup" className="signup-link" onClick={closeMenus}>
                Sign Up
              </Link>
            </>
          )}

          {/* =================================================
              PROFILE MENU
          ================================================= */}

          {user && (
            <div className="profile-menu-container" ref={profileRef}>
              <button
                type="button"
                className={`profile-button ${
                  profileOpen ? "profile-button-active" : ""
                }`}
                onClick={toggleProfileMenu}
                aria-label="Open account menu"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <span className="profile-avatar">
                  {(user.name || user.email || "U").charAt(0).toUpperCase()}
                </span>

                <span className="profile-chevron">
                  {profileOpen ? "▲" : "▼"}
                </span>
              </button>

              {profileOpen && (
                <div className="profile-dropdown" role="menu">
                  <div className="dropdown-user-info">
                    <div className="dropdown-avatar">
                      {(user.name || user.email || "U").charAt(0).toUpperCase()}
                    </div>

                    <div className="dropdown-user-text">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                  </div>

                  <div className="dropdown-divider"></div>

                  <Link
                    to="/prediction"
                    className="dropdown-item"
                    onClick={closeMenus}
                    role="menuitem"
                  >
                    <DropdownIcon name="home" />
                    <span>Predict Price</span>
                  </Link>

                  <Link
                    to="/prediction"
                    className="dropdown-item"
                    onClick={closeMenus}
                    role="menuitem"
                  >
                    <DropdownIcon name="history" />
                    <span>Prediction History</span>
                  </Link>

                  <Link
                    to="/requirements"
                    className="dropdown-item"
                    onClick={closeMenus}
                    role="menuitem"
                  >
                    <DropdownIcon name="history" />
                    <span>Customer Requirements</span>
                  </Link>

                  <Link
                    to="/about"
                    className="dropdown-item"
                    onClick={closeMenus}
                    role="menuitem"
                  >
                    <DropdownIcon name="about" />
                    <span>About EstateIQ</span>
                  </Link>

                  <Link
                    to="/contact"
                    className="dropdown-item"
                    onClick={closeMenus}
                    role="menuitem"
                  >
                    <DropdownIcon name="contact" />
                    <span>Contact Support</span>
                  </Link>

                  <div className="dropdown-divider"></div>

                  <button
                    type="button"
                    className="dropdown-item logout-item"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <DropdownIcon name="logout" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* =================================================
              MOBILE MENU
          ================================================= */}

          <button
            type="button"
            className={`mobile-menu-button ${
              mobileOpen ? "mobile-menu-button-active" : ""
            }`}
            onClick={toggleMobileMenu}
            aria-label={
              mobileOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* =====================================================
          MOBILE NAVIGATION
      ===================================================== */}

      {mobileOpen && (
        <div id="mobile-navigation" className="mobile-navigation">
          {/* MOBILE LINKS */}

          <div className="mobile-nav-links">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                onClick={closeMenus}
                className={({ isActive }) =>
                  `mobile-nav-link ${isActive ? "active" : ""}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* MOBILE THEME */}

          <button
            type="button"
            className="mobile-theme-toggle"
            onClick={toggleTheme}
          >
            <span>{darkMode ? "☀" : "☾"}</span>

            <span>
              {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            </span>
          </button>

          {/* MOBILE AUTH */}

          <div className="mobile-navigation-actions">
            {user ? (
              <button
                type="button"
                className="mobile-login-link mobile-logout-link"
                onClick={handleLogout}
              >
                Log out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="mobile-login-link"
                  onClick={closeMenus}
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="mobile-signup-link"
                  onClick={closeMenus}
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
