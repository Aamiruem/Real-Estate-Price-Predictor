import { useEffect, useState } from "react";
import { getMarketInsight } from "../services/api";
import apartmentImage from "../assets/property-14.jpg";
import builderFloorImage from "../assets/property-15.jpg";
import plotImage from "../assets/property-13.jpg";
import villaImage from "../assets/property-05.jpg";
import delhiImage from "../assets/residential-delhi.jpg";
import gurgaonImage from "../assets/residential-gurgaon.jpg";
import noidaImage from "../assets/property-06.jpg";
import greaterNoidaImage from "../assets/property-04.jpg";
import faridabadImage from "../assets/property-11.jpg";
import "./SmartPreview.css";

const TYPE_IMAGES = {
  Apartment: apartmentImage,
  "Builder Floor": builderFloorImage,
  Plot: plotImage,
  Villa: villaImage,
};

const CITY_IMAGES = {
  Delhi: delhiImage,
  Gurgaon: gurgaonImage,
  Noida: noidaImage,
  "Greater Noida": greaterNoidaImage,
  Faridabad: faridabadImage,
};

const SPARKLE = "M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9z";

function formatCrore(value) {
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
  return `₹${(value / 1e5).toFixed(1)} L`;
}

/**
 * Top-right preview for the valuation form: a photo for the current
 * selection, live dataset figures, and AI auto-fill of typical values.
 */
function SmartPreview({ location, locality, propertyType, bedrooms, onAutofill }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filledMessage, setFilledMessage] = useState("");
  const hasSelection = Boolean(location || propertyType);

  useEffect(() => {
    setFilledMessage("");
    if (!hasSelection) {
      setInsight(null);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    // Debounce so quick changes trigger a single request.
    const timer = setTimeout(() => {
      getMarketInsight(
        {
          location: location || undefined,
          locality: locality || undefined,
          property_type: propertyType || undefined,
          bedrooms: bedrooms || undefined,
        },
        controller.signal,
      )
        .then((result) => setInsight(result))
        .catch((error) => {
          if (error.name !== "CanceledError") setInsight(null);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [hasSelection, location, locality, propertyType, bedrooms]);

  const image = TYPE_IMAGES[propertyType] || CITY_IMAGES[location] || gurgaonImage;
  const label =
    [locality || location, propertyType].filter(Boolean).join(" · ") || "Delhi-NCR";

  if (!hasSelection) {
    return (
      <div className="sp-card sp-empty">
        <span className="sp-empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d={SPARKLE} />
          </svg>
        </span>
        <div>
          <strong>Smart preview</strong>
          <span>Choose a city or property type to see live market insight.</span>
        </div>
      </div>
    );
  }

  const handleAutofill = () => {
    if (!insight) return;
    const filled = onAutofill(insight.typical);
    setFilledMessage(
      filled > 0
        ? `Filled ${filled} field${filled === 1 ? "" : "s"} with typical values`
        : "All fields already filled",
    );
  };

  return (
    <div className="sp-card" aria-live="polite">
      <div className="sp-media">
        <img key={image} src={image} alt="" decoding="async" />
        <span className="sp-tag">{label}</span>
      </div>

      <div className="sp-body">
        <div className="sp-stats">
          {loading && !insight ? (
            <span className="sp-loading">Reading the market…</span>
          ) : insight ? (
            <>
              <div>
                <span>Median / sq ft</span>
                <strong>₹{Math.round(insight.median_price_per_sqft).toLocaleString("en-IN")}</strong>
              </div>
              <div>
                <span>Median price</span>
                <strong>{formatCrore(insight.median_price)}</strong>
              </div>
              <div>
                <span>Typical range</span>
                <strong>
                  {formatCrore(insight.p25_price)}–{formatCrore(insight.p75_price)}
                </strong>
              </div>
            </>
          ) : (
            <span className="sp-loading">Market data unavailable.</span>
          )}
        </div>

        <div className="sp-footer">
          <span className="sp-note">
            {filledMessage ||
              (insight ? `${insight.count} historical records` : " ")}
          </span>
          <button
            type="button"
            className="sp-autofill"
            onClick={handleAutofill}
            disabled={!insight || loading}
            title="Fill empty fields with typical values for this selection"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d={SPARKLE} />
            </svg>
            AI auto-fill
          </button>
        </div>
      </div>
    </div>
  );
}

export default SmartPreview;
