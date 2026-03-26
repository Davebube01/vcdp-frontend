import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Table,
  Bell,
  FolderSearch,
  Users as UsersIcon,
  PlusCircle,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/core/providers/AuthProvider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const { user } = useAuth();

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Submissions", icon: Table, href: "/submissions" },
    { label: "New Submission", icon: PlusCircle, href: "/submissions/new" },
    { label: "Documents", icon: FolderSearch, href: "/documents" },
    ...(user?.role?.toUpperCase() === "NATIONAL_ADMIN"
      ? [{ label: "Users", icon: UsersIcon, href: "/users" }]
      : []),
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* Sidebar */}
        <Sidebar className="border-r shadow-sm">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3 font-display font-bold text-2xl text-primary">
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                V
              </div>
              VCDP
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3">
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.href === "/"
                        ? location.pathname === "/"
                        : location.pathname.startsWith(item.href)
                    }
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      location.pathname === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <NavLink to={item.href} end={item.href === "/"}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 px-2 py-2">
                <Avatar className="h-9 w-9 border shadow-sm">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || "JD"}`}
                  />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || "JD"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-bold truncate max-w-[100px]">
                    {user?.name || "Loading..."}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    {user?.role?.replace("_", " ") || "Auth..."}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-rose-500"
                onClick={() => {
                  localStorage.removeItem("auth_token");
                  localStorage.removeItem("auth_user");
                  window.location.href = "/";
                }}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 ">
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center justify-between px-4 md:px-8 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-1" />
              <div className="h-4 w-px bg-border md:hidden" />
              <h1 className="text-lg md:text-xl font-display font-semibold text-foreground">
                {navItems.find((i) => i.href === location.pathname)?.label ||
                  "Overview"}
              </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
              >
                <Bell className="w-5 h-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hidden sm:flex"
                  >
                    <span className="text-sm">Help & Support</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Resources</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Documentation</DropdownMenuItem>
                  <DropdownMenuItem>API Reference</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4 md:p-8 bg-background">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
