import { useEffect, useState } from "react";
import { getPredictionOptions, predictPrice } from "../services/api";
import SmartPreview from "./SmartPreview";
import "./PropertyForm.css";

const STORAGE_KEY = "realEstatePropertyForm";

const initialFormData = {
  location: "",
  locality: "",
  property_type: "",
  area: "",
  bedrooms: "",
  bathrooms: "",
  floor: "",
  total_floors: "",
  property_age: "",
  parking: "",
  lift: "No",
  furnishing: "",
  facing: "",
  balcony: "",
  amenities: "",
  gated_community: "No",
  security: "No",
  power_backup: "No",
  water_supply: "",
  property_status: "",
  metro_distance: "",
  school_distance: "",
  hospital_distance: "",
  main_road_distance: "",
};

// Categorical fields whose valid values come from the trained model.
const MODEL_FIELDS = [
  "location",
  "property_type",
  "lift",
  "furnishing",
  "facing",
  "amenities",
  "gated_community",
  "security",
  "power_backup",
  "water_supply",
  "property_status",
];

// Yes/No facilities, shown as toggle chips (unchecked = "No").
const FACILITIES = [
  ["lift", "Lift"],
  ["gated_community", "Gated community"],
  ["security", "24×7 security"],
  ["power_backup", "Power backup"],
];

const REQUIRED_FIELDS = [
  ...MODEL_FIELDS.filter(
    (name) => !FACILITIES.some(([facility]) => facility === name),
  ),
  "locality",
  "area",
  "bedrooms",
  "bathrooms",
];

// [min, max, label] used for numeric validation.
const NUMBER_RULES = {
  area: [100, 100000, "Area"],
  bedrooms: [1, 10, "Bedrooms"],
  bathrooms: [1, 10, "Bathrooms"],
  floor: [0, 100, "Floor"],
  total_floors: [0, 100, "Total floors"],
  property_age: [0, 100, "Property age"],
  metro_distance: [0, 50, "Metro distance"],
  school_distance: [0, 50, "School distance"],
  hospital_distance: [0, 50, "Hospital distance"],
  main_road_distance: [0, 50, "Main road distance"],
};

const ICONS = {
  home: "M4 11.5 12 5l8 6.5M6.5 10v9h11v-9M10 19v-5h4v5",
  layers: "M12 4 3 9l9 5 9-5-9-5zM3 14l9 5 9-5",
  sparkle: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6",
  pin: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  reset: "M4 4v6h6M20 20v-6h-6M5.5 15A7.5 7.5 0 0 0 19 16M18.5 9A7.5 7.5 0 0 0 5 8",
  check: "M5 12.5 10 17 19 7",
  alert: "M12 8v5M12 16.5v.01M10.3 4.3 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z",
};

function Icon({ name, className = "pv-icon" }) {
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
      <path d={ICONS[name]} />
    </svg>
  );
}

const formatAmenities = (value) => value.split(",").join(" · ");

function loadSavedForm() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && typeof saved === "object") {
      const restored = { ...initialFormData };
      for (const key of Object.keys(initialFormData)) {
        if (typeof saved[key] === "string") {
          restored[key] = saved[key];
        }
      }
      return restored;
    }
  } catch {
    // Ignore unreadable or blocked storage and start with an empty form.
  }
  return { ...initialFormData };
}

// Drop saved values the current model no longer recognises.
function sanitizeForModel(data, modelOptions) {
  const next = { ...data };
  for (const field of MODEL_FIELDS) {
    const allowed = modelOptions.options[field] || [];
    if (next[field] && !allowed.includes(next[field])) {
      next[field] = "";
    }
  }
  const localities = modelOptions.localities_by_location?.[next.location] || [];
  if (next.locality && !localities.includes(next.locality)) {
    next.locality = "";
  }
  return next;
}

function validate(data) {
  const errors = {};

  for (const field of REQUIRED_FIELDS) {
    if (!String(data[field]).trim()) {
      errors[field] = "This field is required.";
    }
  }

  for (const [field, [min, max, label]] of Object.entries(NUMBER_RULES)) {
    if (errors[field] || data[field] === "") continue;
    const value = Number(data[field]);
    if (!Number.isFinite(value) || value < min || value > max) {
      errors[field] = `${label} must be between ${min} and ${max}.`;
    }
  }

  if (
    !errors.floor &&
    !errors.total_floors &&
    data.floor !== "" &&
    data.total_floors !== "" &&
    Number(data.floor) > Number(data.total_floors)
  ) {
    errors.floor = "Floor cannot be higher than total floors.";
  }

  return errors;
}

function toPayload(data) {
  const number = (value) => Number(value || 0);
  return {
    location: data.location,
    locality: data.locality,
    property_type: data.property_type,
    area: number(data.area),
    bedrooms: number(data.bedrooms),
    bathrooms: number(data.bathrooms),
    floor: number(data.floor),
    total_floors: number(data.total_floors),
    property_age: number(data.property_age),
    parking: number(data.parking),
    lift: data.lift || "No",
    furnishing: data.furnishing,
    facing: data.facing,
    balcony: number(data.balcony),
    amenities: data.amenities,
    amenities_count: data.amenities ? data.amenities.split(",").length : 0,
    gated_community: data.gated_community || "No",
    security: data.security || "No",
    power_backup: data.power_backup || "No",
    water_supply: data.water_supply,
    property_status: data.property_status,
    metro_distance: number(data.metro_distance),
    school_distance: number(data.school_distance),
    hospital_distance: number(data.hospital_distance),
    main_road_distance: number(data.main_road_distance),
  };
}

function apiErrorMessage(error) {
  const detail = error.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => `${item.loc?.slice(-1)[0] || "field"}: ${item.msg}`)
      .join(" ");
  }
  if (typeof detail === "string") return detail;
  if (error.response?.status === 401) {
    return "Your session has expired. Please sign in again.";
  }
  if (!error.response) {
    return "Cannot reach the valuation service. Check that the backend is running.";
  }
  return "Unable to predict the property price. Please try again.";
}

function PropertyForm({ onPrediction, onSubmittingChange }) {
  const [formData, setFormData] = useState(loadSavedForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelOptions, setModelOptions] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [optionsRetry, setOptionsRetry] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch {
      // Storage can be unavailable (private mode); persistence is optional.
    }
  }, [formData]);

  useEffect(() => {
    let active = true;
    setOptionsLoading(true);
    setOptionsError("");

    getPredictionOptions()
      .then((result) => {
        if (!result?.success || !result.options) {
          throw new Error("The trained model did not provide its input options.");
        }
        if (active) {
          setModelOptions(result);
          setFormData((previous) => sanitizeForModel(previous, result));
        }
      })
      .catch((error) => {
        if (active) {
          const detail = error.response?.data?.detail;
          setOptionsError(
            typeof detail === "string"
              ? detail
              : "Could not connect to the trained prediction model.",
          );
        }
      })
      .finally(() => {
        if (active) setOptionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [optionsRetry]);

  const options = (field) => modelOptions?.options[field] || [];
  const localityOptions =
    modelOptions?.localities_by_location?.[formData.location] || [];

  const updateField = (name, value) => {
    onPrediction?.(null, null);
    setFormError("");
    setErrors((previous) => {
      if (!previous[name]) return previous;
      const next = { ...previous };
      delete next[name];
      return next;
    });
    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "location" ? { locality: "" } : {}),
    }));
  };

  // AI auto-fill: put typical segment values into fields the user left
  // empty (or facilities still at the default "No"). Returns how many changed.
  const handleAutofill = (typical) => {
    let filled = 0;
    const next = { ...formData };
    for (const [name, value] of Object.entries(typical || {})) {
      if (!(name in next)) continue;
      const isFacility = FACILITIES.some(([facility]) => facility === name);
      const empty = isFacility ? next[name] === "No" && value === "Yes" : !String(next[name]).trim();
      if (empty) {
        next[name] = String(value);
        filled += 1;
      }
    }
    if (filled) {
      onPrediction?.(null, null);
      setFormData(next);
      setErrors((previous) => {
        const remaining = { ...previous };
        for (const name of Object.keys(typical)) delete remaining[name];
        return remaining;
      });
    }
    return filled;
  };

  const handleChange = (event) => {
    updateField(event.target.name, event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    const nextErrors = validate(formData);
    setErrors(nextErrors);

    const invalid = Object.keys(nextErrors);
    if (invalid.length > 0) {
      setFormError(
        `Please review ${invalid.length} highlighted field${
          invalid.length > 1 ? "s" : ""
        } before requesting a valuation.`,
      );
      const firstInvalid = Object.keys(initialFormData).find(
        (field) => nextErrors[field],
      );
      document.getElementById(`pv-${firstInvalid}`)?.focus();
      return;
    }

    setFormError("");
    setLoading(true);
    onSubmittingChange?.(true);

    try {
      const payload = toPayload(formData);
      const result = await predictPrice(payload);
      onPrediction?.(result, payload);
    } catch (error) {
      setFormError(apiErrorMessage(error));
    } finally {
      setLoading(false);
      onSubmittingChange?.(false);
    }
  };

  const handleClear = () => {
    setFormData({ ...initialFormData });
    setErrors({});
    setFormError("");
    onPrediction?.(null, null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clear when storage is unavailable.
    }
  };

  const filledRequired = REQUIRED_FIELDS.filter((field) =>
    String(formData[field]).trim(),
  ).length;
  const progress = Math.round((filledRequired / REQUIRED_FIELDS.length) * 100);
  const modelReady = Boolean(modelOptions) && !optionsError;
  const modelBusy = !modelOptions;

  const field = (name) => ({
    name,
    value: formData[name],
    error: errors[name],
    onChange: handleChange,
  });

  return (
    <section className="pv-card pv-form-card" aria-label="Property details">
      {optionsError && (
        <div className="pv-alert pv-alert-warning" role="alert">
          <Icon name="alert" />
          <span>{optionsError}</span>
          <button
            type="button"
            onClick={() => setOptionsRetry((attempt) => attempt + 1)}
          >
            Retry
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormSection
          number="01"
          icon="home"
          title="Property basics"
          aside={
            <SmartPreview
              location={formData.location}
              locality={formData.locality}
              propertyType={formData.property_type}
              bedrooms={formData.bedrooms}
              onAutofill={handleAutofill}
            />
          }
        >
          <Select
            label="City"
            {...field("location")}
            options={options("location")}
            disabled={modelBusy}
            required
          />
          <Select
            label="Locality"
            {...field("locality")}
            options={localityOptions}
            disabled={modelBusy || !formData.location}
            placeholder={formData.location ? "Select" : "Choose city first"}
            required
          />
          <Select
            label="Property type"
            {...field("property_type")}
            options={options("property_type")}
            disabled={modelBusy}
            required
          />
          <Select
            label="Status"
            {...field("property_status")}
            options={options("property_status")}
            disabled={modelBusy}
            required
          />
          <Input
            label="Built-up area"
            {...field("area")}
            suffix="sq. ft."
            placeholder="1450"
            min={100}
            required
          />
          <Select
            label="Bedrooms"
            {...field("bedrooms")}
            options={["1", "2", "3", "4", "5", "6"]}
            formatOption={(value) => `${value} BHK`}
            required
          />
          <Input
            label="Bathrooms"
            {...field("bathrooms")}
            placeholder="2"
            min={1}
            required
          />
          <Input
            label="Property age"
            {...field("property_age")}
            suffix="yrs"
            placeholder="5"
            min={0}
          />
        </FormSection>

        <FormSection number="02" icon="layers" title="Building & features">
          <Input label="Floor" {...field("floor")} placeholder="4" min={0} />
          <Input
            label="Total floors"
            {...field("total_floors")}
            placeholder="12"
            min={0}
          />
          <Select
            label="Parking"
            {...field("parking")}
            options={["0", "1", "2", "3"]}
            formatOption={(value) =>
              value === "0" ? "None" : `${value} slot${value === "1" ? "" : "s"}`
            }
          />
          <Select
            label="Balconies"
            {...field("balcony")}
            options={["0", "1", "2", "3", "4"]}
            formatOption={(value) => (value === "0" ? "None" : value)}
          />
          <Select
            label="Furnishing"
            {...field("furnishing")}
            options={options("furnishing")}
            disabled={modelBusy}
            required
          />
          <Select
            label="Facing"
            {...field("facing")}
            options={options("facing")}
            disabled={modelBusy}
            required
          />
          <Select
            label="Water supply"
            {...field("water_supply")}
            options={options("water_supply")}
            disabled={modelBusy}
            required
          />
          <Select
            label="Amenities"
            {...field("amenities")}
            options={options("amenities")}
            formatOption={formatAmenities}
            disabled={modelBusy}
            required
          />
        </FormSection>

        <FormSection number="03" icon="pin" title="Connectivity & facilities">
          <Input
            label="Metro station"
            {...field("metro_distance")}
            suffix="km"
            step="0.1"
            placeholder="1.5"
            min={0}
          />
          <Input
            label="School"
            {...field("school_distance")}
            suffix="km"
            step="0.1"
            placeholder="2"
            min={0}
          />
          <Input
            label="Hospital"
            {...field("hospital_distance")}
            suffix="km"
            step="0.1"
            placeholder="3"
            min={0}
          />
          <Input
            label="Main road"
            {...field("main_road_distance")}
            suffix="km"
            step="0.1"
            placeholder="0.5"
            min={0}
          />
          <FacilityChips
            values={formData}
            onToggle={updateField}
            disabled={modelBusy}
          />
        </FormSection>

        {formError && (
          <div className="pv-alert pv-alert-error" role="alert">
            <Icon name="alert" />
            <span>{formError}</span>
          </div>
        )}

        <div className="pv-actions">
          <div className="pv-actions-meta">
            <div
              className={`pv-model-status ${
                optionsLoading ? "is-loading" : modelReady ? "is-ready" : "is-offline"
              }`}
            >
              <span className="pv-status-dot" aria-hidden="true" />
              {optionsLoading
                ? "Connecting…"
                : modelReady
                  ? "Model connected"
                  : "Model unavailable"}
            </div>
            <div className="pv-progress">
              <div
                className="pv-progress-track"
                role="progressbar"
                aria-label="Required fields completed"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <span style={{ width: `${progress}%` }} />
              </div>
              <span className="pv-progress-text">
                {filledRequired}/{REQUIRED_FIELDS.length} required
              </span>
            </div>
          </div>

          <div className="pv-action-buttons">
            <button
              type="button"
              className="pv-button pv-button-ghost"
              onClick={handleClear}
              disabled={loading}
            >
              <Icon name="reset" />
              Reset
            </button>
            <button
              type="submit"
              className="pv-button pv-button-primary"
              disabled={loading || !modelReady}
            >
              {loading ? (
                <>
                  <span className="pv-spinner" aria-hidden="true" />
                  Analysing…
                </>
              ) : (
                <>
                  Get valuation
                  <Icon name="arrow" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function FormSection({ number, icon, title, aside, children }) {
  const headingId = `pv-section-${number}`;
  return (
    <fieldset className="pv-section" aria-labelledby={headingId}>
      <div className={`pv-section-top${aside ? " has-aside" : ""}`}>
        <h3 className="pv-section-head" id={headingId}>
          <span className="pv-section-icon">
            <Icon name={icon} />
          </span>
          <span className="pv-section-number">{number}</span>
          <span className="pv-section-title">{title}</span>
        </h3>
        {aside}
      </div>
      <div className="pv-grid">{children}</div>
    </fieldset>
  );
}

function FieldShell({ id, label, required, error, hint, wide, children }) {
  return (
    <div className={`pv-field${error ? " has-error" : ""}${wide ? " is-wide" : ""}`}>
      <label htmlFor={id}>
        {label}
        {required && (
          <span className="pv-required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <span className="pv-field-message" id={`${id}-message`}>
          {error}
        </span>
      ) : (
        hint && (
          <span className="pv-field-hint" id={`${id}-message`}>
            {hint}
          </span>
        )
      )}
    </div>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  suffix,
  placeholder,
  step = "1",
  min,
}) {
  const id = `pv-${name}`;
  return (
    <FieldShell id={id} label={label} required={required} error={error}>
      <div className="pv-control">
        <input
          id={id}
          name={name}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-message` : undefined}
        />
        {suffix && <span className="pv-suffix">{suffix}</span>}
      </div>
    </FieldShell>
  );
}

function Select({
  label,
  name,
  value,
  onChange,
  error,
  options,
  required = false,
  disabled = false,
  placeholder = "Select",
  formatOption = (option) => option,
  hint,
  wide,
}) {
  const id = `pv-${name}`;
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      error={error}
      hint={hint}
      wide={wide}
    >
      <div className="pv-control pv-select">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? `${id}-message` : undefined}
          title={value ? formatOption(value) : undefined}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {formatOption(option)}
            </option>
          ))}
        </select>
      </div>
    </FieldShell>
  );
}

function FacilityChips({ values, onToggle, disabled }) {
  return (
    <div
      className="pv-field pv-facilities"
      role="group"
      aria-labelledby="pv-facilities-label"
    >
      <span className="pv-field-label" id="pv-facilities-label">
        Facilities
      </span>
      <div className="pv-chips">
        {FACILITIES.map(([name, label]) => {
          const checked = values[name] === "Yes";
          return (
            <label key={name} className={`pv-chip${checked ? " is-on" : ""}`}>
              <input
                type="checkbox"
                id={`pv-${name}`}
                checked={checked}
                disabled={disabled}
                onChange={(event) =>
                  onToggle(name, event.target.checked ? "Yes" : "No")
                }
              />
              <span className="pv-chip-box" aria-hidden="true">
                <Icon name="check" className="pv-chip-check" />
              </span>
              {label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default PropertyForm;
