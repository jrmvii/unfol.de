// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Tenant } from "@prisma/client";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { apiJson } from "@/lib/api-client";
import type { SettingsFormState } from "./settings/types";
import type { FontSource, PortfolioLayout, OverlayPosition, OverlayAnimation, TransitionStyle } from "@/lib/schemas";
import { HeroMediaSection } from "./settings/hero-media-section";
import { GeneralSection } from "./settings/general-section";
import { BrandingSection } from "./settings/branding-section";
import { LayoutSection } from "./settings/layout-section";
import { OverlaySection } from "./settings/overlay-section";
import { SocialLinksSection } from "./settings/social-links-section";

const TABS = [
  { id: "general", label: "Général" },
  { id: "appearance", label: "Apparence" },
  { id: "layout", label: "Mise en page" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsForm({
  tenant,
  pages = [],
  canUseDomain = false,
}: {
  tenant: Tenant;
  pages?: { id: string; title: string }[];
  canUseDomain?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [form, setForm] = useState<SettingsFormState>({
    name: tenant.name,
    bio: tenant.bio || "",
    email: tenant.email || "",
    domain: tenant.domain || "",
    primaryColor: tenant.primaryColor,
    bgColor: tenant.bgColor,
    fontFamily: tenant.fontFamily,
    fontSource: tenant.fontSource as FontSource,
    portfolioLayout: tenant.portfolioLayout as PortfolioLayout,
    homePosition: tenant.homePosition as OverlayPosition,
    navPosition: tenant.navPosition as OverlayPosition,
    titlePosition: tenant.titlePosition as OverlayPosition,
    aboutPosition: tenant.aboutPosition as OverlayPosition,
    aboutPageId: tenant.aboutPageId || "",
    homePageId: tenant.homePageId || "",
    overlayAnimation: tenant.overlayAnimation as OverlayAnimation,
    navAutoExpand: tenant.navAutoExpand,
    navLabel: tenant.navLabel,
    aboutLabel: tenant.aboutLabel,
    transitionStyle: tenant.transitionStyle as TransitionStyle,
    heroDuration: tenant.heroDuration,
    instagramUrl: tenant.instagramUrl || "",
    behanceUrl: tenant.behanceUrl || "",
    linkedinUrl: tenant.linkedinUrl || "",
    websiteUrl: tenant.websiteUrl || "",
  });

  function update<K extends keyof SettingsFormState>(
    field: K,
    value: SettingsFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await apiJson("/api/tenant", "PUT", form);
    if (!error) {
      toast("Settings saved");
    } else {
      toast(error, "error");
    }

    setSaving(false);
    router.refresh();
  }

  const sectionProps = { form, update, setForm };

  return (
    <form
      onSubmit={handleSave}
      className="bg-white rounded-lg shadow-sm max-w-2xl"
    >
      <div className="flex border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-gray-900 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-6">
        {activeTab === "general" && (
          <>
            <GeneralSection {...sectionProps} canUseDomain={canUseDomain} />
            <SocialLinksSection {...sectionProps} />
          </>
        )}

        {activeTab === "appearance" && (
          <>
            <HeroMediaSection initialLogoUrl={tenant.logoUrl || ""} />
            <BrandingSection {...sectionProps} />
          </>
        )}

        {activeTab === "layout" && (
          <>
            <LayoutSection {...sectionProps} pages={pages} />
            <OverlaySection {...sectionProps} pages={pages} />
          </>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Spinner />}
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
  );
}
