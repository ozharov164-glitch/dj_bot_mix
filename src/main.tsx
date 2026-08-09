import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

/** Keep the Telegram canvas fixed without interfering with normal scrolling/forms. */
function installStaticInteractionGuards() {
  const prevent = (event: Event) => event.preventDefault();
  const preventPinch = (event: TouchEvent) => {
    if (event.touches.length > 1) event.preventDefault();
  };
  const preventBrowserZoom = (event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey) event.preventDefault();
  };

  document.addEventListener("gesturestart", prevent, { passive: false });
  document.addEventListener("gesturechange", prevent, { passive: false });
  document.addEventListener("gestureend", prevent, { passive: false });
  document.addEventListener("touchmove", preventPinch, { passive: false });
  document.addEventListener("wheel", preventBrowserZoom, { passive: false });
  document.addEventListener("copy", prevent);
}

installStaticInteractionGuards();

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element #root not found");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
