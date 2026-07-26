import type { TFunction } from "i18next";

type Role = "LEARNER" | "MANAGER";
type ExperienceLevel = "JUNIOR" | "MID" | "SENIOR";

/** Translates a stored enum value to a display label. The enum value itself never changes. */
export function getRoleLabel(t: TFunction, role: Role): string {
  return t(`enums.role.${role}`);
}

export function getExperienceLevelLabel(t: TFunction, level: ExperienceLevel): string {
  return t(`enums.experienceLevel.${level}`);
}

export function getDepartmentLabel(t: TFunction, department: string): string {
  return t(`enums.department.${department}`, { defaultValue: department });
}
