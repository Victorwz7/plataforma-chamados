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
import { Switch } from "@/components/ui/switch";
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
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

const accountFormSchema = z.object({
  email: z.string().email({ message: "Email inválido" }).optional(),
  language: z.string({
    required_error: "Por favor selecione um idioma",
  }),
  theme: z.string({
    required_error: "Por favor selecione um tema",
  }),
});

const notificationsFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  newTicketNotification: z.boolean().default(true),
  ticketUpdateNotification: z.boolean().default(true),
  commentNotification: z.boolean().default(true),
  ticketResolutionNotification: z.boolean().default(true),
});

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  const accountForm = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      email: "",
      language: "pt-BR",
      theme: "system",
    },
  });

  const notificationsForm = useForm<z.infer<typeof notificationsFormSchema>>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      emailNotifications: true,
      newTicketNotification: true,
      ticketUpdateNotification: true,
      commentNotification: true,
      ticketResolutionNotification: true,
    },
  });

  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/auth/login");
          return;
        }
        
        setUser(user);
        
        // Preencher o formulário com os dados do usuário
        accountForm.setValue("email", user.email || "");
        
        // Em um sistema real, buscaríamos as preferências do usuário do banco de dados
        // e preencheríamos os formulários com os valores existentes
        
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        toast.error("Ocorreu um erro ao carregar as configurações");
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, [router, accountForm]);

  async function onSubmitAccount(values: z.infer<typeof accountFormSchema>) {
    setSubmitting(true);
    try {
      // Em um sistema real, aqui salvaríamos as configurações no banco de dados
      console.log("Configurações de conta:", values);
      
      // Simulando uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Configurações de conta atualizadas com sucesso");
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

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
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
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
      </div>
      
      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account">Conta</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Conta</CardTitle>
              <CardDescription>
                Gerencie as configurações da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...accountForm}>
                <form onSubmit={accountForm.handleSubmit(onSubmitAccount)} className="space-y-6">
                  <FormField
                    control={accountForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="seu@email.com" {...field} disabled />
                        </FormControl>
                        <FormDescription>
                          Seu email de login (não pode ser alterado)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={accountForm.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idioma</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um idioma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                            <SelectItem value="en-US">English (US)</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Idioma utilizado na interface do sistema
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={accountForm.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tema</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um tema" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="light">Claro</SelectItem>
                            <SelectItem value="dark">Escuro</SelectItem>
                            <SelectItem value="system">Sistema</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Tema visual do sistema
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
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>
                Gerencie como você recebe notificações
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
                              Receber notificação quando um novo chamado for criado
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
                              Receber notificação quando um chamado for atualizado
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
                              Receber notificação quando um novo comentário for adicionado
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
                      name="ticketResolutionNotification"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Resolução de Chamados</FormLabel>
                            <FormDescription>
                              Receber notificação quando um chamado for resolvido
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