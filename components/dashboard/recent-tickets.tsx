"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

export function RecentTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTickets() {
      setLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Erro ao obter usuário:", userError);
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Erro ao buscar perfil:", profileError);
        setLoading(false);
        return;
      }

      setUserRole(profile?.role);

      let query = supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      // Se o usuário for comum, ele só vê os próprios chamados
      if (profile?.role === "user") {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar chamados:", error);
        setLoading(false);
        return;
      }

      setTickets(data || []);
      setLoading(false);
    }

    fetchTickets();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Aberto</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Em Andamento</Badge>;
      case "resolved":
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Resolvido</Badge>;
      case "closed":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Fechado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Baixa</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Média</Badge>;
      case "high":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">Alta</Badge>;
      case "urgent":
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Urgente</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center p-4 border rounded-lg animate-pulse">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-6 w-16 bg-muted rounded"></div>
              <div className="h-6 w-16 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] space-y-4">
        <p className="text-muted-foreground">Você ainda não possui chamados</p>
        <Link href="/dashboard/tickets/new">
          <Button>Criar Novo Chamado</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <div key={ticket.id} className="flex flex-col space-y-2 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <Link href={`/dashboard/tickets/${ticket.id}`} className="font-medium hover:underline">
              {ticket.title}
            </Link>
            <div className="flex space-x-2">
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">{ticket.description}</p>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Departamento: {ticket.department}</span>
            <span>
              {formatDistanceToNow(new Date(ticket.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
        </div>
      ))}
      <div className="flex justify-center">
        <Link href="/dashboard/tickets">
          <Button variant="outline">Ver Todos os Chamados</Button>
        </Link>
      </div>
    </div>
  );
}
