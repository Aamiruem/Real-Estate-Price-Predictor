import { useState } from "react";
import { Link } from "react-router-dom";
import HeroMedia from "../components/HeroMedia";
import { BannerIcon } from "../components/PageBanner";
import { submitContact } from "../services/api";
import contactImage from "../assets/property-10.jpg";
import "./Contact.css";

const ICONS = {
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z",
  pin: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  chat: "M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  send: "M4 12 20 4l-6 16-3-7z",
  check: "M5 12.5 10 17 19 7",
  alert: "M12 8v5M12 16.5v.01M10.3 4.3 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z",
  arrow: "M5 12h14M13 6l6 6-6 6",
};

const CONTACT_DETAILS = [
  { icon: "mail", label: "Email", value: "hello@estateai.com", href: "mailto:hello@estateai.com" },
  { icon: "phone", label: "Phone", value: "+91 99999 99999", href: "tel:+919999999999" },
  { icon: "pin", label: "Based in", value: "Gurgaon · Delhi-NCR" },
];

// Must match ContactRequest.enquiry_type in ml_backend/schemas/schemas.py.
const ENQUIRY_TYPES = ["Property valuation", "Technical support", "General enquiry"];

const initialForm = {
  name: "",
  email: "",
  phone: "",
  enquiry_type: "",
  message: "",
  consent: false,
};

function validate(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  const phone = form.phone.replace(/[\s-]/g, "");
  if (phone && !/^(\+91)?[6-9]\d{9}$/.test(phone)) {
    errors.phone = "Enter a valid 10-digit Indian mobile number.";
  }
  if (!form.enquiry_type) errors.enquiry_type = "Choose what your enquiry is about.";
  if (form.message.trim().length < 10) errors.message = "Write at least 10 characters.";
  if (!form.consent) errors.consent = "Please agree so we can reply to you.";
  return errors;
}

function Field({ id, label, error, optional, children }) {
  return (
    <div className={`ct-field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>
        {label}
        {optional ? <span className="ct-optional">optional</span> : <span className="ct-required">*</span>}
      </label>
      {children}
      {error && (
        <span className="ct-error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}

function Contact() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [submitError, setSubmitError] = useState("");

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({ ...previous, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((previous) => ({ ...previous, [name]: "" }));
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(`ct-${firstInvalid}`)?.focus();
      return;
    }

    setStatus("sending");
    try {
      await submitContact({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        enquiry_type: form.enquiry_type,
        message: form.message.trim(),
      });
      setStatus("sent");
      setForm(initialForm);
    } catch (error) {
      const detail = error.response?.data?.detail;
      setSubmitError(
        typeof detail === "string"
          ? detail
          : error.response
            ? "Some details look invalid. Please check the form and try again."
            : "Cannot reach the server right now. Please try again shortly.",
      );
      setStatus("idle");
    }
  };

  const describedBy = (name) => (errors[name] ? `ct-${name}-error` : undefined);

  return (
    <div className="ct-page">
      <section className="ct-media">
        <HeroMedia image={contactImage} position="center 40%" />
        <div className="ct-media-shade" aria-hidden="true" />

        <div className="ct-media-content">
          <span className="pb-badge">
            <span className="pb-badge-icon" aria-hidden="true">
              <BannerIcon path={ICONS.chat} />
            </span>
            Contact EstateIQ
          </span>
          <h1>
            Let&apos;s talk about your <span className="pb-accent">property.</span>
          </h1>
          <p>
            Questions about a valuation, the platform or your account? Send a
            message and we&apos;ll reply by email.
          </p>

          <ul className="ct-details">
            {CONTACT_DETAILS.map((detail) => (
              <li key={detail.label}>
                <span className="ct-detail-icon" aria-hidden="true">
                  <BannerIcon path={ICONS[detail.icon]} />
                </span>
                <span>
                  <small>{detail.label}</small>
                  {detail.href ? <a href={detail.href}>{detail.value}</a> : <strong>{detail.value}</strong>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="ct-form-card" aria-labelledby="ct-form-title">
        {status === "sent" ? (
          <div className="ct-success" role="status">
            <span className="ct-success-icon" aria-hidden="true">
              <BannerIcon path={ICONS.check} />
            </span>
            <h2>Message sent</h2>
            <p>
              Thanks for getting in touch. Your enquiry has been saved and
              we&apos;ll reply to the email address you provided.
            </p>
            <div className="ct-success-actions">
              <button type="button" className="ct-button ct-button-ghost" onClick={() => setStatus("idle")}>
                Send another message
              </button>
              <Link to="/prediction" className="ct-button ct-button-primary">
                Get a valuation
                <BannerIcon path={ICONS.arrow} />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <header className="ct-form-head">
              <h2 id="ct-form-title">Send a message</h2>
              <p>Fields marked * are required.</p>
            </header>

            <form onSubmit={handleSubmit} noValidate>
              <div className="ct-grid">
                <Field id="ct-name" label="Full name" error={errors.name}>
                  <input
                    id="ct-name"
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={update}
                    maxLength={100}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={describedBy("name")}
                  />
                </Field>

                <Field id="ct-email" label="Email" error={errors.email}>
                  <input
                    id="ct-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={update}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={describedBy("email")}
                  />
                </Field>

                <Field id="ct-phone" label="Phone" optional error={errors.phone}>
                  <input
                    id="ct-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+91"
                    value={form.phone}
                    onChange={update}
                    maxLength={16}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={describedBy("phone")}
                  />
                </Field>

                <Field id="ct-enquiry_type" label="Topic" error={errors.enquiry_type}>
                  <select
                    id="ct-enquiry_type"
                    name="enquiry_type"
                    value={form.enquiry_type}
                    onChange={update}
                    aria-invalid={Boolean(errors.enquiry_type)}
                    aria-describedby={describedBy("enquiry_type")}
                  >
                    <option value="">Select a topic</option>
                    {ENQUIRY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="ct-wide">
                  <Field id="ct-message" label="Message" error={errors.message}>
                    <textarea
                      id="ct-message"
                      name="message"
                      rows={5}
                      value={form.message}
                      onChange={update}
                      maxLength={1000}
                      placeholder="How can we help?"
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={describedBy("message")}
                    />
                  </Field>
                  <span className="ct-counter">{form.message.length}/1000</span>
                </div>
              </div>

              <label className={`ct-consent${errors.consent ? " has-error" : ""}`}>
                <input
                  id="ct-consent"
                  name="consent"
                  type="checkbox"
                  checked={form.consent}
                  onChange={update}
                  aria-describedby={describedBy("consent")}
                />
                <span>I agree to be contacted about this enquiry.</span>
              </label>
              {errors.consent && (
                <span className="ct-error" id="ct-consent-error">
                  {errors.consent}
                </span>
              )}

              {submitError && (
                <div className="ct-alert" role="alert">
                  <BannerIcon path={ICONS.alert} />
                  {submitError}
                </div>
              )}

              <button type="submit" className="ct-button ct-button-primary ct-submit" disabled={status === "sending"}>
                {status === "sending" ? (
                  <>
                    <span className="ct-spinner" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  <>
                    Send message
                    <BannerIcon path={ICONS.send} />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

export default Contact;
