import HeroMedia from "./HeroMedia";
import { BannerIcon } from "./PageBanner";
import "./AuthMedia.css";

const CHECK = "M5 12.5 10 17 19 7";

/** Photo side panel for the sign-in and sign-up pages. */
function AuthMedia({ image, eyebrow, title, accent, points }) {
  return (
    <aside className="auth-media" aria-hidden="false">
      <HeroMedia image={image} position="center 40%" />
      <div className="auth-media-shade" aria-hidden="true" />
      <div className="auth-media-content">
        <span className="pb-badge">{eyebrow}</span>
        <h2>
          {title} <span className="pb-accent">{accent}</span>
        </h2>
        <ul>
          {points.map((point) => (
            <li key={point}>
              <span className="auth-media-check" aria-hidden="true">
                <BannerIcon path={CHECK} />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default AuthMedia;
