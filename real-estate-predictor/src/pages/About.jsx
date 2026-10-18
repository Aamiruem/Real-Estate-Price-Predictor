import { Link } from "react-router-dom";
import HeroMedia from "../components/HeroMedia";
import { BannerIcon } from "../components/PageBanner";
import heroImage from "../assets/residential-delhi.jpg";
import apartmentImage from "../assets/property-14.jpg";
import builderFloorImage from "../assets/property-15.jpg";
import plotImage from "../assets/property-13.jpg";
import villaImage from "../assets/property-05.jpg";
import "./About.css";

const ICONS = {
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8v.01",
  factors: "M4 19V9M10 19V5M16 19v-7M22 19H2",
  pin: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  home: "M4 11.5 12 5l8 6.5M6.5 10v9h11v-9M10 19v-5h4v5",
  building: "M5 20V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15M15 10h3a1 1 0 0 1 1 1v9M3 20h18M8.5 8h3M8.5 11.5h3M8.5 15h3",
  floors: "M6 20V9l6-5 6 5v11M6 14h12M10 20v-3h4v3",
  plot: "M3 17 9 5l6 8 3-4 3 8zM3 20h18",
  villa: "M3 11 12 4l9 7M5 10v10h14V10M9 20v-5h6v5M15 7.5V5h2v4",
  layers: "M12 4 3 9l9 5 9-5-9-5zM3 14l9 5 9-5",
  sparkle: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6",
  route: "M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 17h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7",
  edit: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  cpu: "M8 8h8v8H8zM10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3",
  chart: "M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6",
  arrow: "M5 12h14M13 6l6 6-6 6",
};

// Values below mirror what the trained model accepts (see /prediction-options).
const PROPERTY_TYPES = [
  { icon: "building", image: apartmentImage, title: "Apartment", text: "Units in multi-storey residential projects." },
  { icon: "floors", image: builderFloorImage, title: "Builder Floor", text: "Independent floors in low-rise buildings." },
  { icon: "plot", image: plotImage, title: "Plot", text: "Residential land valued by size and location." },
  { icon: "villa", image: villaImage, title: "Villa", text: "Standalone homes, often in gated communities." },
];

const HERO_STATS = [
  { icon: "factors", value: "25", label: "valuation factors" },
  { icon: "pin", value: "5", label: "NCR cities" },
  { icon: "home", value: "4", label: "property types" },
];

const CITIES = ["Delhi", "Gurgaon", "Noida", "Greater Noida", "Faridabad"];

const INPUT_GROUPS = [
  {
    icon: "home",
    title: "Property basics",
    inputs: ["City", "Locality", "Property type", "Status", "Built-up area", "Bedrooms", "Bathrooms", "Property age"],
  },
  {
    icon: "layers",
    title: "Building",
    inputs: ["Floor", "Total floors", "Parking", "Balconies", "Lift"],
  },
  {
    icon: "sparkle",
    title: "Features & amenities",
    inputs: ["Furnishing", "Facing", "Water supply", "Amenities", "Amenity count", "Gated community", "Security", "Power backup"],
  },
  {
    icon: "route",
    title: "Connectivity",
    inputs: ["Metro distance", "School distance", "Hospital distance", "Main road distance"],
  },
];

const STEPS = [
  {
    icon: "edit",
    title: "Describe the property",
    text: "Enter location, size, configuration, features and nearby distances in the valuation form.",
  },
  {
    icon: "cpu",
    title: "The model analyses it",
    text: "A Random Forest model trained on historical Delhi-NCR records compares it with learned price patterns.",
  },
  {
    icon: "chart",
    title: "Get your estimate",
    text: "See the estimated value, price per sq. ft. and the factors that influence the model most.",
  },
];

function SectionHeading({ label, title, children }) {
  return (
    <div className="ab-heading">
      <span className="ab-label">{label}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

function About() {
  return (
    <div className="ab-page">
      <section className="ab-hero">
        <HeroMedia image={heroImage} position="center 45%" />
        <div className="ab-hero-shade" aria-hidden="true" />

        <div className="ab-hero-content">
          <span className="pb-badge">
            <span className="pb-badge-icon" aria-hidden="true">
              <BannerIcon path={ICONS.info} />
            </span>
            About EstateIQ
            <span className="pb-badge-divider" aria-hidden="true" />
            <span className="pb-badge-meta">Delhi-NCR</span>
          </span>
          <h1>
            Property valuation, <span className="pb-accent">made clear.</span>
          </h1>
          <p>
            EstateIQ estimates residential property prices in{" "}
            <strong>Delhi-NCR</strong> using a <strong>machine-learning model</strong>{" "}
            trained on historical property records.
          </p>
          <div className="pb-actions">
            <Link to="/prediction" className="pb-button pb-button-primary">
              Get a valuation
              <BannerIcon path={ICONS.arrow} />
            </Link>
            <a href="#how-it-works" className="pb-button pb-button-ghost">
              How it works
            </a>
          </div>
        </div>

        <ul className="ab-hero-stats">
          {HERO_STATS.map((stat) => (
            <li key={stat.label}>
              <span className="pb-item-icon" aria-hidden="true">
                <BannerIcon path={ICONS[stat.icon]} />
              </span>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="ab-section">
        <SectionHeading label="Coverage" title="What the model covers">
          Estimates are available for these property types and cities only.
        </SectionHeading>

        <div className="ab-types">
          {PROPERTY_TYPES.map((type) => (
            <article className="ab-card ab-type" key={type.title}>
              <div className="ab-type-media">
                <img src={type.image} alt="" loading="lazy" decoding="async" />
                <span className="ab-icon ab-type-icon">
                  <BannerIcon path={ICONS[type.icon]} />
                </span>
              </div>
              <div className="ab-type-body">
                <h3>{type.title}</h3>
                <p>{type.text}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="ab-cities">
          <span className="ab-cities-label">
            <BannerIcon path={ICONS.pin} />
            Cities
          </span>
          {CITIES.map((city) => (
            <span className="ab-chip" key={city}>
              {city}
            </span>
          ))}
        </div>
      </section>

      <section className="ab-section">
        <SectionHeading label="Model inputs" title="The 25 factors behind every estimate">
          These are the exact details the valuation form collects and the model
          uses.
        </SectionHeading>

        <div className="ab-inputs">
          {INPUT_GROUPS.map((group) => (
            <article className="ab-card ab-input-group" key={group.title}>
              <header>
                <span className="ab-icon ab-icon-sm">
                  <BannerIcon path={ICONS[group.icon]} />
                </span>
                <h3>{group.title}</h3>
                <span className="ab-count">{group.inputs.length}</span>
              </header>
              <ul>
                {group.inputs.map((input) => (
                  <li key={input}>{input}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="ab-section" id="how-it-works">
        <SectionHeading label="Process" title="How a valuation works" />

        <ol className="ab-steps">
          {STEPS.map((step, index) => (
            <li className="ab-card ab-step" key={step.title}>
              <div className="ab-step-top">
                <span className="ab-icon">
                  <BannerIcon path={ICONS[step.icon]} />
                </span>
                <span className="ab-step-number">0{index + 1}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="ab-closing">
        <div className="ab-note">
          <BannerIcon path={ICONS.info} />
          <p>
            <strong>Estimates, not appraisals.</strong> Results reflect
            historical data and the details you provide. Verify with a local
            property professional before any transaction.
          </p>
        </div>

        <Link to="/prediction" className="ab-cta">
          Start a valuation
          <BannerIcon path={ICONS.arrow} />
        </Link>
      </section>
    </div>
  );
}

export default About;
