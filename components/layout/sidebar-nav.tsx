"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  TicketIcon,
  Users,
  Settings,
  BarChart,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items?: {
    href: string;
    title: string;
    icon: React.ReactNode;
    roles?: string[];
  }[];
}

export function SidebarNav({ className, ...props }: SidebarNavProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function getUserRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setUserRole(data.role);
        }
      }
    }

    getUserRole();
  }, []);

  const defaultItems = [
    {
      href: "/dashboard",
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: "/dashboard/tickets",
      title: "Meus Chamados",
      icon: <TicketIcon className="h-5 w-5" />,
    },
    {
      href: "/dashboard/tickets/new",
      title: "Novo Chamado",
      icon: <MessageSquare className="h-5 w-5" />,
    },
  ];

  const adminItems = [
    {
      href: "/dashboard/admin/tickets",
      title: "Todos os Chamados",
      icon: <TicketIcon className="h-5 w-5" />,
      roles: ["admin", "agent"],
    },
    {
      href: "/dashboard/admin/users",
      title: "Usuários",
      icon: <Users className="h-5 w-5" />,
      roles: ["admin"],
    },
    {
      href: "/dashboard/admin/register",
      title: "Cadastrar Usuário",
      icon: <UserPlus className="h-5 w-5" />,
      roles: ["admin"],
    },
    {
      href: "/dashboard/admin/reports",
      title: "Relatórios",
      icon: <BarChart className="h-5 w-5" />,
      roles: ["admin", "agent"],
    },
    {
      href: "/dashboard/admin/settings",
      title: "Configurações",
      icon: <Settings className="h-5 w-5" />,
      roles: ["admin"],
    },
  ];

  const items = [
    ...defaultItems,
    ...(userRole ? adminItems.filter(item => !item.roles || item.roles.includes(userRole)) : []),
  ];

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <Button
          key={item.href}
          variant={pathname === item.href ? "secondary" : "ghost"}
          className={cn(
            "justify-start",
            pathname === item.href
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline"
          )}
          asChild
        >
          <Link href={item.href}>
            {item.icon}
            <span className="ml-2">{item.title}</span>
          </Link>
        </Button>
      ))}
    </nav>
  );
}