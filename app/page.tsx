"use client";

import * as React from "react";
import { RoadmapView } from "@/components/roadmap-view";
import { ScheduleModal } from "@/components/schedule-modal";
import { WhatsAhead } from "@/components/whats-ahead";
import { Sidebar } from "@/components/sidebar";
import { LoginModal } from "@/components/login-modal";
import { useScheduleStore } from "@/lib/store";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Schedule } from "@/lib/types";

export default function Home() {
  const {
    modalOpen,
    editingSchedule,
    closeModal,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    schedules,
  } = useScheduleStore();

  const handleSave = (schedule: Schedule) => {
    const exists = schedules.some((s) => s.id === schedule.id);
    if (exists) {
      updateSchedule(schedule);
    } else {
      addSchedule(schedule);
    }
  };

  const handleDelete = (id: string) => {
    deleteSchedule(id);
  };

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-cozy-bg">
        <Sidebar />

        <main className="flex-1 min-w-0 flex flex-col">
          {/* Roadmap View — sticky top, 35vh */}
          <RoadmapView />

          {/* What's Ahead */}
          <WhatsAhead />
        </main>

        {/* Login Modal — appears when user is unauthenticated */}
        <LoginModal />

        {/* Schedule Modal — controlled by store */}
        <ScheduleModal
          open={modalOpen}
          onOpenChange={(open) => {
            if (!open) closeModal();
          }}
          schedule={editingSchedule || undefined}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
    </TooltipProvider>
  );
}
