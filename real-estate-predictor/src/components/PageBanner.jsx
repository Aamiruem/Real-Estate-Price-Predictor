import "./PageBanner.css";

const SKYLINE =
  "M0 120V96h26V70h18v26h14V52l16-12 16 12v68h12V84h22V60h10V40h14v20h10v60h14V74l22-14 22 14v46h16V30h12V14h8v16h12v90h14V88h20v32h18V64h24v56h16V44l20-10 20 10v76h14V80h26v40";

export function BannerIcon({ path, className = "pb-icon" }) {
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
      <path d={path} />
    </svg>
  );
}

/**
 * Navy page header shared across pages.
 * `items` renders glass tiles on the right: [{ icon, value?, label }].
 */
function PageBanner({ badgeIcon, badge, meta, title, accent, children, items = [], actions }) {
  return (
    <header className="pb-banner">
      <div className="pb-copy">
        <span className="pb-badge">
          <span className="pb-badge-icon" aria-hidden="true">
            <BannerIcon path={badgeIcon} />
          </span>
          {badge}
          {meta && (
            <>
              <span className="pb-badge-divider" aria-hidden="true" />
              <span className="pb-badge-meta">{meta}</span>
            </>
          )}
        </span>

        <h1>
          {title} {accent && <span className="pb-accent">{accent}</span>}
        </h1>

        {children && <p className="pb-text">{children}</p>}
        {actions && <div className="pb-actions">{actions}</div>}
      </div>

      {items.length > 0 && (
        <ul className="pb-items">
          {items.map((item) => (
            <li key={item.label}>
              <span className="pb-item-icon" aria-hidden="true">
                <BannerIcon path={item.icon} />
              </span>
              <span className="pb-item-text">
                {item.value && <strong>{item.value}</strong>}
                <span>{item.label}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <svg
        className="pb-skyline"
        viewBox="0 0 520 120"
        preserveAspectRatio="xMaxYMax meet"
        aria-hidden="true"
        focusable="false"
      >
        <path d={SKYLINE} />
      </svg>
    </header>
  );
}

export default PageBanner;
