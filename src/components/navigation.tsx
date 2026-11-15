"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ClipboardList,
  FileBarChart2,
  LayoutDashboard,
  MapPin,
  Menu,
  Recycle,
  Settings2,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import type { Role } from "@/generated/prisma/client";

const links = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    roles: ["ADMIN", "SUPERVISOR", "COLLECTOR"],
  },
  {
    href: "/collection-points",
    label: "Collection points",
    icon: MapPin,
    roles: ["ADMIN", "SUPERVISOR", "COLLECTOR"],
  },
  {
    href: "/collections",
    label: "Collections",
    icon: ClipboardList,
    roles: ["ADMIN", "SUPERVISOR", "COLLECTOR"],
  },
  { href: "/recycling", label: "Recycling & diversion", icon: Recycle, roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/telemetry", label: "Telemetry demo", icon: Activity, roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/requests", label: "Community requests", icon: Truck, roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/reports", label: "Reports", icon: FileBarChart2, roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/audit", label: "Audit trail", icon: ShieldCheck, roles: ["ADMIN"] },
  { href: "/settings", label: "Administration", icon: Settings2, roles: ["ADMIN"] },
] as const;

export function Navigation({ role }: { role: Role }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const previousPathname = useRef(pathname);
  const open = openPath === pathname;
  const visible = links.filter((link) => (link.roles as readonly Role[]).includes(role));
  const closeMenu = () => {
    setOpenPath(null);
    buttonRef.current?.focus();
  };

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const updateViewport = () => {
      setIsMobile(media.matches);
      if (!media.matches) setOpenPath(null);
    };
    updateViewport();
    media.addEventListener("change", updateViewport);
    return () => media.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!isMobile || !open) return;
    const frame = window.requestAnimationFrame(() =>
      sidebarRef.current?.querySelector<HTMLAnchorElement>(".nav-link")?.focus(),
    );
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenPath(null);
      buttonRef.current?.focus();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobile, open]);

  useEffect(() => {
    const previous = previousPathname.current;
    if (previous === pathname) return;
    previousPathname.current = pathname;
    if (!isMobile || openPath !== previous) return;
    const frame = window.requestAnimationFrame(() => {
      setOpenPath((current) => (current === previous ? null : current));
      const heading = document.querySelector<HTMLElement>(".main-area h1");
      if (!heading) return;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isMobile, openPath, pathname]);

  return (
    <>
      <button
        ref={buttonRef}
        className="mobile-menu-button"
        type="button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={isMobile && open}
        aria-controls="wasteops-primary-navigation"
        onClick={() => (open ? closeMenu() : setOpenPath(pathname))}
      >
        {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
      </button>
      <aside
        id="wasteops-primary-navigation"
        ref={sidebarRef}
        className="sidebar"
        data-open={isMobile && open}
        inert={isMobile && !open}
        aria-hidden={isMobile && !open ? true : undefined}
        aria-label="Primary navigation"
      >
        <Link
          className="brand"
          href="/dashboard"
          onClick={() => {
            if (pathname === "/dashboard") closeMenu();
          }}
        >
          <span className="brand-mark" aria-hidden="true">
            <Recycle size={22} strokeWidth={2.2} />
          </span>
          <span>
            <span className="brand-name">WasteOps</span>
            <br />
            <span className="brand-sub">Circular operations</span>
          </span>
        </Link>
        <div className="nav-label">Operations</div>
        <nav className="side-nav">
          {visible.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <Link
                className="nav-link"
                href={href}
                key={href}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  if (pathname === href) closeMenu();
                }}
              >
                <Icon className="nav-icon" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <div className="environment-note">
            <span className="environment-dot" aria-hidden="true" />
            <span>
              <strong>Simulation environment</strong>
              <br />
              No live devices or fleet data connected.
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
