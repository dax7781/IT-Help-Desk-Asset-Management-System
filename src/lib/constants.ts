export const roles = ["EMPLOYEE", "TECHNICIAN", "ADMIN"] as const;
export type Role = (typeof roles)[number];
export const assetTypes = [
  "LAPTOP",
  "DESKTOP",
  "MONITOR",
  "PRINTER",
  "NETWORK_DEVICE",
  "OTHER",
] as const;
export const assetStatuses = [
  "AVAILABLE",
  "ASSIGNED",
  "UNDER_REPAIR",
  "RETIRED",
] as const;
export const statuses = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;
export const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const categories = [
  "HARDWARE",
  "SOFTWARE",
  "NETWORK",
  "ACCESS",
  "OTHER",
] as const;
export function label(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
