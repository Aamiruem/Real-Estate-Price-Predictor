import { useEffect, useRef, useState } from "react";
import "./Prediction.css";

import PropertyForm from "../components/PropertyForm";
import PredictionCard from "../components/PredictionCard";
import FeatureImportance from "../components/FeatureImportance";

const HIGHLIGHTS = [
  {
    value: "25",
    label: "Valuation factors",
    icon: "M4 19V9M10 19V5M16 19v-7M22 19H2",
  },
  {
    value: "5",
    label: "NCR cities",
    icon: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  },
  {
    value: "25",
    label: "Localities",
    icon: "M4 11.5 12 5l8 6.5M6.5 10v9h11v-9M10 19v-5h4v5",
  },
];

// Decorative skyline drawn behind the banner stats.
const SKYLINE =
  "M0 120V96h26V70h18v26h14V52l16-12 16 12v68h12V84h22V60h10V40h14v20h10v60h14V74l22-14 22 14v46h16V30h12V14h8v16h12v90h14V88h20v32h18V64h24v56h16V44l20-10 20 10v76h14V80h26v40";

function Prediction() {
  const [prediction, setPrediction] = useState(null);
  const [propertyData, setPropertyData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const resultRef = useRef(null);

  // On narrow screens the result sits above the form; bring it into view.
  useEffect(() => {
    const element = resultRef.current;
    if (!prediction || !element) return;
    const { top, bottom } = element.getBoundingClientRect();
    if (top < 80 || bottom > window.innerHeight) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [prediction]);

  return (
    // App already renders the page <main>, so this is a plain container.
    <div className="pv-page">
      <header className="pv-hero">
        <div className="pv-hero-copy">
          <span className="pv-eyebrow">
            <span className="pv-eyebrow-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9z" />
              </svg>
            </span>
            AI property valuation
            <span className="pv-eyebrow-divider" aria-hidden="true" />
            <span className="pv-eyebrow-meta">Delhi-NCR</span>
          </span>
          <h1>
            Property Price <span className="pv-hero-accent">Prediction</span>
          </h1>
          <p>
            Describe the property and our <strong>trained model</strong>{" "}
            estimates its <strong>market value</strong> from historical
            Delhi-NCR sales.
          </p>
        </div>

        <ul className="pv-hero-stats" aria-label="Model highlights">
          {HIGHLIGHTS.map((item) => (
            <li key={item.label}>
              <span className="pv-stat-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
              </span>
              <strong>{item.value}</strong>
              <span className="pv-stat-label">{item.label}</span>
            </li>
          ))}
        </ul>

        <svg
          className="pv-hero-skyline"
          viewBox="0 0 520 120"
          preserveAspectRatio="xMaxYMax meet"
          aria-hidden="true"
          focusable="false"
        >
          <path d={SKYLINE} />
        </svg>
      </header>

      <div className="pv-layout">
        <PropertyForm
          onSubmittingChange={setSubmitting}
          onPrediction={(result, submittedData) => {
            setPrediction(result);
            setPropertyData(submittedData);
          }}
        />

        <aside className="pv-result-column" aria-live="polite" ref={resultRef}>
          <PredictionCard
            prediction={prediction}
            propertyData={propertyData}
            loading={submitting}
          />
        </aside>
      </div>

      <FeatureImportance />
    </div>
  );
}

export default Prediction;
