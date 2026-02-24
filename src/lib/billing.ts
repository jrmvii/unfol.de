// Copyright (c) 2026 Jérémy Vtipil
// Licensed under the GNU Affero General Public License v3.0

import { db } from "./db";

export const FREE_PLAN_SLUG = "self-hosted";

export interface PlanLimits {
  maxProjects: number;
  maxStorageMb: number;
  maxPages: number;
  customDomain: boolean;
  removeBranding: boolean;
}

export interface Usage {
  projects: number;
  storageMb: number;
  pages: number;
}

export async function getPlanLimits(
  _tenantId?: string
): Promise<PlanLimits> {
  return {
    maxProjects: -1,
    maxStorageMb: -1,
    maxPages: -1,
    customDomain: true,
    removeBranding: true,
  };
}

export async function getUsage(tenantId: string): Promise<Usage> {
  const [projectCount, pageCount, storageResult] = await Promise.all([
    db.project.count({ where: { tenantId } }),
    db.page.count({ where: { tenantId } }),
    db.media.aggregate({
      where: { project: { tenantId } },
      _sum: { sizeBytes: true },
    }),
  ]);

  return {
    projects: projectCount,
    pages: pageCount,
    storageMb:
      Math.round(
        ((storageResult._sum.sizeBytes || 0) / 1024 / 1024) * 10
      ) / 10,
  };
}

export class PlanLimitError extends Error {
  public readonly resource: string;
  public readonly limit: number;
  public readonly current: number;

  constructor(resource: string, limit: number, current: number) {
    super(`Plan limit reached: ${resource}.`);
    this.name = "PlanLimitError";
    this.resource = resource;
    this.limit = limit;
    this.current = current;
  }
}

export async function enforcePlanLimit(
  _tenantId: string,
  _resource: "projects" | "pages" | "storage"
): Promise<void> {
  // Self-hosted: no limits enforced
}

export async function getBillingStatus(tenantId: string) {
  const [limits, usage] = await Promise.all([
    getPlanLimits(tenantId),
    getUsage(tenantId),
  ]);

  return {
    plan: "self-hosted",
    planLabel: "Self-hosted",
    status: "active",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    stripeCustomerId: null,
    limits,
    usage,
  };
}
