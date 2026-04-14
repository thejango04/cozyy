import { create } from "zustand";
import { Schedule } from "./types";
import {
  getSchedules,
  saveSchedule as storageSave,
  updateSchedule as storageUpdate,
  deleteSchedule as storageDelete,
} from "./storage";
import { startOfMonth } from "date-fns";

export type Duration = "1M" | "3M" | "6M" | "12M";

const ORDER_KEY = "cozyy-bar-order";

function getBarOrder(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBarOrder(order: string[]): void {
  localStorage.setItem(ORDER_KEY, JSON.stringify(order));
}

export function getOrderedSchedules(schedules: Schedule[]): Schedule[] {
  const order = getBarOrder();
  if (order.length === 0) return schedules;
  const map = new Map(schedules.map((s) => [s.id, s]));
  const ordered: Schedule[] = [];
  for (const id of order) {
    const s = map.get(id);
    if (s) {
      ordered.push(s);
      map.delete(id);
    }
  }
  // Append any schedules not in the saved order
  for (const s of map.values()) {
    ordered.push(s);
  }
  return ordered;
}

interface ScheduleStore {
  schedules: Schedule[];
  selectedDuration: Duration;
  viewStartDate: Date;
  modalOpen: boolean;
  editingSchedule: Schedule | null;
  checkVersion: number;
  barOrder: string[];

  loadSchedules: () => void;
  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (schedule: Schedule) => void;
  deleteSchedule: (id: string) => void;
  setDuration: (duration: Duration) => void;
  setViewStartDate: (date: Date) => void;
  openModal: (schedule?: Schedule) => void;
  closeModal: () => void;
  toggleItemChecked: (scheduleId: string, itemId: string) => void;
  bumpCheckVersion: () => void;
  reorderBars: (orderedIds: string[]) => void;
}

export const useScheduleStore = create<ScheduleStore>((set) => ({
  schedules: [],
  selectedDuration: "3M",
  viewStartDate: startOfMonth(new Date()),
  modalOpen: false,
  editingSchedule: null,
  checkVersion: 0,
  barOrder: [],

  loadSchedules: () => {
    set({ schedules: getSchedules(), barOrder: getBarOrder() });
  },

  addSchedule: (schedule) => {
    storageSave(schedule);
    set({ schedules: getSchedules() });
  },

  updateSchedule: (schedule) => {
    storageUpdate(schedule);
    set({ schedules: getSchedules() });
  },

  deleteSchedule: (id) => {
    storageDelete(id);
    set({ schedules: getSchedules() });
  },

  setDuration: (duration) => {
    set({ selectedDuration: duration });
  },

  setViewStartDate: (date) => {
    set({ viewStartDate: date });
  },

  openModal: (schedule) => {
    set({
      modalOpen: true,
      editingSchedule: schedule || null,
    });
  },

  closeModal: () => {
    set({ modalOpen: false, editingSchedule: null });
  },

  toggleItemChecked: (scheduleId, itemId) => {
    const schedules = getSchedules();
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;
    const item = schedule.items.find((i) => i.id === itemId);
    if (!item) return;
    item.checked = !item.checked;
    storageUpdate(schedule);
    set({ schedules: getSchedules() });
  },

  bumpCheckVersion: () => {
    set((state) => ({ checkVersion: state.checkVersion + 1 }));
  },

  reorderBars: (orderedIds) => {
    saveBarOrder(orderedIds);
    set({ barOrder: orderedIds });
  },
}));
