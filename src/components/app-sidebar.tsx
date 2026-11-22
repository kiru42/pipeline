"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Inbox, KanbanSquare, TrendingUp, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const ENTRIES = [
  { href: "/", label: "Aujourd'hui", icon: Inbox },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
] as const;

/** Vrai si `pathname` appartient à la rubrique `href` (la fiche d'un contact relève de « Contacts »). */
function isCurrent(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Entrées de navigation ; `pathname` nul tant que l'URL n'est pas connue (prérendu). */
function NavEntries({ pathname }: { pathname: string | null }) {
  return (
    <SidebarMenu>
      {ENTRIES.map(({ href, label, icon: Icon }) => {
        const current = pathname !== null && isCurrent(href, pathname);
        return (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton
              isActive={current}
              render={<Link href={href} aria-current={current ? "page" : undefined} />}
            >
              <Icon aria-hidden />
              <span>{label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function CurrentNavEntries() {
  return <NavEntries pathname={usePathname()} />;
}

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TrendingUp className="size-4" aria-hidden />
          </span>
          <span className="font-semibold text-sidebar-foreground">Pipeline</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <nav aria-label="Navigation principale">
              {/* Avec cacheComponents, l'URL d'une fiche n'est connue qu'à la requête : usePathname suspend. */}
              <Suspense fallback={<NavEntries pathname={null} />}>
                <CurrentNavEntries />
              </Suspense>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
