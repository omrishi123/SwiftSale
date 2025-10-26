'use client';

import React from 'react';
import { useAppData } from '@/contexts/AppContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ExpensesPage() {
  const { appData } = useAppData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appData.expenses.length > 0 ? (
                appData.expenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell>
                      {new Date(exp.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{exp.title}</TableCell>
                    <TableCell>{exp.category}</TableCell>
                    <TableCell className="text-right">
                      ₹{exp.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No expenses recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
