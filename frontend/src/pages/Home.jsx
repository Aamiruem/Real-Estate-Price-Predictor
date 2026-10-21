import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import gurgaonImage from "../assets/residential-gurgaon.jpg";
import noidaImage from "../assets/residential-noida.jpg";
import delhiImage from "../assets/residential-delhi.jpg";
import propertyImage04 from "../assets/property-04.jpg";
import propertyImage05 from "../assets/property-05.jpg";
import propertyImage06 from "../assets/property-06.jpg";
import propertyImage07 from "../assets/property-07.jpg";
import propertyImage08 from "../assets/property-08.jpg";
import propertyImage09 from "../assets/property-09.jpg";
import propertyImage10 from "../assets/property-10.jpg";
import propertyImage11 from "../assets/property-11.jpg";
import propertyImage12 from "../assets/property-12.jpg";
import propertyImage13 from "../assets/property-13.jpg";
import propertyImage14 from "../assets/property-14.jpg";
import propertyImage15 from "../assets/property-15.jpg";
import "./Home.css";

const propertySlides = [
  {
    type: "Delhi NCR",
    title: "Gurgaon",
    detail: "Residential inspiration",
    image: gurgaonImage,
    alt: "Illustrative residential property in Gurgaon",
  },
  {
    type: "Delhi NCR",
    title: "Noida",
    detail: "Residential inspiration",
    image: noidaImage,
    alt: "Illustrative residential property in Noida",
  },
  {
    type: "Delhi NCR",
    title: "Delhi",
    detail: "Residential inspiration",
    image: delhiImage,
    alt: "Illustrative residential interior in Delhi",
  },
  {
    type: "Apartment",
    title: "Sunlit apartment",
    detail: "Bright, spacious living room",
    image: propertyImage04,
    alt: "Bright modern apartment living room with large windows",
  },
  {
    type: "Builder Floor",
    title: "Open-plan home",
    detail: "Contemporary living and dining",
    image: propertyImage05,
    alt: "Contemporary open-plan home with a staircase and lounge",
  },
  {
    type: "Villa",
    title: "Villa with pool",
    detail: "Modern detached residence",
    image: propertyImage06,
    alt: "Modern villa beside a swimming pool",
  },
  {
    type: "Villa",
    title: "Garden-front home",
    detail: "Modern independent residence",
    image: propertyImage07,
    alt: "Contemporary independent home with a landscaped garden",
  },
  {
    type: "Apartment",
    title: "Contemporary interiors",
    detail: "Open living and dining space",
    image: propertyImage08,
    alt: "Modern open-plan residential interior",
  },
  {
    type: "Villa",
    title: "Architectural villa",
    detail: "Modern design among mature trees",
    image: propertyImage09,
    alt: "Modern villa set among mature trees",
  },
  {
    type: "Villa",
    title: "Family home",
    detail: "Modern home with garden",
    image: propertyImage10,
    alt: "Modern family home surrounded by a garden",
  },
  {
    type: "Apartment",
    title: "Quiet bedroom",
    detail: "Calm, contemporary interior",
    image: propertyImage11,
    alt: "Bright, modern residential bedroom",
  },
  {
    type: "Villa",
    title: "Designed for space",
    detail: "Contemporary home exterior",
    image: propertyImage12,
    alt: "Contemporary architect-designed home",
  },
  {
    type: "Plot",
    title: "Residential land plots",
    detail: "Aerial view of a developing land area",
    image: propertyImage13,
    alt: "Aerial view of open land parcels near a developing residential area",
  },
  {
    type: "Apartment",
    title: "Apartment exterior",
    detail: "Multi-storey residential building",
    image: propertyImage14,
    alt: "Modern apartment building with glass balconies",
  },
  {
    type: "Builder Floor",
    title: "Urban row homes",
    detail: "Connected independent residences",
    image: propertyImage15,
    alt: "Row of brick townhouses on a city street",
  },
];

const propertyDetails = [
  {
    icon: "home",
    title: "Property identity",
    text: "Start with the inputs the model must know before it can estimate value.",
    items: ["Location", "Locality", "Property type", "Area in sq.ft."],
  },
  {
    icon: "types",
    title: "Configuration",
    text: "Describe the practical size and layout of the home or building.",
    items: ["Bedrooms", "Bathrooms", "Floor", "Total floors", "Property age"],
  },
  {
    icon: "features",
    title: "Features and condition",
    text: "Add lifestyle and condition details that influence the estimate.",
    items: ["Parking", "Lift", "Furnishing", "Facing", "Balconies", "Status"],
  },
  {
    icon: "pin",
    title: "Access and amenities",
    text: "Complete the context with amenities and nearby infrastructure.",
    items: ["Amenities", "Gated community", "Security", "Power backup", "Metro distance"],
  },
];

const requiredDetails = [
  "Location",
  "Locality",
  "Property type",
  "Area",
  "Bedrooms",
  "Bathrooms",
];

const recommendedDetails = [
  "Floor and total floors",
  "Property age",
  "Parking and lift",
  "Furnishing and facing",
  "Water supply and security",
  "Metro, school, hospital and main road distance",
];

const steps = [
  {
    number: "01",
    label: "Input",
    title: "Complete the required fields",
    text: "Choose the city, locality and property type, then add area, bedrooms and bathrooms.",
    checklist: ["Location and locality", "Property type", "Area, bedrooms and bathrooms"],
  },
  {
    number: "02",
    label: "Analyze",
    title: "Add optional signals",
    text: "Improve the estimate with floor level, age, parking, lift, furnishing, amenities and access distances.",
    checklist: ["Floor, age and parking", "Furnishing, facing and status", "Metro, school, hospital and road distance"],
  },
  {
    number: "03",
    label: "Review",
    title: "Review the price result",
    text: "Use the predicted value with the submitted details, feature importance and current market checks.",
    checklist: ["Estimated property value", "Submitted input summary", "Feature importance and market verification"],
  },
];

const processRequirements = [
  "Required: location, locality, property type, area, bedrooms and bathrooms.",
  "Helpful: floor, total floors, age, parking, lift, furnishing, amenities and distances.",
  "Result: AI estimate, property context and factors to verify before decisions.",
];

const iconPaths = {
  home: (
    <>
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  features: (
    <>
      <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
      <path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" />
    </>
  ),
  types: (
    <>
      <path d="M3 21V5a2 2 0 0 1 2-2h9v18" />
      <path d="M14 9h5a2 2 0 0 1 2 2v10H3" />
      <path d="M7 7h3M7 11h3M7 15h3M17 13h1M17 17h1" />
    </>
  ),
  arrowRight: <path d="M5 12h14m-6-6 6 6-6 6" />,
  arrowDown: <path d="M12 5v14m-6-6 6 6 6-6" />,
};

function HomeIcon({ name, className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {iconPaths[name]}
    </svg>
  );
}

function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isCarouselPlaying, setIsCarouselPlaying] = useState(true);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const [isCarouselFocused, setIsCarouselFocused] = useState(false);
  const { hash } = useLocation();

  // React Router does not scroll to URL hashes (e.g. /#how-it-works).
  useEffect(() => {
    if (!hash) {
      return;
    }
    document
      .getElementById(decodeURIComponent(hash.slice(1)))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  useEffect(() => {
    if (
      !isCarouselPlaying ||
      isCarouselHovered ||
      isCarouselFocused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % propertySlides.length);
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, [isCarouselFocused, isCarouselHovered, isCarouselPlaying]);

  const showSlide = (index) => {
    setActiveSlide(
      (index + propertySlides.length) % propertySlides.length,
    );
  };

  const currentSlide = propertySlides[activeSlide];

  return (
    <div className="home-page font-sans">
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="home-eyebrow">
            <span aria-hidden="true" />
            PROPERTY PRICE ESTIMATES, WITH CONTEXT
          </span>

          <h1 className="home-hero-heading">
            Property value, made clearer.
            <span>Start with a model-based estimate.</span>
          </h1>

          <p className="home-hero-description">
            Explore a property price estimate based on location, area, rooms and
            features. Use it as an informed starting point before speaking with
            a local property professional.
          </p>

          <div className="home-hero-actions">
            <Link
              to="/prediction"
              className="home-button home-button-primary group inline-flex items-center"
            >
              Predict Price
              <span
                className="home-button-icon inline-flex size-7 items-center justify-center rounded-full"
              >
                <HomeIcon name="arrowRight" />
              </span>
            </Link>
            <a
              href="#how-it-works"
              className="home-button home-button-secondary group inline-flex items-center"
            >
              <span
                className="home-button-icon inline-flex size-7 items-center justify-center rounded-full"
              >
                <HomeIcon name="arrowDown" />
              </span>
              See how it works
            </a>
          </div>

          <p className="home-hero-note">
            Sign in to submit a request. Estimates are not live listings or formal appraisals.
          </p>
        </div>

        <div
          className="home-hero-visual"
          role="region"
          aria-roledescription="carousel"
          aria-label="15 illustrative property images, including apartments, villas, builder floors and plots"
          onMouseEnter={() => setIsCarouselHovered(true)}
          onMouseLeave={() => setIsCarouselHovered(false)}
          onFocus={() => setIsCarouselFocused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsCarouselFocused(false);
            }
          }}
        >
          <div className="home-image-frame aspect-4/3 w-full">
            {propertySlides.map((slide, index) => (
              <img
                key={slide.title}
                src={slide.image}
                alt={slide.alt}
                className={`home-property-image h-full w-full object-contain${index === activeSlide ? " is-active" : ""}`}
                aria-hidden={index !== activeSlide}
                loading={index === activeSlide ? "eager" : "lazy"}
              />
            ))}
          </div>
          <div className="home-carousel-footer">
            <div className="home-image-caption" aria-live="polite">
              <span className="home-caption-mark" aria-hidden="true">
                <HomeIcon name="pin" className="home-caption-icon" />
              </span>
              <span>
                <strong>{currentSlide.title}</strong>
                <small>{currentSlide.detail} · Illustrative property image</small>
              </span>
              <span className="home-image-type">{currentSlide.type}</span>
            </div>
            <div className="home-carousel-controls">
              <button
                className="home-carousel-arrow"
                type="button"
                aria-label="Show previous property image"
                onClick={() => showSlide(activeSlide - 1)}
              >
                <span aria-hidden="true">‹</span>
              </button>
              <div className="home-carousel-dots" aria-label="Choose a property image">
                {propertySlides.map((slide, index) => (
                  <button
                    key={slide.title}
                    className={`home-carousel-dot${index === activeSlide ? " is-active" : ""}`}
                    type="button"
                    aria-label={`Show ${slide.title} image`}
                    aria-pressed={index === activeSlide}
                    onClick={() => showSlide(index)}
                  />
                ))}
              </div>
              <button
                className="home-carousel-arrow"
                type="button"
                aria-label="Show next property image"
                onClick={() => showSlide(activeSlide + 1)}
              >
                <span aria-hidden="true">›</span>
              </button>
              <button
                className="home-carousel-play"
                type="button"
                aria-label={isCarouselPlaying ? "Pause image slideshow" : "Play image slideshow"}
                aria-pressed={isCarouselPlaying}
                onClick={() => setIsCarouselPlaying((playing) => !playing)}
              >
                <span aria-hidden="true">{isCarouselPlaying ? "Ⅱ" : "▶"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section home-details-section">
        <div className="home-section-heading">
          <span className="home-eyebrow">PROPERTY DETAILS</span>
          <h2>Prepare every detail the prediction form needs</h2>
          <p>
            A useful estimate starts with the required basics, then improves
            when you add layout, condition, amenities and nearby access details.
          </p>
        </div>

        <div className="home-detail-grid">
          {propertyDetails.map((detail) => (
            <article className="home-detail-card" key={detail.title}>
              <span className="home-detail-icon" aria-hidden="true">
                <HomeIcon name={detail.icon} className="home-feature-icon" />
              </span>
              <h3>{detail.title}</h3>
              <p>{detail.text}</p>
              <ul className="home-detail-list">
                {detail.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="home-requirements-panel">
          <div className="home-requirements-copy">
            <span className="home-eyebrow">WHAT THE FORM ASKS</span>
            <h3>Required fields first, richer details next</h3>
            <p>
              The model needs the core property facts to run. Additional details
              help the estimate better reflect the actual home, community and
              connectivity.
            </p>
          </div>

          <div className="home-requirements-lists">
            <div>
              <strong>Required</strong>
              <ul>
                {requiredDetails.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <strong>Recommended</strong>
              <ul>
                {recommendedDetails.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <Link className="home-requirements-link" to="/prediction">
            Open prediction form
            <HomeIcon name="arrowRight" className="home-link-icon" />
          </Link>
        </div>
      </section>

      <section id="how-it-works" className="home-section home-process-section">
        <div className="home-section-heading">
          <span className="home-eyebrow">A COMPLETE THREE-STEP FLOW</span>
          <h2>Know exactly what is needed before prediction</h2>
          <p>
            The form first needs the required property facts, then uses the
            extra details you provide to create a more useful estimate.
          </p>
        </div>

        <div className="home-process-ready">
          <div>
            <span className="home-process-ready-label">Before you start</span>
            <strong>Keep these details ready</strong>
          </div>
          <ul>
            {processRequirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="home-step-grid">
          {steps.map((step) => (
            <article className="home-step-card" key={step.number}>
              <div className="home-step-topline">
                <span className="home-step-number">{step.number}</span>
                <span className="home-step-label">{step.label}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <ul className="home-step-checklist">
                {step.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="home-process-action">
          <p>
            Start with the required fields if you are in a hurry. Add the
            recommended details when you want the estimate to reflect the
            property more closely.
          </p>
          <Link className="home-requirements-link" to="/prediction">
            Start prediction
            <HomeIcon name="arrowRight" className="home-link-icon" />
          </Link>
        </div>
      </section>

      <section className="home-section home-location-section">
        <div className="home-location-content">
          <span className="home-eyebrow">LOCATION MATTERS</span>
          <h2>Built around Delhi NCR property inputs</h2>
          <p>
            Add the city and locality for the property. The estimate reflects
            available model data—not a live market feed.
          </p>
        </div>
        <div className="home-location-list" aria-label="Example locations">
          {["Gurgaon", "Noida", "Delhi", "Greater Noida"].map((city) => (
            <span className="home-location-tag" key={city}>
              <HomeIcon name="pin" />
              {city}
            </span>
          ))}
        </div>
      </section>

      <section className="home-estimate-note">
        <div>
          <span className="home-eyebrow">READY TO GET STARTED?</span>
          <h2>Take the next step with a clearer starting point.</h2>
          <p>
            Sign in to enter property details and request a model-based
            estimate. Verify the result with a local property professional.
          </p>
        </div>
        <Link to="/prediction" className="home-button home-button-primary">
          Get started <HomeIcon name="arrowRight" className="home-cta-icon" />
        </Link>
      </section>
    </div>
  );
}

export default Home;
