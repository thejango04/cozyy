"use client";

import * as React from "react";
import {
  format,
  startOfDay,
  addDays,
  differenceInCalendarDays,
} from "date-fns";
import { CheckIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useScheduleStore } from "@/lib/store";
import { expandAllItems, toggleInstanceChecked, type ExpandedItem } from "@/lib/expand-items";
import { bucketItems } from "@/lib/bucket-items";

type FilterType = "all" | "deadline" | "task" | "important_date";

// --- Item Card ---

function ItemCard({
  item,
  column,
  onToggleCheck,
}: {
  item: ExpandedItem;
  column: "today" | "next7Days" | "next30Days";
  onToggleCheck: () => void;
}) {
  const checked = item.checked;

  const typeConfig = {
    deadline: { label: "Due", color: "#D94F4F" },
    task: { label: "Task", color: "#6B6560" },
    important_date: { label: "Date", color: "#D4A843" },
  };

  const { label: typeLabel, color: typeColor } = typeConfig[item.type];

  // Date display depends on column
  let dateDisplay: string | null = null;
  if (item.instanceDate) {
    if (column === "next7Days" || column === "next30Days") {
      const base =
        column === "next7Days"
          ? format(item.instanceDate, "EEE, MMM d")
          : format(item.instanceDate, "MMM d");
      const daysAhead = differenceInCalendarDays(
        startOfDay(item.instanceDate),
        startOfDay(new Date())
      );
      const suffix =
        daysAhead === 0
          ? "Today"
          : daysAhead === 1
          ? "1 Day"
          : `${daysAhead} Days`;
      dateDisplay = `${base} – ${suffix}`;
    }
    // Today column: omit date
  }

  return (
    <button
      type="button"
      onClick={onToggleCheck}
      className={cn(
        "w-full text-left rounded-lg border border-cozy-border bg-cozy-surface p-3 transition-all duration-300 cursor-pointer relative group",
        checked
          ? "opacity-40 hover:bg-black/[0.02]"
          : "hover:bg-cozy-accent-light"
      )}
      style={{ borderLeftColor: typeColor, borderLeftWidth: "3px" }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Type badge */}
          <span
            className="inline-block text-[10px] font-ui font-medium uppercase tracking-wider px-1.5 py-0.5 rounded mb-1"
            style={{
              backgroundColor: typeColor + "1A",
              color: typeColor,
            }}
          >
            {typeLabel}
          </span>

          {/* Title */}
          <p
            className={cn(
              "font-sans text-sm text-cozy-text-primary leading-snug",
              checked && "line-through"
            )}
          >
            {item.title || "Untitled"}
          </p>

          {/* Schedule name */}
          <p
            className="text-xs font-ui mt-0.5"
            style={{ color: item.scheduleColor }}
          >
            {item.scheduleTitle}
          </p>

          {/* Date */}
          {dateDisplay && (
            <p className="text-[11px] font-mono text-cozy-text-tertiary mt-0.5">
              {dateDisplay}
            </p>
          )}
        </div>

        {/* Check icon */}
        <div
          className={cn(
            "shrink-0 mt-1 transition-opacity duration-300",
            checked ? "opacity-100" : "opacity-0 group-hover:opacity-30"
          )}
        >
          <CheckIcon className="h-4 w-4 text-cozy-success" />
        </div>
      </div>
    </button>
  );
}

// --- Time Column ---

function TimeColumn({
  title,
  dateRange,
  items,
  filter,
  column,
  onToggleCheck,
}: {
  title: string;
  dateRange: string;
  items: ExpandedItem[];
  filter: FilterType;
  column: "today" | "next7Days" | "next30Days";
  onToggleCheck: (item: ExpandedItem) => void;
}) {
  const filtered =
    filter === "all" ? items : items.filter((i) => i.type === filter);

  const uncheckedCount = filtered.filter((i) => !i.checked).length;

  return (
    <div className="flex flex-col min-h-0">
      {/* Column Header */}
      <div className="flex items-baseline gap-2 mb-4">
        <h3 className="font-sans text-base font-bold text-cozy-text-primary">
          {title}
        </h3>
        {uncheckedCount > 0 && (
          <Badge variant="secondary" className="font-ui text-[11px] px-2 py-0">
            {uncheckedCount}
          </Badge>
        )}
        <span className="text-xs font-ui text-cozy-text-tertiary ml-auto">
          {dateRange}
        </span>
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <p className="text-sm font-sans italic text-cozy-text-tertiary text-center py-12">
          Nothing here — enjoy the breathing room.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              column={column}
              onToggleCheck={() => onToggleCheck(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Main WhatsAhead ---

export function WhatsAhead() {
  const { schedules, toggleItemChecked, bumpCheckVersion, checkVersion } =
    useScheduleStore();
  const [filter, setFilter] = React.useState<FilterType>("all");
  const [mobileTab, setMobileTab] = React.useState<
    "today" | "next7Days" | "next30Days"
  >("today");
  const [, setTick] = React.useState(0);

  // Re-bucket when the day changes
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const expanded = React.useMemo(
    () => expandAllItems(schedules),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schedules, checkVersion]
  );

  const bucketed = React.useMemo(() => bucketItems(expanded), [expanded]);

  const handleToggleCheck = (item: ExpandedItem) => {
    if (item.recurrence !== "none") {
      // Recurring: toggle in separate localStorage set
      toggleInstanceChecked(item.id);
      bumpCheckVersion();
    } else {
      // Non-recurring: toggle on the ScheduleItem directly
      toggleItemChecked(item.scheduleId, item.itemId);
    }
  };

  // Date range strings
  const now = new Date();
  const todayStr = format(now, "MMM d");

  const tomorrow = addDays(startOfDay(now), 1);
  const day7 = addDays(startOfDay(now), 6);
  const next7Str = `${format(tomorrow, "MMM d")}–${format(day7, "MMM d")}`;

  const day8 = addDays(startOfDay(now), 7);
  const day30 = addDays(startOfDay(now), 29);
  const next30Str = `${format(day8, "MMM d")}–${format(day30, "MMM d")}`;

  const tabs = [
    { key: "today" as const, label: "Today" },
    { key: "next7Days" as const, label: "Next 7 Days" },
    { key: "next30Days" as const, label: "Next 30 Days" },
  ];

  return (
    <div className="w-full px-6 pt-8 pb-16">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl tracking-tight text-cozy-text-primary">
          What&apos;s Ahead
        </h2>
        <Select
          value={filter}
          onValueChange={(val) => setFilter(val as FilterType)}
        >
          <SelectTrigger className="w-auto font-ui text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="deadline">Deadlines</SelectItem>
            <SelectItem value="task">Tasks</SelectItem>
            <SelectItem value="important_date">Important Dates</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Three columns */}
      <div className="hidden lg:grid grid-cols-3 gap-4">
        <TimeColumn
          title="Today"
          dateRange={todayStr}
          items={bucketed.today}
          filter={filter}
          column="today"
          onToggleCheck={handleToggleCheck}
        />
        <TimeColumn
          title="Next 7 Days"
          dateRange={next7Str}
          items={bucketed.next7Days}
          filter={filter}
          column="next7Days"
          onToggleCheck={handleToggleCheck}
        />
        <TimeColumn
          title="Next 30 Days"
          dateRange={next30Str}
          items={bucketed.next30Days}
          filter={filter}
          column="next30Days"
          onToggleCheck={handleToggleCheck}
        />
      </div>

      {/* Tablet: 2+1 layout */}
      <div className="hidden md:grid lg:hidden grid-cols-2 gap-4">
        <TimeColumn
          title="Today"
          dateRange={todayStr}
          items={bucketed.today}
          filter={filter}
          column="today"
          onToggleCheck={handleToggleCheck}
        />
        <TimeColumn
          title="Next 7 Days"
          dateRange={next7Str}
          items={bucketed.next7Days}
          filter={filter}
          column="next7Days"
          onToggleCheck={handleToggleCheck}
        />
        <div className="col-span-2">
          <TimeColumn
            title="Next 30 Days"
            dateRange={next30Str}
            items={bucketed.next30Days}
            filter={filter}
            column="next30Days"
            onToggleCheck={handleToggleCheck}
          />
        </div>
      </div>

      {/* Mobile: Tabbed view */}
      <div className="md:hidden">
        <div className="flex border-b border-cozy-border mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMobileTab(tab.key)}
              className={cn(
                "flex-1 py-2 text-sm font-ui font-medium transition-colors duration-200 border-b-2",
                mobileTab === tab.key
                  ? "border-cozy-accent text-cozy-accent"
                  : "border-transparent text-cozy-text-tertiary hover:text-cozy-text-secondary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mobileTab === "today" && (
          <TimeColumn
            title="Today"
            dateRange={todayStr}
            items={bucketed.today}
            filter={filter}
            column="today"
            onToggleCheck={handleToggleCheck}
          />
        )}
        {mobileTab === "next7Days" && (
          <TimeColumn
            title="Next 7 Days"
            dateRange={next7Str}
            items={bucketed.next7Days}
            filter={filter}
            column="next7Days"
            onToggleCheck={handleToggleCheck}
          />
        )}
        {mobileTab === "next30Days" && (
          <TimeColumn
            title="Next 30 Days"
            dateRange={next30Str}
            items={bucketed.next30Days}
            filter={filter}
            column="next30Days"
            onToggleCheck={handleToggleCheck}
          />
        )}
      </div>
    </div>
  );
}
