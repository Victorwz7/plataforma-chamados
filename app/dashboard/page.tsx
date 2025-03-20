import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketStatusChart } from "@/components/dashboard/ticket-status-chart";
import { RecentTickets } from "@/components/dashboard/recent-tickets";
import { TicketsSkeleton } from "@/components/dashboard/tickets-skeleton";
import { TicketStats } from "@/components/dashboard/ticket-stats";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <TicketStats />
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Chamados Recentes</CardTitle>
                <CardDescription>
                  Seus chamados mais recentes e seus status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<TicketsSkeleton />}>
                  <RecentTickets />
                </Suspense>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Status dos Chamados</CardTitle>
                <CardDescription>
                  Distribuição dos chamados por status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TicketStatusChart />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Tempo de Resolução</CardTitle>
                <CardDescription>
                  Tempo médio de resolução dos chamados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Dados de análise serão exibidos aqui
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Chamados por Departamento</CardTitle>
                <CardDescription>
                  Distribuição dos chamados por departamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Dados de análise serão exibidos aqui
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}