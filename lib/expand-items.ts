import {
  parseISO,
  addDays,
  addWeeks,
  addMonths,
  isBefore,
  isEqual,
  startOfDay,
} from "date-fns";
import { Schedule, ScheduleItem } from "./types";

export interface ExpandedItem {
  id: string; // unique per instance
  itemId: string; // original ScheduleItem.id
  instanceDate: Date | null; // null for undated tasks
  type: "deadline" | "task" | "important_date";
  title: string;
  checked: boolean;
  recurrence: string;
  scheduleId: string;
  scheduleTitle: string;
  scheduleColor: string;
}

const CHECKED_KEY = "cozyy-checked";

function getCheckedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(CHECKED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveCheckedSet(set: Set<string>): void {
  localStorage.setItem(CHECKED_KEY, JSON.stringify([...set]));
}

export function isInstanceChecked(instanceId: string): boolean {
  return getCheckedSet().has(instanceId);
}

export function toggleInstanceChecked(instanceId: string): void {
  const set = getCheckedSet();
  if (set.has(instanceId)) {
    set.delete(instanceId);
  } else {
    set.add(instanceId);
  }
  saveCheckedSet(set);
}

function generateRecurringDates(
  startDate: Date,
  endDate: Date,
  recurrence: string
): Date[] {
  const dates: Date[] = [];
  let current = startOfDay(startDate);
  const end = startOfDay(endDate);

  while (isBefore(current, end) || isEqual(current, end)) {
    dates.push(current);
    switch (recurrence) {
      case "daily":
        current = addDays(current, 1);
        break;
      case "weekly":
        current = addWeeks(current, 1);
        break;
      case "biweekly":
        current = addWeeks(current, 2);
        break;
      case "monthly":
        current = addMonths(current, 1);
        break;
      default:
        return dates;
    }
  }

  return dates;
}

export function expandAllItems(schedules: Schedule[]): ExpandedItem[] {
  const checkedSet = getCheckedSet();
  const items: ExpandedItem[] = [];

  for (const schedule of schedules) {
    const scheduleEnd = parseISO(schedule.dateTo);

    for (const item of schedule.items) {
      if (item.recurrence === "none" || !item.recurrence) {
        // Non-recurring item
        const instanceId = item.id;
        items.push({
          id: instanceId,
          itemId: item.id,
          instanceDate: item.date ? startOfDay(parseISO(item.date)) : null,
          type: item.type,
          title: item.title,
          checked: item.checked,
          recurrence: item.recurrence || "none",
          scheduleId: schedule.id,
          scheduleTitle: schedule.title,
          scheduleColor: schedule.color,
        });
      } else {
        // Recurring item — expand into instances
        if (!item.date) continue;
        const startDate = parseISO(item.date);
        const dates = generateRecurringDates(startDate, scheduleEnd, item.recurrence);

        for (const date of dates) {
          const instanceId = `${item.id}-${date.toISOString().split("T")[0]}`;
          items.push({
            id: instanceId,
            itemId: item.id,
            instanceDate: date,
            type: item.type,
            title: item.title,
            checked: checkedSet.has(instanceId),
            recurrence: item.recurrence,
            scheduleId: schedule.id,
            scheduleTitle: schedule.title,
            scheduleColor: schedule.color,
          });
        }
      }
    }
  }

  return items;
}
