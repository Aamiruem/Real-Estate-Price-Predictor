import { useState } from "react";
import "./Contact.css";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  enquiryType: "",
  subject: "",
  preferredContact: "Email",
  message: "",
  consent: false,
};

function Contact() {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Please enter your name.";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must contain at least 2 characters.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Please enter your email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Please enter your phone number.";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\s+/g, ""))) {
      newErrors.phone = "Enter a valid 10-digit Indian mobile number.";
    }

    if (!formData.enquiryType) {
      newErrors.enquiryType = "Please select an enquiry type.";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Please enter a subject.";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Please write your message.";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message should contain at least 10 characters.";
    }

    if (!formData.consent) {
      newErrors.consent = "Please accept the communication consent.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setStatus("loading");

    // Replace this timeout with your backend/API call later.
    await new Promise((resolve) => setTimeout(resolve, 1200));

    console.log("Contact enquiry:", formData);

    setStatus("success");

    setFormData(initialForm);
    setErrors({});
  };

  const handleNewMessage = () => {
    setStatus("idle");
  };

  return (
    <main className="contact-page">
      {/* Hero */}
      <section className="contact-hero">
        <div className="contact-hero-content">
          <div className="contact-eyebrow">
            <span className="eyebrow-dot"></span>
            CONTACT ESTATEIQ
          </div>

          <h1>
            Let's Talk About Your
            <span> Property.</span>
          </h1>

          <p>
            Have a question about property valuation, market insights,
            investment opportunities, or EstateIQ? Our team is ready to help.
          </p>

          <div className="contact-hero-stats">
            <div className="hero-stat">
              <strong>24h</strong>
              <span>Typical response</span>
            </div>

            <div className="hero-stat-divider"></div>

            <div className="hero-stat">
              <strong>100%</strong>
              <span>Secure enquiry</span>
            </div>

            <div className="hero-stat-divider"></div>

            <div className="hero-stat">
              <strong>AI</strong>
              <span>Property insights</span>
            </div>
          </div>
        </div>

        <div className="hero-decoration">
          <div className="hero-orbit orbit-one"></div>
          <div className="hero-orbit orbit-two"></div>
          <div className="hero-orbit orbit-three"></div>

          <div className="hero-building">
            <span>GE</span>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="contact-content">
        {/* Left information */}
        <aside className="contact-sidebar">
          <div className="sidebar-heading">
            <span className="section-label">GET IN TOUCH</span>
            <h2>We'd love to hear from you.</h2>
            <p>
              Tell us what you need and we'll connect you with the right
              information or assistance.
            </p>
          </div>

          <div className="contact-info-list">
            <div className="contact-info-card">
              <div className="contact-icon">✉</div>

              <div>
                <span>Email us</span>
                <a href="mailto:hello@estateai.com">hello@estateai.com</a>
                <small>For general enquiries & support</small>
              </div>
            </div>

            <div className="contact-info-card">
              <div className="contact-icon">☎</div>

              <div>
                <span>Call us</span>
                <a href="tel:+919999999999">+91 99999 99999</a>
                <small>Mon – Sat · 9:00 AM – 7:00 PM</small>
              </div>
            </div>

            <div className="contact-info-card">
              <div className="contact-icon">⌖</div>

              <div>
                <span>Our presence</span>
                <strong>Gurgaon · Delhi-NCR</strong>
                <small>Serving property buyers & investors</small>
              </div>
            </div>
          </div>

          <div className="response-card">
            <div className="response-icon">
              <span></span>
            </div>

            <div>
              <strong>We're currently available</strong>
              <p>
                Send your enquiry and our team will get back to you as soon as
                possible.
              </p>
            </div>
          </div>

          <div className="trust-points">
            <div>
              <span>✓</span>
              <p>Your information stays private</p>
            </div>

            <div>
              <span>✓</span>
              <p>No spam or unnecessary calls</p>
            </div>

            <div>
              <span>✓</span>
              <p>Professional property assistance</p>
            </div>
          </div>
        </aside>

        {/* Contact form */}
        <div className="contact-form-card">
          {status === "success" ? (
            <div className="success-state">
              <div className="success-icon">✓</div>

              <span className="section-label">MESSAGE RECEIVED</span>

              <h2>Thank you for contacting us.</h2>

              <p>
                Your enquiry has been submitted successfully. Our team will
                review your message and contact you using your preferred contact
                method.
              </p>

              <div className="success-details">
                <div>
                  <span>Expected response</span>
                  <strong>Within 24 hours</strong>
                </div>

                <div>
                  <span>Enquiry status</span>
                  <strong>Received</strong>
                </div>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={handleNewMessage}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <>
              <div className="form-header">
                <div>
                  <span className="section-label">SEND AN ENQUIRY</span>

                  <h2>How can we help?</h2>

                  <p>
                    Fill in the details below and our team will get back to you.
                  </p>
                </div>

                <div className="secure-badge">
                  <span>🔒</span>
                  Secure
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-grid">
                  {/* Name */}
                  <div className="input-group">
                    <label htmlFor="name">
                      Full Name <span>*</span>
                    </label>

                    <div
                      className={`input-wrapper ${
                        errors.name ? "has-error" : ""
                      }`}
                    >
                      <span className="input-icon">◉</span>

                      <input
                        id="name"
                        type="text"
                        name="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleChange}
                        autoComplete="name"
                      />
                    </div>

                    {errors.name && (
                      <small className="field-error">{errors.name}</small>
                    )}
                  </div>

                  {/* Email */}
                  <div className="input-group">
                    <label htmlFor="email">
                      Email Address <span>*</span>
                    </label>

                    <div
                      className={`input-wrapper ${
                        errors.email ? "has-error" : ""
                      }`}
                    >
                      <span className="input-icon">✉</span>

                      <input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="email"
                      />
                    </div>

                    {errors.email && (
                      <small className="field-error">{errors.email}</small>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="input-group">
                    <label htmlFor="phone">
                      Phone Number <span>*</span>
                    </label>

                    <div
                      className={`input-wrapper ${
                        errors.phone ? "has-error" : ""
                      }`}
                    >
                      <span className="phone-prefix">+91</span>

                      <input
                        id="phone"
                        type="tel"
                        name="phone"
                        placeholder="Enter 10-digit number"
                        value={formData.phone}
                        onChange={handleChange}
                        maxLength="10"
                        autoComplete="tel"
                      />
                    </div>

                    {errors.phone && (
                      <small className="field-error">{errors.phone}</small>
                    )}
                  </div>

                  {/* Enquiry */}
                  <div className="input-group">
                    <label htmlFor="enquiryType">
                      Enquiry Type <span>*</span>
                    </label>

                    <div
                      className={`input-wrapper ${
                        errors.enquiryType ? "has-error" : ""
                      }`}
                    >
                      <span className="input-icon">⌂</span>

                      <select
                        id="enquiryType"
                        name="enquiryType"
                        value={formData.enquiryType}
                        onChange={handleChange}
                      >
                        <option value="">Select enquiry type</option>
                        <option value="Property Valuation">
                          Property Valuation
                        </option>
                        <option value="Property Search">Property Search</option>
                        <option value="Investment">
                          Investment Consultation
                        </option>
                        <option value="Technical Support">
                          Technical Support
                        </option>
                        <option value="Partnership">
                          Business Partnership
                        </option>
                        <option value="General Enquiry">General Enquiry</option>
                      </select>
                    </div>

                    {errors.enquiryType && (
                      <small className="field-error">
                        {errors.enquiryType}
                      </small>
                    )}
                  </div>

                  {/* Subject */}
                  <div className="input-group full-width">
                    <label htmlFor="subject">
                      Subject <span>*</span>
                    </label>

                    <div
                      className={`input-wrapper ${
                        errors.subject ? "has-error" : ""
                      }`}
                    >
                      <span className="input-icon">▤</span>

                      <input
                        id="subject"
                        type="text"
                        name="subject"
                        placeholder="What would you like to discuss?"
                        value={formData.subject}
                        onChange={handleChange}
                      />
                    </div>

                    {errors.subject && (
                      <small className="field-error">{errors.subject}</small>
                    )}
                  </div>

                  {/* Message */}
                  <div className="input-group full-width">
                    <div className="message-label-row">
                      <label htmlFor="message">
                        Message <span>*</span>
                      </label>

                      <small>{formData.message.length}/1000</small>
                    </div>

                    <textarea
                      id="message"
                      name="message"
                      placeholder="Tell us how we can help you..."
                      value={formData.message}
                      onChange={handleChange}
                      maxLength="1000"
                      rows="6"
                    />

                    {errors.message && (
                      <small className="field-error">{errors.message}</small>
                    )}
                  </div>
                </div>

                {/* Preferred contact */}
                <div className="preference-section">
                  <label>Preferred contact method</label>

                  <div className="preference-options">
                    {["Email", "Phone", "WhatsApp"].map((method) => (
                      <label
                        className={`preference-option ${
                          formData.preferredContact === method ? "selected" : ""
                        }`}
                        key={method}
                      >
                        <input
                          type="radio"
                          name="preferredContact"
                          value={method}
                          checked={formData.preferredContact === method}
                          onChange={handleChange}
                        />

                        <span className="radio-circle"></span>

                        <span>{method}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Consent */}
                <label className="consent-row">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={formData.consent}
                    onChange={handleChange}
                  />

                  <span className="custom-checkbox">✓</span>

                  <p>
                    I agree to be contacted regarding my enquiry and understand
                    that my information will be handled securely.
                  </p>
                </label>

                {errors.consent && (
                  <small className="field-error consent-error">
                    {errors.consent}
                  </small>
                )}

                <button
                  type="submit"
                  className="contact-submit-button"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? (
                    <>
                      <span className="button-spinner"></span>
                      Sending Enquiry...
                    </>
                  ) : (
                    <>
                      Send Enquiry
                      <span>→</span>
                    </>
                  )}
                </button>

                <p className="form-security-note">
                  🔒 Your details are protected and will only be used to respond
                  to your enquiry.
                </p>
              </form>
            </>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="contact-bottom-cta">
        <div>
          <span className="section-label">ESTATEIQ</span>
          <h2>Smarter property decisions start here.</h2>
          <p>
            Explore AI-powered property valuation and make your next real estate
            decision with better information.
          </p>
        </div>

        <a href="/prediction" className="cta-button">
          Try Property Valuation
          <span>→</span>
        </a>
      </section>
    </main>
  );
}

export default Contact;
