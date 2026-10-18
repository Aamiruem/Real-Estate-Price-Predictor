import { useEffect, useState } from "react";
import "./HeroMedia.css";

// Drop a looping clip at public/media/estateiq-hero.mp4 to enable video.
const VIDEO_SRC = "/media/estateiq-hero.mp4";

let videoAvailable; // cached across pages: undefined = unknown

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Background photo with a slow cinematic zoom, upgraded to a muted looping
 * video when the clip exists. Decorative only (aria-hidden).
 */
function HeroMedia({ image, className = "", position = "center" }) {
  const [showVideo, setShowVideo] = useState(videoAvailable === true);

  useEffect(() => {
    if (videoAvailable !== undefined || prefersReducedMotion()) return undefined;
    let active = true;

    // The dev server answers missing files with index.html, so check the type.
    fetch(VIDEO_SRC, { method: "HEAD" })
      .then((response) => {
        const type = response.headers.get("content-type") || "";
        videoAvailable = response.ok && type.startsWith("video/");
      })
      .catch(() => {
        videoAvailable = false;
      })
      .finally(() => {
        if (active) setShowVideo(videoAvailable === true);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={`hm-media ${className}`} aria-hidden="true">
      <img
        className="hm-image"
        src={image}
        alt=""
        style={{ objectPosition: position }}
        decoding="async"
      />
      {showVideo && !prefersReducedMotion() && (
        <video
          className="hm-video"
          src={VIDEO_SRC}
          poster={image}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setShowVideo(false)}
        />
      )}
    </div>
  );
}

export default HeroMedia;
