"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

const generalFormSchema = z.object({
  companyName: z.string().min(2, { message: "Nome da empresa deve ter pelo menos 2 caracteres" }),
  supportEmail: z.string().email({ message: "Email inválido" }),
  logoUrl: z.string().url({ message: "URL inválida" }).optional().or(z.literal("")),
  welcomeMessage: z.string().max(500, { message: "Mensagem muito longa" }).optional(),
});

const departmentsFormSchema = z.object({
  departments: z.array(
    z.object({
      name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
      description: z.string().optional(),
    })
  ).min(1, { message: "Adicione pelo menos um departamento" }),
});

const notificationsFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  newTicketNotification: z.boolean().default(true),
  ticketUpdateNotification: z.boolean().default(true),
  commentNotification: z.boolean().default(true),
  dailyDigest: z.boolean().default(false),
  notificationEmail: z.string().email({ message: "Email inválido" }),
});

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState([
    { name: "TI", description: "Suporte técnico e infraestrutura" },
    { name: "Financeiro", description: "Questões financeiras e pagamentos" },
    { name: "RH", description: "Recursos humanos e pessoal" },
    { name: "Comercial", description: "Vendas e atendimento ao cliente" },
    { name: "Suporte", description: "Suporte ao usuário final" },
  ]);

  const generalForm = useForm<z.infer<typeof generalFormSchema>>({
    resolver: zodResolver(generalFormSchema),
    defaultValues: {
      companyName: "Help Desk",
      supportEmail: "suporte@helpdesk.com",
      logoUrl: "",
      welcomeMessage: "Bem-vindo ao sistema de chamados. Estamos aqui para ajudar!",
    },
  });

  const departmentsForm = useForm<z.infer<typeof departmentsFormSchema>>({
    resolver: zodResolver(departmentsFormSchema),
    defaultValues: {
      departments: departments,
    },
  });

  const notificationsForm = useForm<z.infer<typeof notificationsFormSchema>>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      emailNotifications: true,
      newTicketNotification: true,
      ticketUpdateNotification: true,
      commentNotification: true,
      dailyDigest: false,
      notificationEmail: "notificacoes@helpdesk.com",
    },
  });

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/auth/login");
        return;
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profileData || profileData.role !== 'admin') {
        toast.error("Você não tem permissão para acessar esta página");
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    }
    
    checkAccess();
    
    // Em um sistema real, aqui buscaríamos as configurações do banco de dados
    // e preencheríamos os formulários com os valores existentes
  }, [router]);

  async function onSubmitGeneral(values: z.infer<typeof generalFormSchema>) {
    setSubmitting(true);
    try {
      // Em um sistema real, aqui salvaríamos as configurações no banco de dados
      console.log("Configurações gerais:", values);
      
      // Simulando uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Configurações gerais atualizadas com sucesso");
    } catch (error) {
      toast.error("Ocorreu um erro ao atualizar as configurações");
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitNotifications(values: z.infer<typeof notificationsFormSchema>) {
    setSubmitting(true);
    try {
      // Em um sistema real, aqui salvaríamos as configurações de notificação no banco de dados
      console.log("Configurações de notificação:", values);
      
      // Simulando uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Configurações de notificação atualizadas com sucesso");
    } catch (error) {
      toast.error("Ocorreu um erro ao atualizar as configurações de notificação");
    } finally {
      setSubmitting(false);
    }
  }

  const addDepartment = () => {
    const currentDepartments = departmentsForm.getValues().departments;
    departmentsForm.setValue("departments", [
      ...currentDepartments,
      { name: "", description: "" }
    ]);
  };

  const removeDepartment = (index: number) => {
    const currentDepartments = departmentsForm.getValues().departments;
    if (currentDepartments.length > 1) {
      departmentsForm.setValue("departments", 
        currentDepartments.filter((_, i) => i !== index)
      );
    } else {
      toast.error("É necessário ter pelo menos um departamento");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h2>
        </div>
        <div className="flex justify-center py-8">
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h2>
      </div>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="departments">Departamentos</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure as informações básicas do sistema de chamados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(onSubmitGeneral)} className="space-y-6">
                  <FormField
                    control={generalForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Empresa</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da sua empresa" {...field} />
                        </FormControl>
                        <FormDescription>
                          Este nome será exibido em todo o sistema e nos emails
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={generalForm.control}
                    name="supportEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email de Suporte</FormLabel>
                        <FormControl>
                          <Input placeholder="suporte@suaempresa.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Email principal para contato de suporte
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={generalForm.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Logo</FormLabel>
                        <FormControl>
                          <Input placeholder="https://exemplo.com/logo.png" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL da imagem do logo da empresa (opcional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={generalForm.control}
                    name="welcomeMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensagem de Boas-vindas</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Mensagem exibida na página inicial" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Mensagem exibida para os usuários na página inicial
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Departamentos</CardTitle>
              <CardDescription>
                Configure os departamentos disponíveis para categorização de chamados
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>
                Configure como e quando as notificações serão enviadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationsForm}>
                <form onSubmit={notificationsForm.handleSubmit(onSubmitNotifications)} className="space-y-6">
                  <FormField
                    control={notificationsForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Notificações por Email</FormLabel>
                          <FormDescription>
                            Ativar ou desativar todas as notificações por email
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="text-sm font-medium">Tipos de Notificação</h3>
                    
                    <FormField
                      control={notificationsForm.control}
                      name="newTicketNotification"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Novos Chamados</FormLabel>
                            <FormDescription>
                              Notificar quando um novo chamado for criado
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!notificationsForm.watch("emailNotifications")}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationsForm.control}
                      name="ticketUpdateNotification"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Atualizações de Chamados</FormLabel>
                            <FormDescription>
                              Notificar quando um chamado for atualizado
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!notificationsForm.watch("emailNotifications")}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationsForm.control}
                      name="commentNotification"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Novos Comentários</FormLabel>
                            <FormDescription>
                              Notificar quando um novo comentário for adicionado
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!notificationsForm.watch("emailNotifications")}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationsForm.control}
                      name="dailyDigest"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Resumo Diário</FormLabel>
                            <FormDescription>
                              Receber um resumo diário de todas as atividades
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!notificationsForm.watch("emailNotifications")}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={notificationsForm.control}
                    name="notificationEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email para Notificações</FormLabel>
                        <FormControl>
                          <Input placeholder="notificacoes@suaempresa.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Email para onde serão enviadas as notificações administrativas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}