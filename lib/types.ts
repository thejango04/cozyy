export interface ScheduleItem {
  id: string;
  type: "deadline" | "task" | "important_date";
  title: string;
  date: string | null; // ISO date string, no time
  recurrence: "none" | "daily" | "weekly" | "biweekly" | "monthly";
  checked: boolean;
  createdAt: string; // ISO timestamp
}

export interface Schedule {
  id: string;
  title: string;
  description: string | null;
  dateFrom: string; // ISO date string, no time
  dateTo: string; // ISO date string, no time
  color: string; // hex
  items: ScheduleItem[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export const COLOR_PRESETS = [
  { value: "#C15F3C", label: "Terracotta" },
  { value: "#5B8FB9", label: "Slate Blue" },
  { value: "#4A9E6D", label: "Forest" },
  { value: "#D4A843", label: "Amber" },
  { value: "#7C6DAF", label: "Muted Purple" },
  { value: "#C9735B", label: "Salmon" },
  { value: "#3D7A8A", label: "Teal" },
  { value: "#8B6E4E", label: "Warm Brown" },
] as const;
