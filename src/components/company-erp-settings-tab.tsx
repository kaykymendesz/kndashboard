"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import {
  saveCompanyProfile,
  saveProfitDistribution,
} from "@/lib/actions/company-settings";
import type {
  CatalogExclusiveCost,
  CatalogInfrastructure,
  CatalogLabor,
} from "@/lib/db/schema";
import type { ProfitDistributionConfig } from "@/lib/erp-v2/financial";

type Props = {
  profitDistribution: ProfitDistributionConfig;
  companyProfile: { name: string; city: string; cnpj?: string };
  catalogs: {
    infra: CatalogInfrastructure[];
    labor: CatalogLabor[];
    exclusive: CatalogExclusiveCost[];
  };
};

export function CompanyErpSettingsTab({ profitDistribution, companyProfile, catalogs }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dist, setDist] = useState(profitDistribution);
  const [profile, setProfile] = useState(companyProfile);

  const saveDist = () => {
    startTransition(async () => {
      try {
        await saveProfitDistribution(dist);
        toast.success("Distribuição de lucro salva");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao salvar");
      }
    });
  };

  const saveProfile = () => {
    startTransition(async () => {
      try {
        await saveCompanyProfile(profile);
        toast.success("Dados da empresa salvos");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao salvar");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card className="kn-card">
        <CardHeader className="kn-card-header">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Nome</Label>
              <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
            </div>
          </div>
          <Button onClick={saveProfile} disabled={pending} variant="outline" className="gap-2">
            <Save className="h-4 w-4" /> Salvar empresa
          </Button>
        </CardContent>
      </Card>

      <Card className="kn-card">
        <CardHeader className="kn-card-header">
          <CardTitle className="text-sm font-semibold">Distribuição de lucro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Empresa (%)</Label>
              <Input
                type="number"
                value={dist.companyPercent}
                onChange={(e) => setDist({ ...dist, companyPercent: Number(e.target.value) })}
              />
            </div>
            {dist.partners.map((p, i) => (
              <div key={p.slug}>
                <Label>{p.name} (%)</Label>
                <Input
                  type="number"
                  value={p.percent}
                  onChange={(e) => {
                    const partners = [...dist.partners];
                    partners[i] = { ...p, percent: Number(e.target.value) };
                    setDist({ ...dist, partners });
                  }}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Total: {dist.companyPercent + dist.partners.reduce((s, p) => s + p.percent, 0)}%
          </p>
          <Button onClick={saveDist} disabled={pending} className="kn-btn-primary gap-2">
            <Save className="h-4 w-4" /> Salvar distribuição
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="infra" className="space-y-4">
        <TabsList className="bg-muted/50 flex-wrap h-auto">
          <TabsTrigger value="infra">Infraestrutura</TabsTrigger>
          <TabsTrigger value="labor">Mão de Obra</TabsTrigger>
          <TabsTrigger value="exclusive">Custos Exclusivos</TabsTrigger>
        </TabsList>

        <TabsContent value="infra">
          <CatalogTable
            type="infra"
            rows={catalogs.infra.map((r) => ({
              id: r.id,
              name: r.name,
              vendor: r.vendor ?? "",
              companyCost: String(r.companyCost ?? 0),
              compositionValue: String(r.compositionValue ?? 0),
              periodicity: r.periodicity ?? "Mensal",
              active: r.active ?? true,
            }))}
            columns={["name", "vendor", "companyCost", "compositionValue", "periodicity"]}
            pending={pending}
            onRefresh={() => router.refresh()}
          />
        </TabsContent>
        <TabsContent value="labor">
          <CatalogTable
            type="labor"
            rows={catalogs.labor.map((r) => ({
              id: r.id,
              name: r.name,
              defaultValue: String(r.defaultValue ?? 0),
              active: r.active ?? true,
            }))}
            columns={["name", "defaultValue"]}
            pending={pending}
            onRefresh={() => router.refresh()}
          />
        </TabsContent>
        <TabsContent value="exclusive">
          <CatalogTable
            type="exclusive"
            rows={catalogs.exclusive.map((r) => ({
              id: r.id,
              name: r.name,
              defaultValue: String(r.defaultValue ?? 0),
              active: r.active ?? true,
            }))}
            columns={["name", "defaultValue"]}
            pending={pending}
            onRefresh={() => router.refresh()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CatalogTable({
  type,
  rows,
  columns,
  pending,
  onRefresh,
}: {
  type: "infra" | "labor" | "exclusive";
  rows: Record<string, string | number | boolean>[];
  columns: string[];
  pending: boolean;
  onRefresh: () => void;
}) {
  const labels: Record<string, string> = {
    name: "Nome",
    vendor: "Fornecedor",
    companyCost: "Custo empresa",
    compositionValue: "Valor composição",
    periodicity: "Periodicidade",
    defaultValue: "Valor padrão",
  };

  return (
    <Card className="kn-card">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c}>{labels[c] ?? c}</TableHead>
                ))}
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id as number}>
                  {columns.map((c) => (
                    <TableCell key={c} className="text-sm">
                      {c.includes("Cost") || c.includes("Value")
                        ? formatCurrency(String(row[c]))
                        : String(row[c])}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Badge variant={row.active ? "default" : "secondary"}>
                      {row.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground p-4">
          Catálogos seedados na migração v13. Edição avançada em breve — valores usados na composição financeira.
        </p>
      </CardContent>
    </Card>
  );
}
