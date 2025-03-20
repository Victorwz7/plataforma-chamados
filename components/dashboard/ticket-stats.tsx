"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketIcon, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export function TicketStats() {
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Erro ao obter usuário:", userError);
        setLoading(false);
        return;
      }

      // Obtém o papel do usuário
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Erro ao obter perfil:", profileError);
        setLoading(false);
        return;
      }

      const userRole = profile?.role;

      // Define o filtro: todos os chamados para admin/atendente, apenas do usuário para user comum
      const query = supabase.from("tickets").select("status");
      if (userRole === "user") {
        query.eq("user_id", user.id);
      }

      const { data: tickets, error: ticketsError } = await query;

      if (ticketsError) {
        console.error("Erro ao buscar chamados:", ticketsError);
        setLoading(false);
        return;
      }

      // Contagem dos chamados por status
      const total = tickets.length;
      const open = tickets.filter((t) => t.status === "open").length;
      const inProgress = tickets.filter((t) => t.status === "in_progress").length;
      const resolved = tickets.filter((t) => t.status === "resolved").length;

      setStats({ total, open, inProgress, resolved });
      setLoading(false);
    }

    fetchStats();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Chamados</CardTitle>
          <TicketIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "..." : stats.total}</div>
          <p className="text-xs text-muted-foreground">Todos os chamados registrados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chamados Abertos</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "..." : stats.open}</div>
          <p className="text-xs text-muted-foreground">Aguardando atendimento</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "..." : stats.inProgress}</div>
          <p className="text-xs text-muted-foreground">Sendo atendidos no momento</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "..." : stats.resolved}</div>
          <p className="text-xs text-muted-foreground">Chamados finalizados</p>
        </CardContent>
      </Card>
    </div>
  );
}
