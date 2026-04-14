"use client";

import * as React from "react";
import {
  CarIcon,
  PanelLeftIcon,
  PanelLeftCloseIcon,
  LogInIcon,
  LogOutIcon,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { signInWithGoogle, signOutAction } from "@/app/actions/auth";

type Tab = "roadmap";

export function Sidebar() {
  const [activeTab, setActiveTab] = React.useState<Tab>("roadmap");
  const [collapsed, setCollapsed] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { data: session, status } = useSession();

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "roadmap", label: "Roadmap", icon: <CarIcon className="h-4 w-4" /> },
  ];

  return (
    <aside
      className={cn(
        "shrink-0 sticky top-0 h-screen border-r border-cozy-border bg-cozy-surface flex flex-col transition-[width] duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div
        className={cn(
          "flex items-center py-5",
          collapsed ? "px-3 justify-center" : "px-5 justify-between"
        )}
      >
        {!collapsed && (
          <h1 className="font-heading text-lg tracking-tight text-cozy-text-primary">
            Cozyy
          </h1>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center h-7 w-7 rounded-md text-cozy-text-secondary hover:bg-cozy-accent-light hover:text-cozy-text-primary transition-colors duration-200"
        >
          {collapsed ? (
            <PanelLeftIcon className="h-4 w-4" />
          ) : (
            <PanelLeftCloseIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className={cn("flex-1 min-h-0", collapsed ? "px-2" : "px-3")}>
        <ul className="flex flex-col gap-1">
          {tabs.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <li key={tab.key}>
                <button
                  onClick={() => setActiveTab(tab.key)}
                  title={collapsed ? tab.label : undefined}
                  className={cn(
                    "w-full flex items-center rounded-md font-ui text-sm transition-colors duration-200",
                    collapsed
                      ? "justify-center h-10"
                      : "gap-2.5 px-3 py-2",
                    active
                      ? "bg-cozy-accent-light text-cozy-accent font-medium"
                      : "text-cozy-text-secondary hover:bg-cozy-accent-light hover:text-cozy-text-primary"
                  )}
                >
                  {tab.icon}
                  {!collapsed && tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Account section */}
      <div className={cn("shrink-0 py-3 relative", collapsed ? "px-2" : "px-3")}>
        {status === "loading" ? (
          <div
            className={cn(
              "w-full flex items-center rounded-md",
              collapsed ? "justify-center p-1.5" : "gap-2.5 px-2 py-2"
            )}
          >
            <div className="shrink-0 h-8 w-8 rounded-full bg-cozy-border animate-pulse" />
            {!collapsed && (
              <div className="flex-1 min-w-0 space-y-1">
                <div className="h-3 w-20 bg-cozy-border rounded animate-pulse" />
                <div className="h-2 w-28 bg-cozy-border rounded animate-pulse" />
              </div>
            )}
          </div>
        ) : session?.user ? (
          <>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              title={collapsed ? session.user.name ?? undefined : undefined}
              className={cn(
                "w-full flex items-center rounded-md transition-colors duration-200 hover:bg-cozy-accent-light",
                collapsed ? "justify-center p-1.5" : "gap-2.5 px-2 py-2"
              )}
            >
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name ?? "Profile"}
                  className="shrink-0 h-8 w-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-ui text-xs font-medium text-white"
                  style={{ backgroundColor: "#C15F3C" }}
                >
                  {(session.user.name ?? "?").slice(0, 2).toUpperCase()}
                </div>
              )}
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-ui text-sm font-medium text-cozy-text-primary truncate">
                    {session.user.name}
                  </p>
                  <p className="font-ui text-[11px] text-cozy-text-tertiary truncate">
                    {session.user.email}
                  </p>
                </div>
              )}
            </button>

            {menuOpen && (
              <form
                action={signOutAction}
                className={cn(
                  "absolute bottom-full mb-2 rounded-md border border-cozy-border bg-cozy-surface shadow-md py-1",
                  collapsed ? "left-2 right-2" : "left-3 right-3"
                )}
              >
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 px-3 py-2 font-ui text-sm text-cozy-text-secondary hover:bg-cozy-accent-light hover:text-cozy-text-primary transition-colors duration-200"
                >
                  <LogOutIcon className="h-4 w-4" />
                  {!collapsed && "Sign out"}
                </button>
              </form>
            )}
          </>
        ) : (
          <form action={signInWithGoogle}>
            <button
              type="submit"
              title={collapsed ? "Sign in with Google" : undefined}
              className={cn(
                "w-full flex items-center rounded-md font-ui text-sm transition-colors duration-200 text-cozy-text-secondary hover:bg-cozy-accent-light hover:text-cozy-text-primary",
                collapsed ? "justify-center h-10" : "gap-2.5 px-3 py-2"
              )}
            >
              <LogInIcon className="h-4 w-4" />
              {!collapsed && "Sign in with Google"}
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
