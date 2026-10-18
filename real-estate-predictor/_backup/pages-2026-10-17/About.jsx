import React from "react";
import "./About.css";


function About() {
  const propertyTypes = [
    {
      icon: "🏢",
      title: "Apartments",
      text: "Analyze apartments and residential units using area, configuration, floor, location and amenities.",
    },
    {
      icon: "🏠",
      title: "Independent Houses",
      text: "Evaluate independent homes using property size, age, parking, location and surrounding facilities.",
    },
    {
      icon: "🏡",
      title: "Villas",
      text: "Estimate villa values using built-up area, bedrooms, amenities, community features and location.",
    },
    {
      icon: "🌳",
      title: "Plots & Land",
      text: "Evaluate land and plot opportunities using location, accessibility, size and surrounding development.",
    },
    {
      icon: "🏬",
      title: "Commercial",
      text: "Support valuation analysis for commercial properties based on location, size, accessibility and property characteristics.",
    },
    {
      icon: "🏙️",
      title: "Luxury Properties",
      text: "Analyze premium properties using advanced property characteristics, amenities and location-related factors.",
    },
  ];

  const features = [
    {
      icon: "📐",
      title: "Property Area",
      text: "Built-up or usable area can have a major influence on estimated property value.",
    },
    {
      icon: "🛏️",
      title: "Bedrooms & Bathrooms",
      text: "Property configuration helps the model understand residential characteristics.",
    },
    {
      icon: "📍",
      title: "Location & Locality",
      text: "Location and locality information helps identify differences between property markets.",
    },
    {
      icon: "🏢",
      title: "Floor & Total Floors",
      text: "Floor position and building height are included as property characteristics.",
    },
    {
      icon: "🚗",
      title: "Parking",
      text: "Parking availability can contribute to the overall property profile.",
    },
    {
      icon: "🛗",
      title: "Lift",
      text: "Lift availability is considered as part of the property's facilities.",
    },
    {
      icon: "🛋️",
      title: "Furnishing",
      text: "Furnishing status provides additional information about the property.",
    },
    {
      icon: "🧭",
      title: "Facing & Balcony",
      text: "Facing direction and balcony information add more detail to the property profile.",
    },
    {
      icon: "🌿",
      title: "Amenities",
      text: "Amenities and amenity count help describe the lifestyle features available with the property.",
    },
    {
      icon: "🔐",
      title: "Security",
      text: "Security availability is considered as part of the property and community profile.",
    },
    {
      icon: "⚡",
      title: "Power Backup",
      text: "Power backup availability adds another dimension to the property's facilities.",
    },
    {
      icon: "💧",
      title: "Water Supply",
      text: "Water supply information is included in the property characteristics.",
    },
  ];

  const facilities = [
    {
      icon: "🏊",
      title: "Swimming Pool",
      text: "Temperature-controlled or standard swimming facilities.",
    },
    {
      icon: "🏋️",
      title: "Fitness Centre",
      text: "Gym and fitness facilities for residents.",
    },
    {
      icon: "🧘",
      title: "Wellness & Spa",
      text: "Wellness, spa, yoga and relaxation facilities.",
    },
    {
      icon: "🎾",
      title: "Sports Facilities",
      text: "Badminton, tennis, pickleball and other recreational facilities.",
    },
    {
      icon: "🌳",
      title: "Green Areas",
      text: "Parks, landscaped gardens and open green spaces.",
    },
    {
      icon: "👶",
      title: "Kids Play Area",
      text: "Dedicated recreational spaces for children.",
    },
    {
      icon: "🏢",
      title: "Clubhouse",
      text: "Community clubhouse and lifestyle facilities.",
    },
    {
      icon: "🔒",
      title: "Gated Community",
      text: "Controlled-access residential communities.",
    },
    {
      icon: "🛡️",
      title: "24/7 Security",
      text: "Security infrastructure and controlled access.",
    },
    {
      icon: "🚘",
      title: "Visitor Parking",
      text: "Dedicated parking facilities for residents and visitors.",
    },
    {
      icon: "⚡",
      title: "Power Backup",
      text: "Backup power infrastructure for essential services.",
    },
    {
      icon: "💧",
      title: "Water Infrastructure",
      text: "Reliable water supply and supporting infrastructure.",
    },
  ];

  const connectivity = [
    {
      icon: "🚇",
      title: "Metro Connectivity",
      text: "Distance from nearby metro stations.",
    },
    {
      icon: "🏫",
      title: "Schools",
      text: "Distance from educational institutions.",
    },
    {
      icon: "🏥",
      title: "Hospitals",
      text: "Distance from hospitals and healthcare facilities.",
    },
    {
      icon: "🛣️",
      title: "Main Roads",
      text: "Accessibility to important roads and major routes.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Enter Property Details",
      text: "Provide the property's location, area, configuration, facilities and other available information.",
    },
    {
      number: "02",
      title: "Data Processing",
      text: "The system prepares and processes the property information for the trained machine learning model.",
    },
    {
      number: "03",
      title: "AI Analysis",
      text: "The model analyzes the property's characteristics and their learned relationships with market values.",
    },
    {
      number: "04",
      title: "Estimated Valuation",
      text: "EstateIQ generates an estimated property value together with supporting valuation information.",
    },
  ];

  return (
    <main className="about-page">
      {/* =====================================
          HERO
      ===================================== */}

      <section className="about-hero">
        <div className="about-hero-content">
          <span className="section-label">ABOUT ESTATEIQ</span>

          <h1>
            Intelligent Property
            <span> Valuation</span>
          </h1>

          <p>
            EstateIQ combines real-estate data, property characteristics and
            machine learning to generate data-driven property valuation
            estimates.
          </p>

          <div className="hero-actions">
            <a href="/prediction" className="about-primary-btn">
              Start Valuation
              <span>→</span>
            </a>

            <a href="#features" className="about-secondary-btn">
              Explore Features
            </a>
          </div>
        </div>

        <div className="about-hero-visual">
          <div className="hero-building">
            <div className="building-glow"></div>

            <div className="building-content">
              <span>AI</span>
              <strong>VALUATION</strong>
              <small>PROPERTY INTELLIGENCE</small>
            </div>
          </div>

          <div className="floating-stat stat-one">
            <span>⌂</span>
            <div>
              <strong>Property</strong>
              <small>Analysis</small>
            </div>
          </div>

          <div className="floating-stat stat-two">
            <span>✦</span>
            <div>
              <strong>AI Model</strong>
              <small>Data Driven</small>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          OVERVIEW
      ===================================== */}

      <section className="about-overview">
        <div className="about-section-heading">
          <span className="section-label">WHAT ESTATEIQ ANALYZES</span>

          <h2>A Complete View of the Property</h2>

          <p>
            Property valuation can depend on many factors. EstateIQ brings
            multiple property, facility and location-related characteristics
            together for machine-learning analysis.
          </p>
        </div>

        <div className="about-stats">
          <div className="about-stat-card">
            <span>01</span>
            <strong>Property</strong>
            <small>Characteristics</small>
          </div>

          <div className="about-stat-card">
            <span>02</span>
            <strong>Facilities</strong>
            <small>& Amenities</small>
          </div>

          <div className="about-stat-card">
            <span>03</span>
            <strong>Location</strong>
            <small>& Connectivity</small>
          </div>

          <div className="about-stat-card">
            <span>04</span>
            <strong>Machine</strong>
            <small>Learning</small>
          </div>
        </div>
      </section>

      {/* =====================================
          PROPERTY TYPES
      ===================================== */}

      <section className="about-section">
        <div className="about-section-heading">
          <span className="section-label">PROPERTY CATEGORIES</span>

          <h2>Designed for Different Property Types</h2>

          <p>
            EstateIQ can be structured to support different categories of
            real-estate assets and their individual characteristics.
          </p>
        </div>

        <div className="property-type-grid">
          {propertyTypes.map((item) => (
            <div className="property-type-card" key={item.title}>
              <div className="property-type-icon">{item.icon}</div>

              <h3>{item.title}</h3>

              <p>{item.text}</p>

              <span className="card-arrow">→</span>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================
          PROPERTY FEATURES
      ===================================== */}

      <section className="about-section" id="features">
        <div className="about-section-heading">
          <span className="section-label">PROPERTY INTELLIGENCE</span>

          <h2>Property Features That Matter</h2>

          <p>
            The valuation workflow can use a broad set of property
            characteristics to create a detailed property profile.
          </p>
        </div>

        <div className="feature-about-grid">
          {features.map((item) => (
            <div className="about-feature-card" key={item.title}>
              <div className="about-feature-icon">{item.icon}</div>

              <div>
                <h3>{item.title}</h3>

                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================
          FACILITIES
      ===================================== */}

      <section className="facilities-section">
        <div className="about-section-heading">
          <span className="section-label">LIFESTYLE & FACILITIES</span>

          <h2>Modern Real-Estate Facilities</h2>

          <p>
            A property's value profile can also be understood through its
            lifestyle, community and infrastructure facilities.
          </p>
        </div>

        <div className="facility-grid">
          {facilities.map((item) => (
            <div className="facility-card" key={item.title}>
              <div className="facility-icon">{item.icon}</div>

              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================
          CONNECTIVITY
      ===================================== */}

      <section className="about-section">
        <div className="about-section-heading">
          <span className="section-label">LOCATION INTELLIGENCE</span>

          <h2>Location & Connectivity</h2>

          <p>
            Accessibility and surrounding infrastructure can provide important
            context when evaluating a property.
          </p>
        </div>

        <div className="connectivity-grid">
          {connectivity.map((item) => (
            <div className="connectivity-card" key={item.title}>
              <span>{item.icon}</span>

              <h3>{item.title}</h3>

              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================
          AI PROCESS
      ===================================== */}

      <section className="process-section">
        <div className="about-section-heading">
          <span className="section-label">HOW ESTATEIQ WORKS</span>

          <h2>From Property Details to AI Valuation</h2>

          <p>
            A simple workflow transforms property information into a
            machine-learning based valuation estimate.
          </p>
        </div>

        <div className="process-grid">
          {steps.map((step) => (
            <div className="process-card" key={step.number}>
              <span className="process-number">{step.number}</span>

              <h3>{step.title}</h3>

              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================
          TECHNOLOGY
      ===================================== */}

      <section className="technology-section">
        <div className="technology-content">
          <span className="section-label">TECHNOLOGY</span>

          <h2>Built Around Data & Machine Learning</h2>

          <p>
            EstateIQ is designed around a machine-learning workflow involving
            data preparation, feature processing, model training and prediction.
          </p>

          <div className="technology-points">
            <div>
              <span>✓</span>
              <strong>Data Preprocessing</strong>
            </div>

            <div>
              <span>✓</span>
              <strong>Feature Engineering</strong>
            </div>

            <div>
              <span>✓</span>
              <strong>Machine Learning</strong>
            </div>

            <div>
              <span>✓</span>
              <strong>Model Evaluation</strong>
            </div>

            <div>
              <span>✓</span>
              <strong>Prediction API</strong>
            </div>

            <div>
              <span>✓</span>
              <strong>Database Integration</strong>
            </div>
          </div>
        </div>

        <div className="technology-visual">
          <div className="ai-orbit">
            <div className="orbit-ring ring-one"></div>
            <div className="orbit-ring ring-two"></div>
            <div className="orbit-ring ring-three"></div>

            <div className="ai-core">
              <span>AI</span>
              <small>ESTATE</small>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          DISCLAIMER
      ===================================== */}

      <section className="valuation-note">
        <div className="note-icon">ⓘ</div>

        <div>
          <h3>About AI Valuation Estimates</h3>

          <p>
            EstateIQ provides machine-learning based estimates using the
            information supplied to the system. An estimated valuation should be
            treated as an analytical reference and not as a guaranteed
            transaction price, appraisal or professional property valuation.
          </p>
        </div>
      </section>

      {/* =====================================
          CTA
      ===================================== */}

      <section className="about-cta">
        <span className="section-label">START WITH ESTATEIQ</span>

        <h2>
          Explore Your Property's
          <span> Estimated Value</span>
        </h2>

        <p>
          Enter your property details and let EstateIQ generate a data-driven
          valuation estimate.
        </p>

        <a href="/prediction" className="about-primary-btn">
          Predict Property Price
          <span>→</span>
        </a>
      </section>
    </main>
  );
}

export default About;
