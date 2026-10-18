  import { useEffect, useState } from "react";
import briefImage from "../assets/property-09.jpg";
import "./Requirements.css";

const STORAGE_KEY = "estateiq-customer-requirements";

const initialRequirements = {
  location: "",
  propertyType: "",
  minBudget: "",
  maxBudget: "",
  bedrooms: "",
  bathrooms: "",
  notes: "",
}; 

const BRIEF_STEPS = [
  {
    label: "Set your budget",
    icon: "M12 3v18M16.5 7.5c0-1.7-2-3-4.5-3s-4.5 1.3-4.5 3 2 2.6 4.5 3 4.5 1.3 4.5 3-2 3-4.5 3-4.5-1.3-4.5-3",
  },
  {
    label: "Pick preferences",
    icon: "M4 11.5 12 5l8 6.5M6.5 10v9h11v-9M10 19v-5h4v5",
  },
  {
    label: "Save your brief",
    icon: "M5 12.5 10 17 19 7",
  },
];

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function Requirements() {
  const [formData, setFormData] = useState(initialRequirements);
  const [hasSavedRequirements, setHasSavedRequirements] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const savedRequirements = readStorage(STORAGE_KEY);

      if (savedRequirements) {
        const parsedRequirements = JSON.parse(savedRequirements);
        if (
          parsedRequirements &&
          typeof parsedRequirements === "object" &&
          !Array.isArray(parsedRequirements)
        ) {
          setFormData({ ...initialRequirements, ...parsedRequirements });
          setHasSavedRequirements(true);
        }
      }
    } catch (loadError) {
      console.error("Unable to load saved customer requirements:", loadError);
      setError("Saved requirements could not be read from this browser.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setError("");
    setNotice("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const minBudget = formData.minBudget
      ? Number(formData.minBudget)
      : undefined;
    const maxBudget = formData.maxBudget
      ? Number(formData.maxBudget)
      : undefined;

    if (
      (minBudget !== undefined && minBudget < 0) ||
      (maxBudget !== undefined && maxBudget < 0)
    ) {
      setError("Budget amounts cannot be negative.");
      return;
    }

    if (
      minBudget !== undefined &&
      maxBudget !== undefined &&
      minBudget > maxBudget
    ) {
      setError("Minimum budget must not exceed maximum budget.");
      return;
    }

    const requirements = {
      ...formData,
      updatedAt: new Date().toISOString(),
    };

    if (!writeStorage(STORAGE_KEY, JSON.stringify(requirements))) {
      console.error("Unable to save customer requirements in browser storage.");
      setError("Requirements could not be saved in this browser.");
      return;
    }

    setHasSavedRequirements(true);
    setNotice("Your requirements are saved in this browser.");
    setError("");
  };

  const handleClear = () => {
    if (!removeStorage(STORAGE_KEY)) {
      console.error("Unable to clear customer requirements from browser storage.");
      setError("Saved requirements could not be removed from this browser.");
      return;
    }

    setFormData(initialRequirements);
    setHasSavedRequirements(false);
    setError("");
    setNotice("Your saved requirements have been cleared.");
  };

  return (
    <main className="requirements-page">
      <header className="requirements-heading">
        <div className="requirements-heading-copy">
          <span className="requirements-eyebrow">
            <span className="requirements-eyebrow-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 4h6M8 4H6a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-2M9 12l2 2 4-4" />
              </svg>
            </span>
            Your property brief
            <span className="requirements-eyebrow-divider" aria-hidden="true" />
            <span className="requirements-eyebrow-meta">Private</span>
          </span>

          <h1>
            Tell us what you&apos;re{" "}
            <span className="requirements-accent">looking for.</span>
          </h1>

          <p>
            Keep your <strong>budget</strong> and{" "}
            <strong>property preferences</strong> together in one simple brief.
            Update or clear it whenever your plans change.
          </p>
        </div>

        <ol className="requirements-steps" aria-label="How the brief works">
          {BRIEF_STEPS.map((step, index) => (
            <li key={step.label}>
              <span className="requirements-step-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={step.icon} />
                </svg>
              </span>
              <span className="requirements-step-number">0{index + 1}</span>
              <span className="requirements-step-label">{step.label}</span>
            </li>
          ))}
        </ol>

        <div className="requirements-photo" aria-hidden="true">
          <img src={briefImage} alt="" decoding="async" />
        </div>
       </header>

      <section className="requirements-card" aria-labelledby="requirements-title">
        <div className="requirements-card-heading">
          <div>
            <span className="requirements-step">CUSTOMER REQUIREMENTS</span>
            <h2 id="requirements-title">
              {hasSavedRequirements ? "Your saved brief" : "Create your brief"}
            </h2>
          </div>
          {hasSavedRequirements && (
            <span className="requirements-saved-badge">SAVED ON THIS DEVICE</span>
          )}
        </div>

        {error && (
          <div className="requirements-message requirements-error" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="requirements-message requirements-success" role="status">
            {notice}
          </div>
        )}

        <form className="requirements-form" onSubmit={handleSubmit}>
          <label className="requirements-field">
            <span>Preferred city or area</span>
            <input
              name="location"
              type="text"
              autoComplete="address-level2"
              placeholder="For example, Gurgaon or Golf Course Road"
              value={formData.location}
              onChange={handleChange}
              maxLength={120}
            />
          </label>

          <label className="requirements-field">
            <span>Property type</span>
            <select
              name="propertyType"
              value={formData.propertyType}
              onChange={handleChange}
            >
              <option value="">Any property type</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="Builder Floor">Builder Floor</option>
              <option value="Plot">Plot</option>
            </select>
          </label>

          <fieldset className="requirements-budget">
            <legend>Budget range <span>(INR)</span></legend>
            <label className="requirements-field">
              <span>Minimum budget</span>
              <input
                name="minBudget"
                type="number"
                min="0"
                step="100000"
                inputMode="numeric"
                placeholder="e.g. 5000000"
                value={formData.minBudget}
                onChange={handleChange}
              />
            </label>
            <label className="requirements-field">
              <span>Maximum budget</span>
              <input
                name="maxBudget"
                type="number"
                min="0"
                step="100000"
                inputMode="numeric"
                placeholder="e.g. 10000000"
                value={formData.maxBudget}
                onChange={handleChange}
              />
            </label>
          </fieldset>

          <label className="requirements-field">
            <span>Bedrooms</span>
            <select
              name="bedrooms"
              value={formData.bedrooms}
              onChange={handleChange}
            >
              <option value="">No preference</option>
              {[1, 2, 3, 4, 5].map((count) => (
                <option key={count} value={count}>
                  {count}+ bedrooms
                </option>
              ))}
            </select>
          </label>

          <label className="requirements-field">
            <span>Bathrooms</span>
            <select
              name="bathrooms"
              value={formData.bathrooms}
              onChange={handleChange}
            >
              <option value="">No preference</option>
              {[1, 2, 3, 4, 5].map((count) => (
                <option key={count} value={count}>
                  {count}+ bathrooms
                </option>
              ))}
            </select>
          </label>

          <label className="requirements-field requirements-notes">
            <span>Other things that matter <span>(optional)</span></span>
            <textarea
              name="notes"
              rows="4"
              maxLength="500"
              placeholder="For example, parking, outdoor space, or a nearby metro"
              value={formData.notes}
              onChange={handleChange}
            />
          </label>

          <div className="requirements-actions">
            <button
              className="requirements-save"
              type="submit"
              disabled={isLoading}
            >
              {hasSavedRequirements ? "Update requirements" : "Save requirements"}
            </button>
            {hasSavedRequirements && (
              <button
                className="requirements-clear"
                type="button"
                onClick={handleClear}
              >
                Clear saved brief
              </button>
            )}
          </div>
        </form>

        <p className="requirements-privacy">
          This brief is stored only in this browser. It is not sent to the
          prediction model and does not search or reserve property listings.
        </p>
      </section>
    </main>
  );
}

export default Requirements;
