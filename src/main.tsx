import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig, MotionGlobalConfig } from "framer-motion";
import App from "./App";
import "./index.css";

// ?instant turns off animations (for automated testing and reproducible screenshots).
if (new URLSearchParams(location.search).has("instant")) MotionGlobalConfig.skipAnimations = true;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
);
