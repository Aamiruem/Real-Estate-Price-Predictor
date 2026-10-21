import "./PredictionCard.css";

function formatINR(value) {
  return Math.round(value).toLocaleString("en-IN");
}

// Indian short form, e.g. 22129467 -> "₹2.21 Crore".
function formatIndianWords(value) {
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)} Crore`;
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(2)} Lakh`;
  return `₹${formatINR(value)}`;
}

function formatModelName(modelType) {
  return modelType.replace(/([a-z])([A-Z])/g, "$1 $2");
}

const ICONS = {
  home: "M4 11.5 12 5l8 6.5M6.5 10v9h11v-9M10 19v-5h4v5",
  pin: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  area: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  bed: "M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 15h18M7 9V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M3 18v1.5M21 18v1.5",
  building: "M5 20V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15M15 10h3a1 1 0 0 1 1 1v9M3 20h18M8.5 8h3M8.5 11.5h3M8.5 15h3",
  sofa: "M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v4H3v-4zM6 17v2M18 17v2",
  chip: "M8 8h8v8H8zM10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3",
};

function Icon({ name }) {
  return (
    <svg
      className="pv-ic"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

const EMPTY_STEPS = [
  "Choose the city, locality and property type",
  "Add size, configuration and amenities",
  "Get an instant model-based valuation",
];

function PredictionCard({ prediction, propertyData, loading = false }) {
  if (loading) {
    return (
      <div className="pv-card pv-result pv-result-loading" role="status">
        <span className="pv-result-kicker">Valuation in progress</span>
        <div className="pv-skeleton pv-skeleton-price" />
        <div className="pv-skeleton pv-skeleton-line" />
        <div className="pv-skeleton-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="pv-skeleton" key={index} />
          ))}
        </div>
        <p className="pv-result-muted">Analysing comparable market patterns…</p>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="pv-card pv-result pv-result-empty">
        <div className="pv-result-emblem" aria-hidden="true">
          <Icon name="home" />
        </div>
        <span className="pv-result-kicker">Your valuation</span>
        <h2>Estimate will appear here</h2>
        <p className="pv-result-muted">
          Complete the property details to receive a valuation from the
          trained model.
        </p>
        <ol className="pv-steps">
          {EMPTY_STEPS.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const predictedPrice = Number(prediction.predicted_price);
  const data = propertyData || {};
  const area = Number(data.area);

  if (!Number.isFinite(predictedPrice) || predictedPrice <= 0) {
    return (
      <div className="pv-card pv-result pv-result-error" role="alert">
        <span className="pv-result-kicker">Prediction error</span>
        <h2>The model returned an invalid estimate.</h2>
        <p className="pv-result-muted">Please submit the property details again.</p>
      </div>
    );
  }

  const pricePerSqFt = Number.isFinite(area) && area > 0 ? predictedPrice / area : null;
  const modelName =
    typeof prediction.model_type === "string"
      ? formatModelName(prediction.model_type)
      : "Trained model";

  const facts = [
    { icon: "area", label: "Area", value: area > 0 ? `${formatINR(area)} sq. ft.` : null },
    {
      icon: "bed",
      label: "Layout",
      value: data.bedrooms ? `${data.bedrooms} BHK · ${data.bathrooms} Bath` : null,
    },
    {
      icon: "building",
      label: "Floor",
      value: data.total_floors > 0 ? `${data.floor} of ${data.total_floors}` : null,
    },
    { icon: "sofa", label: "Furnishing", value: data.furnishing },
  ].filter((fact) => fact.value);

  return (
    <div className="pv-card pv-result pv-result-ready">
      <div className="pv-result-top">
        <span className="pv-result-kicker">Estimated market value</span>
        <span className="pv-badge-success">
          <span aria-hidden="true" />
          Ready
        </span>
      </div>

      <div className="pv-price-panel">
        <p className="pv-price">
          <span className="pv-price-currency">₹</span>
          {formatINR(predictedPrice)}
        </p>
        <div className="pv-price-meta">
          <span>≈ {formatIndianWords(predictedPrice)}</span>
          {pricePerSqFt !== null && (
            <strong>₹{formatINR(pricePerSqFt)}/sq. ft.</strong>
          )}
        </div>
      </div>

      {data.location && (
        <div className="pv-place">
          <span className="pv-place-icon">
            <Icon name="pin" />
          </span>
          <div>
            <strong>
              {data.locality ? `${data.locality}, ` : ""}
              {data.location}
            </strong>
            <span>
              {[data.property_type, data.property_status].filter(Boolean).join(" · ")}
            </span>
          </div>
        </div>
      )}

      {facts.length > 0 && (
        <dl className="pv-facts">
          {facts.map((fact) => (
            <div key={fact.label}>
              <span className="pv-fact-icon">
                <Icon name={fact.icon} />
              </span>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="pv-result-note">
        <span className="pv-model-tag">
          <Icon name="chip" />
          {modelName}
        </span>
        Indicative estimate, not a certified appraisal.
      </p>
    </div>
  );
}

export default PredictionCard;
