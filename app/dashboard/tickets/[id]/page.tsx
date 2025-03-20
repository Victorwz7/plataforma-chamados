"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/auth/login");
          return;
        }
        
        setUser(user);
        
        const { data: ticketData, error: ticketError } = await supabase
          .from("tickets")
          .select("*")
          .eq("id", params.id)
          .single();
        
        if (ticketError) {
          toast.error("Erro ao carregar o chamado");
          router.push("/dashboard/tickets");
          return;
        }
        
        if (ticketData.user_id !== user.id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          
          if (profileData?.role !== "admin" && profileData?.role !== "agent") {
            toast.error("Você não tem permissão para visualizar este chamado");
            router.push("/dashboard/tickets");
            return;
          }
        }
        
        setTicket(ticketData);
        
        const { data: commentsData, error: commentsError } = await supabase
          .from("ticket_comments")
          .select("*, profiles:user_id (full_name)")
          .eq("ticket_id", params.id)
          .order("created_at", { ascending: true });
        
        if (!commentsError) {
          setComments(commentsData || []);
        }
      } catch (error) {
        console.error("Erro:", error);
        toast.error("Ocorreu um erro ao carregar os dados");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [params.id, router]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("ticket_comments")
        .insert({
          ticket_id: params.id,
          user_id: user.id,
          content: newComment,
          is_internal: false,
        })
        .select("*, profiles:user_id (full_name)");

      if (error) {
        toast.error(error.message);
        return;
      }
      
      setComments([...comments, data[0]]);
      setNewComment("");
      toast.success("Comentário adicionado com sucesso");
    } catch (error) {
      toast.error("Ocorreu um erro ao adicionar o comentário");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center">
          <Link href="/dashboard/tickets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
        <div className="flex justify-center py-8">
          <p className="text-muted-foreground">Carregando detalhes do chamado...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center">
          <Link href="/dashboard/tickets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
        <div className="flex justify-center py-8">
          <p className="text-muted-foreground">Chamado não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center">
        <Link href="/dashboard/tickets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>
      
      <Card>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comentários</CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <p className="text-muted-foreground">Nenhum comentário ainda</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id}>
                <strong>{comment.profiles?.full_name}</strong>: {comment.content}
              </div>
            ))
          )}
        </CardContent>
        <CardContent>
          <Textarea
            placeholder="Adicione um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button onClick={handleSubmitComment} disabled={submitting || !newComment.trim()}>
            {submitting ? "Enviando..." : "Enviar"} <Send className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
