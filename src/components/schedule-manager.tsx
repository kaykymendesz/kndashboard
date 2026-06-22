"use client";

import Link from "next/link";
import { Plus, Calendar, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ScheduleItem } from "@/lib/db/schema";

export function ScheduleManager({ items }: { items: ScheduleItem[] }) {
  return (
    <div className="kn-page">
      <PageHeader
        title="Cronograma"
        description="Marcos estratégicos — clique na data para abrir o item e executar processos."
        icon={Calendar}
      >
        <Button asChild className="kn-btn-primary gap-2">
          <Link href="/cronograma/novo"><Plus className="h-4 w-4" />Novo item</Link>
        </Button>
      </PageHeader>

      <div className="kn-table-wrap overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Previsto</TableHead>
              <TableHead>Realizado</TableHead>
              <TableHead className="text-right">Abrir</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="kn-row-hover">
                <TableCell>
                  <Link href={`/cronograma/${item.id}`} className="font-medium text-primary hover:underline whitespace-nowrap">
                    {formatDate(item.plannedDate)}
                  </Link>
                </TableCell>
                <TableCell className="font-medium max-w-[220px]">
                  <Link href={`/cronograma/${item.id}`} className="hover:text-primary hover:underline">
                    {item.title}
                  </Link>
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell><Badge variant="secondary">{item.status}</Badge></TableCell>
                <TableCell>{item.plannedValue ? formatCurrency(item.plannedValue) : "—"}</TableCell>
                <TableCell>{item.actualValue ? formatCurrency(item.actualValue) : "—"}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" asChild>
                    <Link href={`/cronograma/${item.id}`}><ChevronRight className="h-4 w-4" /></Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
