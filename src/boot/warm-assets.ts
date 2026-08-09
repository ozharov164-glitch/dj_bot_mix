import arrowLeft from "../assets/icons/arrow-left-v1.png";
import check from "../assets/icons/check-v1.png";
import chevronDown from "../assets/icons/chevron-down-v1.png";
import chevronRight from "../assets/icons/chevron-right-v1.png";
import chevronUp from "../assets/icons/chevron-up-v1.png";
import close from "../assets/icons/close-v1.png";
import fx from "../assets/icons/fx-v1.png";
import mix from "../assets/icons/mix-v1.png";
import plus from "../assets/icons/plus-v1.png";
import projects from "../assets/icons/projects-v1.png";
import trash from "../assets/icons/trash-v1.png";
import upload from "../assets/icons/upload-v1.png";
import brand from "../assets/brand/fadeline-signal-v1.png";

const ICON_URLS = [
  arrowLeft,
  check,
  chevronDown,
  chevronRight,
  chevronUp,
  close,
  fx,
  mix,
  plus,
  projects,
  trash,
  upload,
  brand,
];

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

/** Warm raster pack so dock/list icons never flash empty mid-session. */
export async function warmChromeAssets(): Promise<void> {
  await Promise.all(ICON_URLS.map(preloadImage));
}
