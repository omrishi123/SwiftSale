"use client";

import React, { useState, useMemo } from 'react';
import { useAppData } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '../dashboard/StatCard';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export default function ReportsView() {
  const { appData } = useAppData();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<{ revenue: number; netProfit: number; chartData: any[] } | null>(null);

  const generateReport = () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredSales = appData.sales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= start && saleDate <= end;
    });

    const filteredExpenses = appData.expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= start && expenseDate <= end;
    });

    const revenue = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
    const profit = filteredSales.reduce((sum, s) => sum + s.profit, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = profit - totalExpenses;

    const salesByDate = filteredSales.reduce((acc, sale) => {
      const date = new Date(sale.date).toLocaleDateString('en-CA'); // YYYY-MM-DD
      acc[date] = (acc[date] || 0) + sale.grandTotal;
      return acc;
    }, {} as { [key: string]: number });
    
    const chartData = Object.keys(salesByDate).sort().map(date => ({
      date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      sales: salesByDate[date],
    }));

    setReportData({ revenue, netProfit, chartData });
  };
  
  const chartConfig = {
    sales: {
      label: "Sales",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <Button onClick={generateReport}>Generate</Button>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard title="Total Revenue" value={reportData.revenue} />
            <StatCard title="Net Profit" value={reportData.netProfit} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                      <Tooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
