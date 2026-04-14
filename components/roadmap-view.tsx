"use client";

import * as React from "react";
import {
  format,
  addMonths,
  parseISO,
  startOfMonth,
  eachMonthOfInterval,
  eachWeekOfInterval,
  isWithinInterval,
  isBefore,
  isAfter,
  startOfWeek,
  differenceInDays,
} from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScheduleStore, getOrderedSchedules, type Duration } from "@/lib/store";
import { Schedule, ScheduleItem } from "@/lib/types";
import { ThemeToggle } from "@/components/theme-toggle";

// --- Date math helpers ---

function getViewRange(startDate: Date, duration: Duration) {
  const months = duration === "1M" ? 1 : duration === "3M" ? 3 : duration === "6M" ? 6 : 12;
  return { start: startDate, end: addMonths(startDate, months) };
}

function dateToPercent(date: Date, viewStart: Date, viewEnd: Date): number {
  const totalMs = viewEnd.getTime() - viewStart.getTime();
  const dateMs = date.getTime() - viewStart.getTime();
  return (dateMs / totalMs) * 100;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(Math.max(value, min), max);
}

function getTextColor(bgHex: string): string {
  const r = parseInt(bgHex.slice(1, 3), 16);
  const g = parseInt(bgHex.slice(3, 5), 16);
  const b = parseInt(bgHex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1A1A1A" : "#FFFFFF";
}

// --- Duration Toggle ---

const DURATIONS: Duration[] = ["1M", "3M", "6M", "12M"];

function DurationToggle() {
  const { selectedDuration, setDuration } = useScheduleStore();

  return (
    <div className="flex rounded-lg border border-cozy-border overflow-hidden">
      {DURATIONS.map((d) => (
        <button
          key={d}
          onClick={() => setDuration(d)}
          className={cn(
            "px-3 py-1.5 text-[13px] font-medium font-ui transition-colors duration-200",
            selectedDuration === d
              ? "bg-cozy-accent text-white"
              : "text-cozy-text-secondary hover:bg-cozy-accent-light"
          )}
        >
          {d}
        </button>
      ))}
    </div>
  );
}

// --- Time Axis Labels ---

function TimeAxis({
  viewStart,
  viewEnd,
  duration,
}: {
  viewStart: Date;
  viewEnd: Date;
  duration: Duration;
}) {
  if (duration === "1M") {
    const days = differenceInDays(viewEnd, viewStart);
    const labels: { date: Date; label: string; bold: boolean; pct: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(viewStart);
      d.setDate(d.getDate() + i);
      const isFirst = d.getDate() === 1;
      const dayOfWeek = d.getDay();
      const isMon = dayOfWeek === 1;
      // Show every few days to avoid clutter
      if (isFirst || isMon || i === 0) {
        labels.push({
          date: d,
          label: isFirst ? format(d, "MMM d") : String(d.getDate()),
          bold: isFirst || isMon,
          pct: dateToPercent(d, viewStart, viewEnd),
        });
      }
    }
    return (
      <div className="relative h-5 w-full">
        {labels.map((l, i) => (
          <span
            key={i}
            className={cn(
              "absolute top-0 text-[11px] font-mono text-cozy-text-tertiary -translate-x-1/2",
              l.bold && "font-bold text-cozy-text-secondary"
            )}
            style={{ left: `${l.pct}%` }}
          >
            {l.label}
          </span>
        ))}
      </div>
    );
  }

  if (duration === "3M") {
    const months = eachMonthOfInterval({ start: viewStart, end: addMonths(viewEnd, -1) });
    return (
      <div className="relative h-5 w-full">
        {months.map((m) => {
          const pct = dateToPercent(m, viewStart, viewEnd);
          const mid15 = new Date(m);
          mid15.setDate(15);
          const pct15 = dateToPercent(mid15, viewStart, viewEnd);
          return (
            <React.Fragment key={m.toISOString()}>
              <span
                className="absolute top-0 text-[11px] font-mono text-cozy-text-secondary font-medium -translate-x-1/2"
                style={{ left: `${pct}%` }}
              >
                {format(m, "MMM")}
              </span>
              <span
                className="absolute top-0 text-[11px] font-mono text-cozy-text-tertiary -translate-x-1/2"
                style={{ left: `${pct15}%` }}
              >
                15
              </span>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // 6M and 12M — month names centered
  const months = eachMonthOfInterval({ start: viewStart, end: addMonths(viewEnd, -1) });
  return (
    <div className="relative h-5 w-full">
      {months.map((m) => {
        const mStart = dateToPercent(m, viewStart, viewEnd);
        const mEnd = dateToPercent(addMonths(m, 1), viewStart, viewEnd);
        const mid = (mStart + mEnd) / 2;
        return (
          <span
            key={m.toISOString()}
            className="absolute top-0 text-[11px] font-mono text-cozy-text-tertiary -translate-x-1/2"
            style={{ left: `${mid}%` }}
          >
            {format(m, duration === "12M" ? "MMM" : "MMMM")}
          </span>
        );
      })}
    </div>
  );
}

// --- Grid Stripes ---

function GridStripes({
  viewStart,
  viewEnd,
  duration,
}: {
  viewStart: Date;
  viewEnd: Date;
  duration: Duration;
}) {
  let intervals: Date[];

  if (duration === "1M") {
    intervals = eachWeekOfInterval({ start: viewStart, end: viewEnd }, { weekStartsOn: 1 });
  } else if (duration === "3M") {
    // biweekly: every other week
    const weeks = eachWeekOfInterval({ start: viewStart, end: viewEnd }, { weekStartsOn: 1 });
    intervals = weeks.filter((_, i) => i % 2 === 0);
  } else {
    intervals = eachMonthOfInterval({ start: viewStart, end: addMonths(viewEnd, -1) });
  }

  return (
    <>
      {intervals.map((intervalStart, i) => {
        if (i % 2 !== 1) return null;
        const left = clamp(dateToPercent(intervalStart, viewStart, viewEnd));
        const nextInterval = intervals[i + 1];
        const right = nextInterval
          ? clamp(dateToPercent(nextInterval, viewStart, viewEnd))
          : 100;
        return (
          <div
            key={i}
            className="absolute inset-y-0"
            style={{
              left: `${left}%`,
              width: `${right - left}%`,
              backgroundColor: "rgba(128,128,128,0.06)",
            }}
          />
        );
      })}
    </>
  );
}

// --- Schedule Bar ---

const BAR_HEIGHT = 32;
const BAR_GAP = 8;
const BAR_STEP = BAR_HEIGHT + BAR_GAP;

function ScheduleBar({
  schedule,
  index,
  viewStart,
  viewEnd,
  onClick,
  isDragging,
  dragOffset,
  onDragStart,
}: {
  schedule: Schedule;
  index: number;
  viewStart: Date;
  viewEnd: Date;
  onClick: () => void;
  isDragging: boolean;
  dragOffset: number;
  onDragStart: (e: React.PointerEvent) => void;
}) {
  const from = parseISO(schedule.dateFrom);
  const to = parseISO(schedule.dateTo);

  // Skip if entirely outside view
  if (isAfter(from, viewEnd) || isBefore(to, viewStart)) return null;

  const leftPct = clamp(dateToPercent(from, viewStart, viewEnd));
  const rightPct = clamp(dateToPercent(to, viewStart, viewEnd));
  const widthPct = rightPct - leftPct;

  if (widthPct <= 0) return null;

  const textColor = getTextColor(schedule.color);
  const barTop = index * BAR_STEP;

  // Notch markers: deadlines and important dates only
  const notchItems = schedule.items.filter(
    (item) =>
      (item.type === "deadline" || item.type === "important_date") && item.date
  );

  return (
    <div
      className={cn(
        "absolute rounded-md cursor-pointer select-none",
        isDragging
          ? "z-50 shadow-lg brightness-105"
          : "transition-[top,filter] duration-200 ease-out hover:brightness-110"
      )}
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        top: isDragging ? `${barTop + dragOffset}px` : `${barTop}px`,
        height: `${BAR_HEIGHT}px`,
        backgroundColor: schedule.color,
        boxShadow: isDragging
          ? "0 4px 16px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.15)"
          : "inset 0 1px 0 rgba(255,255,255,0.15)",
      }}
      onPointerDown={onDragStart}
      onClick={onClick}
    >
      {/* Label */}
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-sans font-medium truncate pr-3"
        style={{
          color: textColor,
          maxWidth: "calc(100% - 24px)",
        }}
      >
        {schedule.title}
      </span>

      {/* Notch markers */}
      {notchItems.map((item) => {
        const itemDate = parseISO(item.date!);
        const itemPctGlobal = dateToPercent(itemDate, viewStart, viewEnd);
        const itemPctLocal =
          leftPct > 0
            ? ((itemPctGlobal - leftPct) / widthPct) * 100
            : ((clamp(itemPctGlobal) - leftPct) / widthPct) * 100;

        if (itemPctLocal < 0 || itemPctLocal > 100) return null;

        return (
          <NotchMarker
            key={item.id}
            item={item}
            leftPct={itemPctLocal}
            textColor={textColor}
          />
        );
      })}
    </div>
  );
}

function NotchMarker({
  item,
  leftPct,
  textColor,
}: {
  item: ScheduleItem;
  leftPct: number;
  textColor: string;
}) {
  const isImportant = item.type === "important_date";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          isImportant ? (
            <div
              className="absolute top-[5%] h-[90%] w-[5px] cursor-pointer"
              style={{
                left: `${leftPct}%`,
                backgroundColor: "#D94F4F",
                borderRadius: "2px",
                boxShadow: "0 0 4px rgba(217,79,79,0.5)",
              }}
            />
          ) : (
            <div
              className="absolute top-[10%] h-[80%] w-[4px] rounded-full cursor-pointer"
              style={{
                left: `${leftPct}%`,
                backgroundColor:
                  textColor === "#FFFFFF"
                    ? "rgba(255,255,255,0.6)"
                    : "rgba(0,0,0,0.35)",
              }}
            />
          )
        }
      />
      <TooltipContent>
        <span className="font-ui text-xs">
          {item.title}
          {item.date && (
            <span className="ml-1 opacity-70">
              {format(parseISO(item.date), "MMM d, yyyy")}
            </span>
          )}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

// --- Today Marker ---

function TodayMarker({
  viewStart,
  viewEnd,
}: {
  viewStart: Date;
  viewEnd: Date;
}) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (isAfter(todayStart, viewEnd)) {
    // Today is to the right
    return (
      <div className="absolute right-2 top-0 z-20 flex items-center gap-1 text-[11px] font-ui font-medium text-cozy-today">
        Today <ChevronRightIcon className="h-3 w-3" />
      </div>
    );
  }

  if (isBefore(todayStart, viewStart)) {
    // Today is to the left
    return (
      <div className="absolute left-2 top-0 z-20 flex items-center gap-1 text-[11px] font-ui font-medium text-cozy-today">
        <ChevronLeftIcon className="h-3 w-3" /> Today
      </div>
    );
  }

  const pct = dateToPercent(todayStart, viewStart, viewEnd);

  return (
    <div
      className="absolute inset-y-0 z-20 pointer-events-none"
      style={{ left: `${pct}%` }}
    >
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-ui font-medium text-cozy-today whitespace-nowrap">
        Today
      </div>
      <div className="h-full w-[2px] bg-cozy-today" />
    </div>
  );
}

// --- Main RoadmapView ---

export function RoadmapView() {
  const {
    schedules,
    selectedDuration,
    viewStartDate,
    setViewStartDate,
    setDuration,
    openModal,
    loadSchedules,
    reorderBars,
    barOrder,
  } = useScheduleStore();

  React.useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const { start: viewStart, end: viewEnd } = getViewRange(
    viewStartDate,
    selectedDuration
  );

  const durationMonths =
    selectedDuration === "1M" ? 1 : selectedDuration === "3M" ? 3 : selectedDuration === "6M" ? 6 : 12;

  const navigateForward = () => setViewStartDate(addMonths(viewStartDate, durationMonths));
  const navigateBack = () => setViewStartDate(addMonths(viewStartDate, -durationMonths));

  const goToToday = () => setViewStartDate(startOfMonth(new Date()));

  const today = new Date();
  const todayVisible = isWithinInterval(today, { start: viewStart, end: viewEnd });

  // Ordered + visible schedules
  const orderedSchedules = React.useMemo(
    () => getOrderedSchedules(schedules),
    [schedules, barOrder]
  );

  const visibleSchedules = orderedSchedules.filter((s) => {
    const from = parseISO(s.dateFrom);
    const to = parseISO(s.dateTo);
    return !(isAfter(from, viewEnd) || isBefore(to, viewStart));
  });

  // --- Drag-and-drop state ---
  const [dragState, setDragState] = React.useState<{
    scheduleId: string;
    startY: number;
    currentOffset: number;
    originalIndex: number;
  } | null>(null);

  const dragDidMove = React.useRef(false);

  const handleDragStart = (scheduleId: string, index: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    dragDidMove.current = false;
    setDragState({
      scheduleId,
      startY: e.clientY,
      currentOffset: 0,
      originalIndex: index,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    const offset = e.clientY - dragState.startY;
    if (Math.abs(offset) > 3) dragDidMove.current = true;
    setDragState((prev) => prev ? { ...prev, currentOffset: offset } : null);
  };

  const handlePointerUp = () => {
    if (!dragState) return;

    if (dragDidMove.current) {
      // Calculate new index from offset
      const rawNewIndex = dragState.originalIndex + Math.round(dragState.currentOffset / BAR_STEP);
      const newIndex = Math.max(0, Math.min(visibleSchedules.length - 1, rawNewIndex));

      if (newIndex !== dragState.originalIndex) {
        const newOrder = visibleSchedules.map((s) => s.id);
        const [moved] = newOrder.splice(dragState.originalIndex, 1);
        newOrder.splice(newIndex, 0, moved);

        // Merge with any schedules not currently visible
        const allIds = orderedSchedules.map((s) => s.id);
        const fullOrder = newOrder.slice();
        for (const id of allIds) {
          if (!fullOrder.includes(id)) fullOrder.push(id);
        }
        reorderBars(fullOrder);
      }
    }

    setDragState(null);
  };

  // Compute display indices during drag
  const getDisplayIndex = (originalIndex: number): number => {
    if (!dragState || !dragDidMove.current) return originalIndex;
    const dragIdx = dragState.originalIndex;
    const rawTarget = dragIdx + Math.round(dragState.currentOffset / BAR_STEP);
    const targetIdx = Math.max(0, Math.min(visibleSchedules.length - 1, rawTarget));

    if (originalIndex === dragIdx) return originalIndex; // dragged bar uses offset, not index shift
    if (dragIdx < targetIdx) {
      // Dragging down: items between old and new shift up
      if (originalIndex > dragIdx && originalIndex <= targetIdx) return originalIndex - 1;
    } else if (dragIdx > targetIdx) {
      // Dragging up: items between new and old shift down
      if (originalIndex >= targetIdx && originalIndex < dragIdx) return originalIndex + 1;
    }
    return originalIndex;
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs or modal is open
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case "n":
        case "N":
          e.preventDefault();
          openModal();
          break;
        case "1":
          setDuration("1M");
          break;
        case "3":
          setDuration("3M");
          break;
        case "6":
          setDuration("6M");
          break;
        case "9":
          setDuration("12M");
          break;
        case "ArrowLeft":
          navigateBack();
          break;
        case "ArrowRight":
          navigateForward();
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const dateRangeLabel = `${format(viewStart, "MMM yyyy")} — ${format(addMonths(viewEnd, -1), "MMM yyyy")}`;
  const barsHeight = Math.max(visibleSchedules.length * BAR_STEP, 80);

  return (
    <div className="w-full bg-cozy-bg border-b border-cozy-border" style={{ minHeight: "340px", maxHeight: "520px", height: "45vh" }}>
      <div className="flex h-full flex-col px-6 py-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          {/* Left: Duration Toggle */}
          <DurationToggle />

          {/* Center: Date Range + Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={navigateBack}
              className="text-cozy-text-secondary"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="text-sm font-sans text-cozy-text-secondary min-w-[180px] text-center">
              {dateRangeLabel}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={navigateForward}
              className="text-cozy-text-secondary"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            {!todayVisible && (
              <button
                onClick={goToToday}
                className="ml-1 text-xs font-ui text-cozy-today hover:underline"
              >
                Go to today
              </button>
            )}
          </div>

          {/* Right: Theme Toggle + Add Schedule */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => openModal()}
              className="font-ui text-[13px]"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Schedule
            </Button>
          </div>
        </div>

        {/* Timeline Area */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Time Axis */}
          <TimeAxis viewStart={viewStart} viewEnd={viewEnd} duration={selectedDuration} />

          {/* Grid + Bars */}
          <div className="relative flex-1 min-h-0 overflow-y-auto mt-1">
            {/* Grid Stripes */}
            <GridStripes viewStart={viewStart} viewEnd={viewEnd} duration={selectedDuration} />

            {/* Today Marker */}
            <TodayMarker viewStart={viewStart} viewEnd={viewEnd} />

            {/* Schedule Bars */}
            {visibleSchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-cozy-text-tertiary">
                <CalendarIcon className="h-8 w-8 opacity-40" />
                <p className="text-sm font-ui">
                  Add your first schedule to see it here
                </p>
              </div>
            ) : (
              <div
                className="relative w-full touch-none"
                style={{ height: `${barsHeight}px` }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                {visibleSchedules.map((schedule, i) => {
                  const isDragging = dragState?.scheduleId === schedule.id;
                  const displayIndex = getDisplayIndex(i);
                  return (
                    <ScheduleBar
                      key={schedule.id}
                      schedule={schedule}
                      index={isDragging ? i : displayIndex}
                      viewStart={viewStart}
                      viewEnd={viewEnd}
                      onClick={() => {
                        if (!dragDidMove.current) openModal(schedule);
                      }}
                      isDragging={isDragging}
                      dragOffset={isDragging ? dragState.currentOffset : 0}
                      onDragStart={handleDragStart(schedule.id, i)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
