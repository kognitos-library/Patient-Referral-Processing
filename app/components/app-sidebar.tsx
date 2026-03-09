"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuAction,
  SidebarHeader,
  SidebarSeparator,
  ModeToggle,
  Icon,
  Title,
  Text,
  Skeleton,
} from "@kognitos/lattice";
import { useChatContext } from "@/lib/chat/chat-context";

interface AppSidebarProps {
  needsReviewCount?: number;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: "Home" as const },
  { label: "Review Queue", href: "/review", icon: "AlertCircle" as const },
  { label: "Chat", href: "/chat", icon: "MessageSquare" as const },
];

export function AppSidebar({ needsReviewCount = 0 }: AppSidebarProps) {
  const pathname = usePathname();
  const { sessions, activeSessionId, setActiveSessionId, deleteSession, isLoadingSessions } =
    useChatContext();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Icon type="FileText" size="sm" className="text-primary-foreground" />
          </div>
          <div>
            <Title level="h4" className="text-sm leading-tight">
              Referral Intake
            </Title>
            <Text level="xSmall" color="muted">
              SoCal Orthopedic
            </Text>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <Icon type={item.icon} size="sm" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.href === "/review" && needsReviewCount > 0 && (
                      <SidebarMenuBadge className="bg-warning text-warning-foreground">
                        {needsReviewCount}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Chat History</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoadingSessions ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <SidebarMenuItem key={i}>
                      <Skeleton className="h-8 w-full" />
                    </SidebarMenuItem>
                  ))}
                </>
              ) : sessions.length === 0 ? (
                <SidebarMenuItem>
                  <Text level="xSmall" color="muted" className="px-2 py-1">
                    No conversations yet
                  </Text>
                </SidebarMenuItem>
              ) : (
                sessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={session.id === activeSessionId}
                    >
                      <Link
                        href="/chat"
                        onClick={() => setActiveSessionId(session.id)}
                      >
                        <Icon type="MessageCircle" size="xs" />
                        <span className="truncate">
                          {session.title || "New Conversation"}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="opacity-0 group-hover/menu-item:opacity-100 transition-opacity"
                    >
                      <Icon type="Trash" size="xs" />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center justify-between">
          <Text level="xSmall" color="muted">Powered by Kognitos</Text>
          <ModeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
