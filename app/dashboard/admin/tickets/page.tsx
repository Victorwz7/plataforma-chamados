"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function AdminTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTickets() {
      setLoading(true);

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push("/auth/login");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError || !profileData) {
          toast.error("Erro ao obter perfil do usuário.");
          return;
        }

        setUserRole(profileData.role);

        if (profileData.role !== "admin") {
          toast.error("Acesso negado.");
          router.push("/dashboard");
          return;
        }

        // Consulta ajustada para ficar igual ao segundo código
        const { data, error } = await supabase
          .from("tickets")
          .select("id, title, description, status, priority, created_at") // Alterado para refletir o que é recuperado no segundo código
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro ao buscar chamados:", error);
          toast.error("Erro ao carregar os chamados.");
          return;
        }

        setTickets(data);
      } catch (error) {
        console.error("Erro geral:", error);
        toast.error("Ocorreu um erro ao carregar os chamados.");
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, [router]);

  const getStatusBadge = (status: string) => {
    const variants = {
      open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      closed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    };
    return <Badge variant="outline" className={variants[status as keyof typeof variants] || "bg-gray-200"}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: keyof typeof variants) => {
    const variants = {
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return <Badge variant="outline" className={variants[priority] || "bg-gray-200"}>{priority}</Badge>;
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <p>Carregando chamados...</p>;
  }

  if (!tickets.length) {
    return <p>Nenhum chamado encontrado.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Chamados</h1>

      <div className="relative flex-1 mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar chamados..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredTickets.map((ticket) => (
        <Card key={ticket.id}>
          <CardHeader>
            <CardTitle>{ticket.title}</CardTitle>
            <p className="text-muted-foreground">
              Criado {formatDistanceToNow(new Date(ticket.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </CardHeader>
          <CardContent>
            <p>{ticket.description}</p>
            <div className="flex gap-2 mt-2">
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
            <Link href={`/dashboard/tickets/${ticket.id}`}>
              <Button variant="outline" className="mt-2">Ver detalhes</Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
