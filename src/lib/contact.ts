export const WA_NUMBER = "919000090000";
export const PHONE_TEL = "+919000090000";
export const DEFAULT_WA_TEXT = "Hi Sri Mathru Driving School! I'm interested in learning to drive. Please share details.";

export function waLink(text = DEFAULT_WA_TEXT) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}
