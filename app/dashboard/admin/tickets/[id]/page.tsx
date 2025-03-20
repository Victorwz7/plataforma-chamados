"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

export default function AdminTicketDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingAssignment, setUpdatingAssignment] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/auth/login");
        return false;
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profileData || (profileData.role !== 'admin' && profileData.role !== 'agent')) {
        toast.error("Você não tem permissão para acessar esta página");
        router.push("/dashboard");
        return false;
      }
      
      setUser({
        ...user,
        role: profileData.role
      });
      
      return true;
    }
    
    async function fetchData() {
      try {
        const hasAccess = await checkAccess();
        if (!hasAccess) return;
        
        // Fetch ticket details
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select(`
            *,
            profiles:user_id (
              full_name,
              avatar_url
            ),
            assigned_profiles:assigned_to (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('id', params.id)
          .single();
        
        if (ticketError) {
          toast.error("Erro ao carregar o chamado");
          router.push("/dashboard/admin/tickets");
          return;
        }
        
        setTicket(ticketData);
        
        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('ticket_comments')
          .select(`
            *,
            profiles:user_id (
              full_name,
              avatar_url,
              role
            )
          `)
          .eq('ticket_id', params.id)
          .order('created_at', { ascending: true });
        
        if (commentsError) {
          console.error('Error fetching comments:', commentsError);
        } else {
          setComments(commentsData || []);
        }
        
        // Fetch agents and admins for assignment
        const { data: agentsData, error: agentsError } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .in('role', ['agent', 'admin']);
        
        if (agentsError) {
          console.error('Error fetching agents:', agentsError);
        } else {
          setAgents(agentsData || []);
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error("Ocorreu um erro ao carregar os dados");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [params.id, router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Aberto</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Em Andamento</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Resolvido</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Fechado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Baixa</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Média</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">Alta</Badge>;
      case 'urgent':
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Urgente</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: params.id,
          user_id: user.id,
          content: newComment,
          is_internal: isInternal,
        })
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url,
            role
          )
        `);
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      setComments([...comments, data[0]]);
      setNewComment("");
      setIsInternal(false);
      toast.success("Comentário adicionado com sucesso");
    } catch (error) {
      toast.error("Ocorreu um erro ao adicionar o comentário");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      setTicket({
        ...ticket,
        status: newStatus,
        updated_at: new Date().toISOString(),
      });
      
      toast.success(`Status atualizado para ${newStatus}`);
      
      // Add system comment about status change
      await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: params.id,
          user_id: user.id,
          content: `Status alterado para "${newStatus}" por ${user.email}`,
          is_internal: true,
        });
      
      // Refresh comments
      const { data: commentsData } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url,
            role
          )
        `)
        .eq('ticket_id', params.id)
        .order('created_at', { ascending: true });
      
      if (commentsData) {
        setComments(commentsData);
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao atualizar o status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignTicket = async (agentId: string) => {
    setUpdatingAssignment(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          assigned_to: agentId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      // Find agent details
      const agent = agents.find(a => a.id === agentId);
      
      setTicket({
        ...ticket,
        assigned_to: agentId,
        assigned_profiles: agent ? {
          id: agent.id,
          full_name: agent.full_name,
        } : null,
        updated_at: new Date().toISOString(),
      });
      
      toast.success(agentId ? "Chamado atribuído com sucesso" : "Atribuição removida");
      
      // Add system comment about assignment
      await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: params.id,
          user_id: user.id,
          content: agentId 
            ? `Chamado atribuído para ${agent?.full_name} por ${user.email}`
            : `Atribuição removida por ${user.email}`,
          is_internal: true,
        });
      
      // Refresh comments
      const { data: commentsData } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url,
            role
          )
        `)
        .eq('ticket_id', params.id)
        .order('created_at', { ascending: true });
      
      if (commentsData) {
        setComments(commentsData);
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao atribuir o chamado");
    } finally {
      setUpdatingAssignment(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center">
          <Link href="/dashboard/admin/tickets">
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
          <Link href="/dashboard/admin/tickets">
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
        <Link href="/dashboard/admin/tickets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{ticket.title}</CardTitle>
                  <CardDescription>
                    Criado {formatDistanceToNow(new Date(ticket.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={ticket.profiles?.avatar_url} />
                    <AvatarFallback>{getInitials(ticket.profiles?.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{ticket.profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground">Solicitante</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Descrição</h3>
                  <p className="mt-1 whitespace-pre-line">{ticket.description}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="mb-4 text-sm font-medium text-muted-foreground">Comentários</h3>
                  
                  {comments.length === 0 ? (
                    <div className="py-4 text-center text-muted-foreground">
                      Nenhum comentário ainda
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className={`flex gap-4 ${comment.is_internal ? 'bg-muted/50 p-3 rounded-md' : ''}`}>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={comment.profiles?.avatar_url} />
                            <AvatarFallback>{getInitials(comment.profiles?.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{comment.profiles?.full_name}</span>
                              {comment.profiles?.role === 'agent' && (
                                <Badge variant="outline" className="text-xs">Atendente</Badge>
                              )}
                              {comment.profiles?.role === 'admin' && (
                                <Badge variant="outline" className="text-xs">Admin</Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                              {comment.is_internal && (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 text-xs">Interno</Badge>
                              )}
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full space-y-2">
                <div className="flex items-center justify-end mb-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="internal-comment"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="internal-comment" className="text-sm text-muted-foreground">
                      Comentário interno (visível apenas para a equipe)
                    </label>
                  </div>
                </div>
                <Textarea
                  placeholder="Adicione um comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSubmitComment} 
                    disabled={submitting || !newComment.trim()}
                  >
                    {submitting ? "Enviando..." : "Enviar"}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Atualizar Status</h3>
                <Select
                  value={ticket.status}
                  onValueChange={handleUpdateStatus}
                  disabled={updatingStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                    <SelectItem value="closed">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Atribuir Chamado</h3>
                <Select
                  value={ticket.assigned_to || ""}
                  onValueChange={handleAssignTicket}
                  disabled={updatingAssignment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um atendente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Não atribuído</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name} ({agent.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Chamado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">ID do Chamado</h3>
                  <p className="mt-1 text-sm">{ticket.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <div className="mt-1">{getStatusBadge(ticket.status)}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Prioridade</h3>
                  <div className="mt-1">{getPriorityBadge(ticket.priority)}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Departamento</h3>
                  <p className="mt-1 text-sm">{ticket.department}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Solicitante</h3>
                  <p className="mt-1 text-sm">{ticket.profiles?.full_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Atribuído a</h3>
                  <p className="mt-1 text-sm">
                    {ticket.assigned_profiles?.full_name || "Não atribuído"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Data de Criação</h3>
                  <p className="mt-1 text-sm">
                    {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Última Atualização</h3>
                  <p className="mt-1 text-sm">
                    {format(new Date(ticket.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}