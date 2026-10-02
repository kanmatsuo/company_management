import localFont from "next/font/local";

// Fonts are stored in ./fonts so dev and build work without internet.
// Latin subset from Google Fonts. Variable fonts cover their full weight range.

const geist = localFont({ src: "./fonts/geist-latin.woff2", weight: "100 900", variable: "--font-geist" });
const geistMono = localFont({ src: "./fonts/geist-mono-latin.woff2", weight: "100 900", variable: "--font-geist-mono" });
const inter = localFont({ src: "./fonts/inter-latin.woff2", weight: "100 900", variable: "--font-inter" });
const notoSans = localFont({ src: "./fonts/noto-sans-latin.woff2", weight: "100 900", variable: "--font-noto-sans" });
const nunitoSans = localFont({ src: "./fonts/nunito-sans-latin.woff2", weight: "200 1000", variable: "--font-nunito-sans" });
const figtree = localFont({ src: "./fonts/figtree-latin.woff2", weight: "300 900", variable: "--font-figtree" });
const roboto = localFont({
  src: [
    { path: "./fonts/roboto-latin-400.woff2", weight: "400" },
    { path: "./fonts/roboto-latin-500.woff2", weight: "500" },
    { path: "./fonts/roboto-latin-700.woff2", weight: "700" },
  ],
  variable: "--font-roboto",
});
const raleway = localFont({ src: "./fonts/raleway-latin.woff2", weight: "100 900", variable: "--font-raleway" });
const dmSans = localFont({ src: "./fonts/dm-sans-latin.woff2", weight: "100 1000", variable: "--font-dm-sans" });
const publicSans = localFont({ src: "./fonts/public-sans-latin.woff2", weight: "100 900", variable: "--font-public-sans" });
const outfit = localFont({ src: "./fonts/outfit-latin.woff2", weight: "100 900", variable: "--font-outfit" });
const jetBrainsMono = localFont({ src: "./fonts/jetbrains-mono-latin.woff2", weight: "100 800", variable: "--font-jetbrains-mono" });
const notoSerif = localFont({
  src: "./fonts/noto-serif-latin.woff2",
  weight: "100 900",
  variable: "--font-noto-serif",
  adjustFontFallback: "Times New Roman",
});
const robotoSlab = localFont({
  src: [
    { path: "./fonts/roboto-slab-latin-400.woff2", weight: "400" },
    { path: "./fonts/roboto-slab-latin-500.woff2", weight: "500" },
    { path: "./fonts/roboto-slab-latin-700.woff2", weight: "700" },
  ],
  variable: "--font-roboto-slab",
  adjustFontFallback: "Times New Roman",
});
const merriweather = localFont({
  src: [
    { path: "./fonts/merriweather-latin-400.woff2", weight: "400" },
    { path: "./fonts/merriweather-latin-700.woff2", weight: "700" },
  ],
  variable: "--font-merriweather",
  adjustFontFallback: "Times New Roman",
});
const lora = localFont({
  src: "./fonts/lora-latin.woff2",
  weight: "400 700",
  variable: "--font-lora",
  adjustFontFallback: "Times New Roman",
});
const playfairDisplay = localFont({
  src: "./fonts/playfair-display-latin.woff2",
  weight: "400 900",
  variable: "--font-playfair-display",
  adjustFontFallback: "Times New Roman",
});

export const fontVariables = [
  geist.variable,
  geistMono.variable,
  inter.variable,
  notoSans.variable,
  nunitoSans.variable,
  figtree.variable,
  roboto.variable,
  raleway.variable,
  dmSans.variable,
  publicSans.variable,
  outfit.variable,
  jetBrainsMono.variable,
  notoSerif.variable,
  robotoSlab.variable,
  merriweather.variable,
  lora.variable,
  playfairDisplay.variable,
].join(" ");
