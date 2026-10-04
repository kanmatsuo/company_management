import localFont from "next/font/local";

// Sole UI font (sans + mono). To switch the whole app later, change only `src`
// (e.g. "./fonts/my-font.ttf") and adjust `weight` if it is not a variable font.
const appFont = localFont({
  src: "./fonts/geist-latin.woff2",
  weight: "100 900",
  variable: "--font-app",
});

export const fontVariables = appFont.variable;
