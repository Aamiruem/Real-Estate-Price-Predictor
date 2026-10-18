import { useCallback, useEffect, useState } from "react";
import { getFeatureImportance } from "../services/api";
import "./FeatureImportance.css";

// Original column names, longest first so "main_road_distance" wins over
// shorter prefixes when splitting one-hot names like "locality_Golf Course Road".
const COLUMNS = [
  "main_road_distance",
  "hospital_distance",
  "school_distance",
  "metro_distance",
  "gated_community",
  "property_status",
  "amenities_count",
  "property_type",
  "power_backup",
  "water_supply",
  "property_age",
  "total_floors",
  "furnishing",
  "bathrooms",
  "amenities",
  "bedrooms",
  "location",
  "locality",
  "security",
  "parking",
  "balcony",
  "facing",
  "floor",
  "area",
  "lift",
];

const titleCase = (text) =>
  text.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

function formatFeatureName(rawName) {
  const name = rawName.replace(/^(numeric|categorical)__/, "");
  const column = COLUMNS.find(
    (candidate) => name === candidate || name.startsWith(`${candidate}_`),
  );
  if (!column) return titleCase(name);
  const category = name.slice(column.length + 1);
  return category ? `${titleCase(column)}: ${category}` : titleCase(column);
}

function FeatureImportance() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFeatures = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getFeatureImportance();
      const data = Array.isArray(result?.feature_importance)
        ? result.feature_importance
        : [];

      const sorted = data
        .filter(
          (item) =>
            item && typeof item.importance === "number" && item.importance >= 0,
        )
        .sort((a, b) => b.importance - a.importance);

      const max = sorted[0]?.importance || 0;
      const total = sorted.reduce((sum, item) => sum + item.importance, 0);

      setFeatures(
        sorted.slice(0, 8).map((item, index) => ({
          rank: index + 1,
          name: formatFeatureName(item.feature),
          share: total > 0 ? (item.importance / total) * 100 : 0,
          width: max > 0 ? (item.importance / max) * 100 : 0,
        })),
      );
    } catch {
      setError("Model insights could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  return (
    <section className="pv-card pv-insights" aria-labelledby="pv-insights-title">
      <div className="pv-insights-head">
        <div>
          <span className="pv-result-kicker">Model insights</span>
          <h2 id="pv-insights-title">What drives the valuation</h2>
          <p>
            The property attributes with the strongest influence on the
            model&apos;s price estimates.
          </p>
        </div>
      </div>

      {loading && (
        <div className="pv-insights-state" role="status">
          <span className="pv-spinner" aria-hidden="true" />
          Loading model insights…
        </div>
      )}

      {!loading && error && (
        <div className="pv-insights-state pv-insights-error" role="alert">
          <span>{error}</span>
          <button type="button" className="pv-button pv-button-ghost" onClick={loadFeatures}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && features.length === 0 && (
        <div className="pv-insights-state">No feature importance data available.</div>
      )}

      {!loading && !error && features.length > 0 && (
        <>
          <ol className="pv-feature-list">
            {features.map((feature) => (
              <li key={`${feature.name}-${feature.rank}`}>
                <span className="pv-feature-rank">{feature.rank}</span>
                <span className="pv-feature-name">{feature.name}</span>
                <span className="pv-feature-value">{feature.share.toFixed(1)}%</span>
                <span className="pv-feature-bar" aria-hidden="true">
                  <span style={{ width: `${feature.width}%` }} />
                </span>
              </li>
            ))}
          </ol>
          <p className="pv-insights-foot">
            Percentages show each attribute&apos;s share of the model&apos;s total
            feature importance.
          </p>
        </>
      )}
    </section>
  );
}

export default FeatureImportance;
