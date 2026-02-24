// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://unfol.de"),
  title: {
    default: "unfol.de — Portfolio sites for artists",
    template: "%s | unfol.de",
  },
  description:
    "Gallery-quality portfolio sites. Self-hosted. $0/site. Your art deserves its own stage.",
  openGraph: {
    title: "unfol.de — Portfolio sites for artists",
    description:
      "Gallery-quality portfolio sites. Self-hosted. $0/site. Your art deserves its own stage.",
    siteName: "unfol.de",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "unfol.de — Portfolio sites for artists",
    description:
      "Gallery-quality portfolio sites. Self-hosted. $0/site.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
