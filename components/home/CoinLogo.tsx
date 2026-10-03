"use client";

import Image from "next/image";
import { useState } from "react";

// A coin logo loaded straight from CoinGecko (as the tier-list tool does).
// If it fails, it removes itself so the monogram behind it shows instead of
// a broken image. next/image re-fires errors that happen before hydration.
export default function CoinLogo({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Image
      src={src}
      alt=""
      width={34}
      height={34}
      unoptimized
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
