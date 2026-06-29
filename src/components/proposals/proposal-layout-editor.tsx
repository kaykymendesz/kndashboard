"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEFAULT_LAYOUT_CONFIG,
  parseLayoutConfig,
  type ProposalLayoutConfig,
} from "@/lib/proposals/layout-config";

export function ProposalLayoutEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (json: string) => void;
}) {
  const layout = parseLayoutConfig(value);

  const patch = (partial: Partial<ProposalLayoutConfig>) => {
    const next = { ...layout, ...partial };
    onChange(JSON.stringify(next, null, 2));
  };

  const patchContact = (
    key: "contact1" | "contact2",
    field: "name" | "role" | "phone",
    val: string
  ) => {
    const contact = { ...(layout[key] ?? DEFAULT_LAYOUT_CONFIG[key]!), [field]: val };
    patch({ [key]: contact });
  };

  const patchColor = (key: "purple" | "blue", val: string) => {
    patch({ colors: { ...layout.colors, [key]: val } });
  };

  return (
    <Card className="kn-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Editor de layout</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Título linha 1</Label>
            <Input
              value={layout.titleLine1 ?? ""}
              onChange={(e) => patch({ titleLine1: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Título linha 2</Label>
            <Input
              value={layout.titleLine2 ?? ""}
              onChange={(e) => patch({ titleLine2: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Subtítulo (logo)</Label>
            <Input
              value={layout.subtitle ?? ""}
              onChange={(e) => patch({ subtitle: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>URL do logotipo</Label>
            <Input
              value={layout.logoUrl ?? ""}
              onChange={(e) => patch({ logoUrl: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Cor roxa</Label>
            <Input
              type="color"
              value={layout.colors?.purple ?? "#8e2de2"}
              onChange={(e) => patchColor("purple", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Cor azul</Label>
            <Input
              type="color"
              value={layout.colors?.blue ?? "#4a00e0"}
              onChange={(e) => patchColor("blue", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Margem do conteúdo (mm)</Label>
            <Input
              type="number"
              min={16}
              max={40}
              value={layout.bodyPaddingMm ?? 24}
              onChange={(e) => patch({ bodyPaddingMm: Number(e.target.value) })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Cidade (rodapé)</Label>
            <Input value={layout.city ?? ""} onChange={(e) => patch({ city: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(["contact1", "contact2"] as const).map((key, i) => (
            <div key={key} className="rounded-lg border p-3 space-y-2">
              <p className="text-sm font-semibold">Contato {i + 1}</p>
              <Input
                placeholder="Nome"
                value={layout[key]?.name ?? ""}
                onChange={(e) => patchContact(key, "name", e.target.value)}
              />
              <Input
                placeholder="Função"
                value={layout[key]?.role ?? ""}
                onChange={(e) => patchContact(key, "role", e.target.value)}
              />
              <Input
                placeholder="Telefone"
                value={layout[key]?.phone ?? ""}
                onChange={(e) => patchContact(key, "phone", e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="grid gap-2">
          <Label>Razão social (rodapé)</Label>
          <Input
            value={layout.legalName ?? ""}
            onChange={(e) => patch({ legalName: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
