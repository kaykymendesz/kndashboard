"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users, ChevronRight, Headphones } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListSearchBar } from "@/components/list-search-bar";
import type { Client } from "@/lib/db/schema";

type ClientWithStats = Client & { open: number; total: number };

export function AtendimentoClientsList({ clients }: { clients: ClientWithStats[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.company?.toLowerCase().includes(q) ?? false) ||
        (c.project?.toLowerCase().includes(q) ?? false)
    );
  }, [clients, search]);

  return (
    <>
      <ListSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Buscar cliente..."
      />

      {filtered.length === 0 ? (
        <Card className="kn-card p-8 text-center text-muted-foreground mt-4">
          {clients.length === 0 ? (
            <>
              Nenhum cliente cadastrado.{" "}
              <Link href="/clientes/novo?returnTo=/atendimento" className="text-primary font-medium hover:underline">
                Cadastre o primeiro cliente
              </Link>
            </>
          ) : (
            "Nenhum resultado para a busca."
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
          {filtered.map((client) => (
            <Link key={client.id} href={`/atendimento/clientes/${client.slug}`}>
              <Card className="kn-card h-full transition-all hover:shadow-md group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="kn-kpi-icon">
                      <Users className="h-5 w-5" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h2 className="mt-4 font-semibold text-lg">{client.name}</h2>
                  {client.company && (
                    <p className="text-sm text-muted-foreground">{client.company}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {client.open > 0 && (
                      <Badge className="bg-amber-500/15 text-amber-800 border-amber-200">
                        {client.open} em aberto
                      </Badge>
                    )}
                    <Badge variant="secondary">{client.total} demanda(s)</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
