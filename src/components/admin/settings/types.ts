// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import type {
  FontSource,
  PortfolioLayout,
  OverlayPosition,
  OverlayAnimation,
  TransitionStyle,
} from "@/lib/schemas";

export type SettingsFormState = {
  name: string;
  bio: string;
  email: string;
  domain: string;
  primaryColor: string;
  bgColor: string;
  fontFamily: string;
  fontSource: FontSource;
  portfolioLayout: PortfolioLayout;
  homePosition: OverlayPosition;
  navPosition: OverlayPosition;
  titlePosition: OverlayPosition;
  aboutPosition: OverlayPosition;
  aboutPageId: string;
  homePageId: string;
  overlayAnimation: OverlayAnimation;
  navAutoExpand: boolean;
  navLabel: string;
  aboutLabel: string;
  transitionStyle: TransitionStyle;
  heroDuration: number;
  instagramUrl: string;
  behanceUrl: string;
  linkedinUrl: string;
  websiteUrl: string;
};

export type SectionProps = {
  form: SettingsFormState;
  update: <K extends keyof SettingsFormState>(
    field: K,
    value: SettingsFormState[K]
  ) => void;
  setForm: React.Dispatch<React.SetStateAction<SettingsFormState>>;
};
