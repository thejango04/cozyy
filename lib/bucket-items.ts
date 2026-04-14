import {
  isToday,
  isAfter,
  isBefore,
  startOfDay,
  addDays,
} from "date-fns";
import { ExpandedItem } from "./expand-items";

export interface BucketedItems {
  today: ExpandedItem[];
  next7Days: ExpandedItem[];
  next30Days: ExpandedItem[];
}

const TYPE_PRIORITY: Record<string, number> = {
  deadline: 0,
  important_date: 1,
  task: 2,
};

function sortItems(items: ExpandedItem[]): ExpandedItem[] {
  return [...items].sort((a, b) => {
    // Unchecked first
    if (a.checked !== b.checked) return a.checked ? 1 : -1;

    // By date ascending (nulls last)
    if (a.instanceDate && b.instanceDate) {
      const diff = a.instanceDate.getTime() - b.instanceDate.getTime();
      if (diff !== 0) return diff;
    } else if (a.instanceDate && !b.instanceDate) {
      return -1;
    } else if (!a.instanceDate && b.instanceDate) {
      return 1;
    }

    // By type priority
    return (TYPE_PRIORITY[a.type] ?? 2) - (TYPE_PRIORITY[b.type] ?? 2);
  });
}

export function bucketItems(items: ExpandedItem[]): BucketedItems {
  const now = new Date();
  const todayStart = startOfDay(now);
  const day7End = startOfDay(addDays(now, 7));   // exclusive: days 1–7 after today
  const day30End = startOfDay(addDays(now, 30)); // exclusive: days 8–30 after today

  const today: ExpandedItem[] = [];
  const next7Days: ExpandedItem[] = [];
  const next30Days: ExpandedItem[] = [];

  for (const item of items) {
    // Skip past items
    if (item.instanceDate && isBefore(item.instanceDate, todayStart)) {
      continue;
    }

    // Undated tasks go to Today
    if (!item.instanceDate) {
      today.push(item);
      continue;
    }

    if (isToday(item.instanceDate)) {
      today.push(item);
    } else if (
      isAfter(item.instanceDate, todayStart) &&
      isBefore(item.instanceDate, day7End)
    ) {
      next7Days.push(item);
    } else if (
      (isAfter(item.instanceDate, day7End) || item.instanceDate.getTime() === day7End.getTime()) &&
      isBefore(item.instanceDate, day30End)
    ) {
      next30Days.push(item);
    }
    // Items beyond 30 days are not shown
  }

  return {
    today: sortItems(today),
    next7Days: sortItems(next7Days),
    next30Days: sortItems(next30Days),
  };
}
