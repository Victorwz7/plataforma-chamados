"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function AdminReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ticketsByStatus, setTicketsByStatus] = useState<any[]>([]);
  const [ticketsByDepartment, setTicketsByDepartment] = useState<any[]>([]);
  const [ticketsByDay, setTicketsByDay] = useState<any[]>([]);
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    avgResolutionTime: 0,
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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
      
      return true;
    }
    
    async function fetchReportData() {
      const hasAccess = await checkAccess();
      if (!hasAccess) return;
      
      try {
        // Fetch all tickets
        const { data: tickets, error } = await supabase
          .from('tickets')
          .select('*');
        
        if (error) {
          console.error('Error fetching tickets:', error);
          return;
        }
        
        if (tickets) {
          // Calculate tickets by status
          const statusCounts = {
            open: tickets.filter(t => t.status === 'open').length,
            in_progress: tickets.filter(t => t.status === 'in_progress').length,
            resolved: tickets.filter(t => t.status === 'resolved').length,
            closed: tickets.filter(t => t.status === 'closed').length,
          };
          
          const statusData = [
            { name: 'Abertos', value: statusCounts.open, color: '#FFBB28' },
            { name: 'Em Andamento', value: statusCounts.in_progress, color: '#0088FE' },
            { name: 'Resolvidos', value: statusCounts.resolved, color: '#00C49F' },
            { name: 'Fechados', value: statusCounts.closed, color: '#8884d8' },
          ];
          
          setTicketsByStatus(statusData);
          
          // Calculate tickets by department
          const departmentMap = new Map();
          tickets.forEach(ticket => {
            const dept = ticket.department;
            departmentMap.set(dept, (departmentMap.get(dept) || 0) + 1);
          });
          
          const departmentData = Array.from(departmentMap.entries()).map(([name, value], index) => ({
            name,
            value,
            color: COLORS[index % COLORS.length],
          }));
          
          setTicketsByDepartment(departmentData);
          
          // Calculate tickets by day (last 7 days)
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = subDays(new Date(), i);
            return format(date, 'yyyy-MM-dd');
          }).reverse();
          
          const ticketsByDayData = last7Days.map(day => {
            const count = tickets.filter(t => {
              const ticketDate = format(new Date(t.created_at), 'yyyy-MM-dd');
              return ticketDate === day;
            }).length;
            
            return {
              name: format(new Date(day), 'dd/MM'),
              tickets: count,
            };
          });
          
          setTicketsByDay(ticketsByDayData);
          
          // Calculate overall stats
          const total = tickets.length;
          const open = statusCounts.open;
          const inProgress = statusCounts.in_progress;
          const resolved = statusCounts.resolved;
          const closed = statusCounts.closed;
          
          // Calculate average resolution time (mock data for now)
          const avgResolutionTime = 36; // hours
          
          setTicketStats({
            total,
            open,
            inProgress,
            resolved,
            closed,
            avgResolutionTime,
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchReportData();
  }, [router]);

  const downloadReport = () => {
    // This would generate a CSV or PDF report in a real application
    toast.success("Relatório baixado com sucesso");
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
        </div>
        <div className="flex justify-center py-8">
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
        <Button onClick={downloadReport}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Chamados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chamados Abertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chamados Resolvidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.resolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Resolução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.avgResolutionTime}h</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chamados por Status</CardTitle>
            <CardDescription>
              Distribuição dos chamados por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ticketsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {ticketsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Chamados por Departamento</CardTitle>
            <CardDescription>
              Distribuição dos chamados por departamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ticketsByDepartment}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {ticketsByDepartment.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Chamados nos Últimos 7 Dias</CardTitle>
          <CardDescription>
            Número de chamados abertos por dia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ticketsByDay}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tickets" fill="hsl(var(--chart-1))" name="Chamados" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}