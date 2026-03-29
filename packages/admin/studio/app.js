// This file is auto-generated from "atria dev".
// Modifications to this file are automatically discarded.

const hasSession = () => false;

const bootstrapStudio = () => {
  // Minimal admin runtime entry placeholder.
};

if (!hasSession()) {
  document.body.textContent = "Studio locked";
} else {
  bootstrapStudio();
}
