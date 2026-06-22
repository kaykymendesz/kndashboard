import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProjectBySlug } from "@/lib/actions/projects";
import { formatCurrency, formatDate } from "@/lib/format";
import { FolderKanban, ArrowLeft, ListTodo } from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getProjectBySlug(slug);
  if (!data) notFound();

  const { project, details, expenses, totalSpent } = data;
  const isWikinaya = slug === "wikinaya";

  const grouped = details.reduce<Record<string, typeof details>>((acc, item) => {
    const key = item.section.trim();
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="kn-page">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link href="/projetos" className="hover:text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Projetos
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{project.name}</span>
      </div>

      <PageHeader
        title={project.name}
        description={project.description ?? ""}
        icon={FolderKanban}
      >
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total investido</p>
          <p className="text-2xl font-bold text-primary tabular-nums">{formatCurrency(totalSpent)}</p>
        </div>
      </PageHeader>

      {isWikinaya && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary flex items-center justify-between gap-4">
          <span>
            Wikinaya: gastos de <strong>domínio</strong> e <strong>Play Store</strong>. Atividades no menu dedicado.
          </span>
          <Button variant="outline" size="sm" asChild>
            <Link href="/atividades" className="gap-2">
              <ListTodo className="h-4 w-4" /> Atividades Wikinaya
            </Link>
          </Button>
        </div>
      )}

      <Tabs defaultValue="detalhes" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="detalhes">Detalhamento</TabsTrigger>
          <TabsTrigger value="gastos">Gastos ({expenses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="space-y-4">
          {Object.keys(grouped).length === 0 ? (
            <Card className="kn-card p-8 text-center text-muted-foreground text-sm">
              Nenhum detalhe cadastrado. Adicione em Configurações ou Dados da Empresa.
            </Card>
          ) : (
            Object.entries(grouped).map(([section, rows]) => (
              <Card key={section} className="kn-card overflow-hidden">
                <CardHeader className="kn-card-header py-3">
                  <CardTitle className="text-sm font-semibold">{section}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-border/50">
                  {rows.map((row) => (
                    <div key={row.id} className="grid sm:grid-cols-3 gap-2 px-6 py-3 text-sm kn-row-hover">
                      <span className="font-medium text-muted-foreground">{row.field}</span>
                      <span className="font-medium">{row.value}</span>
                      <span className="text-muted-foreground text-xs">{row.notes}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="gastos">
          <Card className="kn-card">
            <CardHeader className="kn-card-header flex flex-row items-center justify-between py-4">
              <CardTitle className="text-sm font-semibold">Gastos do projeto</CardTitle>
              <Badge variant="secondary">{formatCurrency(totalSpent)}</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground p-6">Nenhum gasto vinculado a este projeto.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((e) => (
                        <TableRow key={e.id} className="kn-row-hover">
                          <TableCell className="font-medium">{e.description}</TableCell>
                          <TableCell>{e.category}</TableCell>
                          <TableCell>{formatDate(e.purchaseDate)}</TableCell>
                          <TableCell>{e.vendor}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {formatCurrency(e.totalValue)}
                          </TableCell>
                          <TableCell><Badge variant="secondary">{e.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
