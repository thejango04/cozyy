import { Schedule } from "./types";

const STORAGE_KEY = "cozyy-schedules";

export function getSchedules(): Schedule[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSchedule(schedule: Schedule): void {
  const schedules = getSchedules();
  schedules.push(schedule);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
}

export function updateSchedule(schedule: Schedule): void {
  const schedules = getSchedules();
  const index = schedules.findIndex((s) => s.id === schedule.id);
  if (index !== -1) {
    schedules[index] = schedule;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
  }
}

export function deleteSchedule(id: string): void {
  const schedules = getSchedules().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
}
