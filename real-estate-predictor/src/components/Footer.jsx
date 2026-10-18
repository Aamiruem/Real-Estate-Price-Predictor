import { Link } from "react-router-dom";
import BrandMark from "./BrandMark";
import "./Footer.css";

const ICON_PATHS = {
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  phone:
    "M6.6 3.5h3l1.5 4-2 1.3a11 11 0 0 0 6.1 6.1l1.3-2 4 1.5v3a2 2 0 0 1-2.1 2A17 17 0 0 1 4.6 5.6a2 2 0 0 1 2-2.1z",
  pin: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  arrowUp: "M12 19V5M6 11l6-6 6 6",
  chevron: "M9 6l6 6-6 6",
  shield: "M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6z",
};

function FooterIcon({ name, className = "site-footer-icon" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

const PLATFORM_LINKS = [
  { to: "/prediction", label: "Price Prediction" },
  { to: "/assistant", label: "AI Property Assistant" },
  { to: "/requirements", label: "Customer Requirements" },
  { to: "/#how-it-works", label: "How It Works" },
];

// Cities represented in the trained valuation model.
const CITIES = ["Delhi", "Gurgaon", "Noida", "Greater Noida", "Faridabad"];

function Footer({ user }) {
  const year = new Date().getFullYear();

  const companyLinks = [
    { to: "/about", label: "About EstateIQ" },
    { to: "/contact", label: "Contact Us" },
    ...(user
      ? []
      : [
          { to: "/login", label: "Sign In" },
          { to: "/signup", label: "Create Account" },
        ]),
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-main">
          <div className="site-footer-brand">
            <Link to="/" className="site-footer-logo" aria-label="EstateIQ home">
              <BrandMark className="site-footer-logo-mark" />
              <span>
                Estate<span>IQ</span>
              </span>
            </Link>

            <p>
              Machine-learning property valuation for Delhi-NCR. Instant price
              estimates built on 25 property, amenity and connectivity
              factors.
            </p>

            <ul className="site-footer-contact">
              <li>
                <FooterIcon name="mail" />
                <a href="mailto:hello@estateai.com">hello@estateai.com</a>
              </li>
              <li>
                <FooterIcon name="phone" />
                <a href="tel:+919999999999">+91 99999 99999</a>
              </li>
              <li>
                <FooterIcon name="pin" />
                <span>Gurgaon · Delhi-NCR, India</span>
              </li>
            </ul>
          </div>

          <nav className="site-footer-column" aria-label="Platform">
            <h2>Platform</h2>
            <ul>
              {PLATFORM_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>
                    <FooterIcon name="chevron" className="site-footer-chevron" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="site-footer-column" aria-label="Company">
            <h2>Company</h2>
            <ul>
              {companyLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>
                    <FooterIcon name="chevron" className="site-footer-chevron" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-footer-column">
            <h2>Markets Covered</h2>
            <ul className="site-footer-cities">
              {CITIES.map((city) => (
                <li key={city}>{city}</li>
              ))}
            </ul>
            <Link to="/prediction" className="site-footer-cta">
              Get a free valuation
              <FooterIcon name="chevron" className="site-footer-chevron" />
            </Link>
          </div>
        </div>

        <p className="site-footer-disclaimer">
          <FooterIcon name="shield" />
          Valuations are indicative estimates generated from historical market
          data and should not be treated as a certified appraisal or financial
          advice.
        </p>

        <div className="site-footer-bottom">
          <span>© {year} EstateIQ. All rights reserved.</span>
          <button
            type="button"
            className="site-footer-top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Back to top
            <FooterIcon name="arrowUp" />
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
