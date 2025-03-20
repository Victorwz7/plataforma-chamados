"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { supabase } from "@/lib/supabase/client";

export function TicketStatusChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: tickets, error } = await supabase
          .from('tickets')
          .select('status')
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error fetching tickets:', error);
          return;
        }
        
        if (tickets) {
          const statusCounts = {
            open: tickets.filter(t => t.status === 'open').length,
            in_progress: tickets.filter(t => t.status === 'in_progress').length,
            resolved: tickets.filter(t => t.status === 'resolved').length,
            closed: tickets.filter(t => t.status === 'closed').length,
          };
          
          const chartData = [
            { name: 'Abertos', value: statusCounts.open, color: 'hsl(var(--chart-1))' },
            { name: 'Em Andamento', value: statusCounts.in_progress, color: 'hsl(var(--chart-2))' },
            { name: 'Resolvidos', value: statusCounts.resolved, color: 'hsl(var(--chart-3))' },
            { name: 'Fechados', value: statusCounts.closed, color: 'hsl(var(--chart-4))' },
          ].filter(item => item.value > 0);
          
          setData(chartData);
        }
      }
      
      setLoading(false);
    }
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">Nenhum chamado encontrado</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}