"use client";

import * as React from "react";
import { format, isAfter, isBefore, parseISO, isEqual } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, ChevronDownIcon, PlusIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Schedule, ScheduleItem, COLOR_PRESETS } from "@/lib/types";

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: Schedule;
  onSave: (schedule: Schedule) => void;
  onDelete?: (id: string) => void;
}

function createEmptyItem(type: ScheduleItem["type"]): ScheduleItem {
  return {
    id: crypto.randomUUID(),
    type,
    title: "",
    date: null,
    recurrence: "none",
    checked: false,
    createdAt: new Date().toISOString(),
  };
}

function DatePickerField({
  value,
  onChange,
  placeholder,
  minDate,
  maxDate,
}: {
  value: string | null;
  onChange: (date: string | null) => void;
  placeholder: string;
  minDate?: Date;
  maxDate?: Date;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = value ? parseISO(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal font-ui",
              !value && "text-muted-foreground"
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value ? format(parseISO(value), "MMM d, yyyy") : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : null);
            setOpen(false);
          }}
          disabled={(date) => {
            if (minDate && isBefore(date, minDate)) return true;
            if (maxDate && isAfter(date, maxDate)) return true;
            return false;
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function ItemSection({
  title,
  type,
  items,
  onChange,
  dateFrom,
  dateTo,
}: {
  title: string;
  type: ScheduleItem["type"];
  items: ScheduleItem[];
  onChange: (items: ScheduleItem[]) => void;
  dateFrom: string | null;
  dateTo: string | null;
}) {
  const [expanded, setExpanded] = React.useState(items.length > 0);
  const filteredItems = items.filter((i) => i.type === type);

  const addItem = () => {
    onChange([...items, createEmptyItem(type)]);
    setExpanded(true);
  };

  const updateItem = (id: string, updates: Partial<ScheduleItem>) => {
    onChange(items.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  const dateRequired = type !== "task";
  const minDate = dateFrom ? parseISO(dateFrom) : undefined;
  const maxDate = dateTo ? parseISO(dateTo) : undefined;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 font-ui text-sm font-medium text-cozy-text-secondary hover:text-cozy-text-primary transition-colors duration-200"
      >
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            !expanded && "-rotate-90"
          )}
        />
        {title}
        {filteredItems.length > 0 && (
          <span className="rounded-full bg-cozy-accent-light text-cozy-accent px-2 py-0.5 text-xs font-ui">
            {filteredItems.length}
          </span>
        )}
      </button>

      {expanded && (
        <div className="space-y-3 pl-6">
          {filteredItems.length === 0 && (
            <p className="text-sm text-cozy-text-tertiary font-ui">
              No {title.toLowerCase()} yet. Add one below.
            </p>
          )}

          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-lg border border-cozy-border bg-cozy-surface p-3"
            >
              <div className="flex items-center gap-2">
                <Input
                  value={item.title}
                  onChange={(e) =>
                    updateItem(item.id, {
                      title: e.target.value.slice(0, 120),
                    })
                  }
                  placeholder={`${title.slice(0, -1)} name`}
                  className="flex-1 font-sans text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-cozy-text-tertiary hover:bg-cozy-accent-light hover:text-cozy-today transition-colors duration-200"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[140px]">
                  <DatePickerField
                    value={item.date}
                    onChange={(date) => updateItem(item.id, { date })}
                    placeholder={dateRequired ? "Pick a date" : "Date (optional)"}
                    minDate={minDate}
                    maxDate={maxDate}
                  />
                </div>
                <div className="min-w-[130px]">
                  <Select
                    value={item.recurrence}
                    onValueChange={(val) =>
                      updateItem(item.id, {
                        recurrence: val as ScheduleItem["recurrence"],
                      })
                    }
                  >
                    <SelectTrigger className="w-full font-ui text-sm">
                      <SelectValue placeholder="Recurrence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Biweekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {item.recurrence !== "none" && item.date && dateFrom && dateTo && (
                <p className="text-xs text-cozy-text-tertiary font-ui">
                  Creates recurring {type.replace("_", " ")}s from{" "}
                  {format(parseISO(item.date), "MMM d")} to{" "}
                  {format(parseISO(dateTo), "MMM d, yyyy")}
                </p>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addItem}
            className="font-ui text-cozy-accent hover:text-cozy-accent-hover hover:bg-cozy-accent-light"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add {title.slice(0, -1)}
          </Button>
        </div>
      )}
    </div>
  );
}

export function ScheduleModal({
  open,
  onOpenChange,
  schedule,
  onSave,
  onDelete,
}: ScheduleModalProps) {
  const isEdit = !!schedule;

  const [title, setTitle] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState<string | null>(null);
  const [dateTo, setDateTo] = React.useState<string | null>(null);
  const [color, setColor] = React.useState(COLOR_PRESETS[0].value);
  const [description, setDescription] = React.useState("");
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);
  const [items, setItems] = React.useState<ScheduleItem[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);

  // Reset form when schedule changes or modal opens
  React.useEffect(() => {
    if (open) {
      if (schedule) {
        setTitle(schedule.title);
        setDateFrom(schedule.dateFrom);
        setDateTo(schedule.dateTo);
        setColor(schedule.color);
        setDescription(schedule.description || "");
        setDescriptionExpanded(!!schedule.description);
        setItems([...schedule.items]);
      } else {
        setTitle("");
        setDateFrom(null);
        setDateTo(null);
        setColor(COLOR_PRESETS[0].value);
        setDescription("");
        setDescriptionExpanded(false);
        setItems([]);
      }
      setErrors({});
      setShowDeleteConfirm(false);
      setIsDirty(false);
    }
  }, [open, schedule]);

  // Track dirty state
  const markDirty = React.useCallback(() => setIsDirty(true), []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!dateFrom) newErrors.dateFrom = "Start date is required";
    if (!dateTo) newErrors.dateTo = "End date is required";
    if (dateFrom && dateTo) {
      const from = parseISO(dateFrom);
      const to = parseISO(dateTo);
      if (isAfter(from, to) || isEqual(from, to)) {
        newErrors.dateTo = "End date must be after start date";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const now = new Date().toISOString();
    const savedSchedule: Schedule = {
      id: schedule?.id || crypto.randomUUID(),
      title: title.trim(),
      description: description.trim() || null,
      dateFrom: dateFrom!,
      dateTo: dateTo!,
      color,
      items,
      createdAt: schedule?.createdAt || now,
      updatedAt: now,
    };

    onSave(savedSchedule);
    onOpenChange(false);
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen && isDirty) {
      if (!window.confirm("You have unsaved changes. Discard them?")) return;
    }
    onOpenChange(newOpen);
  };

  const handleDelete = () => {
    if (schedule && onDelete) {
      onDelete(schedule.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto rounded-xl bg-cozy-surface shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-xl tracking-tight">
            {isEdit ? "Edit Schedule" : "New Schedule"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium font-ui text-cozy-text-secondary">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value.slice(0, 80));
                markDirty();
              }}
              placeholder="e.g., IB Recruiting 2027"
              className="font-sans"
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-xs text-cozy-today font-ui">{errors.title}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium font-ui text-cozy-text-secondary">
                From
              </label>
              <DatePickerField
                value={dateFrom}
                onChange={(d) => {
                  setDateFrom(d);
                  markDirty();
                }}
                placeholder="Start date"
              />
              {errors.dateFrom && (
                <p className="text-xs text-cozy-today font-ui">
                  {errors.dateFrom}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium font-ui text-cozy-text-secondary">
                To
              </label>
              <DatePickerField
                value={dateTo}
                onChange={(d) => {
                  setDateTo(d);
                  markDirty();
                }}
                placeholder="End date"
              />
              {errors.dateTo && (
                <p className="text-xs text-cozy-today font-ui">
                  {errors.dateTo}
                </p>
              )}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <label className="text-sm font-medium font-ui text-cozy-text-secondary">
              Color
            </label>
            <div className="flex gap-3">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.label}
                  onClick={() => {
                    setColor(preset.value);
                    markDirty();
                  }}
                  className={cn(
                    "h-7 w-7 rounded-full transition-all duration-200",
                    color === preset.value
                      ? "ring-2 ring-offset-2 ring-offset-cozy-surface scale-110"
                      : "hover:scale-110"
                  )}
                  style={{
                    backgroundColor: preset.value,
                    // @ts-expect-error CSS custom property for ring color
                    "--tw-ring-color": color === preset.value ? preset.value : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Description (collapsible) */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setDescriptionExpanded(!descriptionExpanded)}
              className="flex items-center gap-2 font-ui text-sm font-medium text-cozy-text-secondary hover:text-cozy-text-primary transition-colors duration-200"
            >
              <ChevronDownIcon
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  !descriptionExpanded && "-rotate-90"
                )}
              />
              Description
            </button>
            {descriptionExpanded && (
              <Textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value.slice(0, 500));
                  markDirty();
                }}
                placeholder="Add a description..."
                className="font-sans text-sm min-h-[80px]"
              />
            )}
          </div>

          {/* Item Sections */}
          <ItemSection
            title="Deadlines"
            type="deadline"
            items={items}
            onChange={(newItems) => {
              setItems(newItems);
              markDirty();
            }}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />

          <ItemSection
            title="Tasks"
            type="task"
            items={items}
            onChange={(newItems) => {
              setItems(newItems);
              markDirty();
            }}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />

          <ItemSection
            title="Important Dates"
            type="important_date"
            items={items}
            onChange={(newItems) => {
              setItems(newItems);
              markDirty();
            }}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          {isEdit && onDelete && (
            <div>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-cozy-today font-ui">
                    Are you sure? This can&apos;t be undone.
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    className="font-ui"
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="font-ui"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="font-ui text-cozy-today hover:text-cozy-today hover:bg-cozy-today/10"
                >
                  Delete Schedule
                </Button>
              )}
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              className="font-ui"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="font-ui bg-cozy-accent text-white hover:bg-cozy-accent-hover"
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
