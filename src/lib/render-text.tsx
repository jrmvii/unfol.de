// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import React from "react";

const headingRe = /^(#{1,3})\s?(.*)/;

export function renderTextBlock(content: string): React.ReactNode[] {
  return content.split("\n").map((line, i) => {
    const match = line.match(headingRe);
    if (match) {
      const level = match[1].length;
      const text = match[2];
      if (level === 3)
        return <h3 key={i} className="text-sm font-bold mt-4 mb-1">{text}</h3>;
      if (level === 2)
        return <h2 key={i} className="text-base font-bold mt-5 mb-1">{text}</h2>;
      return <h1 key={i} className="text-lg font-bold mt-6 mb-2">{text}</h1>;
    }
    if (line.trim() === "")
      return <br key={i} />;
    return <p key={i} className="text-sm leading-relaxed">{line}</p>;
  });
}
