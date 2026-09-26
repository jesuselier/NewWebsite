import { Newsreader } from "next/font/google";

// Editorial display serif for the homepage. Inter remains the site's text font.
// Loaded only where the homepage uses it, so other pages keep their payload.
export const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});
