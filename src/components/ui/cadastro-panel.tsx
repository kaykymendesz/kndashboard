"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  Check,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";

export interface CadastroItemRow {
  id: string;
  nome: string;
  active?: boolean;
  meta?: string;
}

interface CadastroPanelProps {
  title: string;
  subtitle?: string;
  items: CadastroItemRow[];
  onCreate: (nome: string) => Promise<void>;
  onEdit: (id: string, nome: string) => Promise<void>;
  onInativar?: (id: string) => Promise<void>;
  onReativar?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  searchPlaceholder?: string;
  showActiveFilter?: boolean;
}

type Filtro = "ativos" | "inativos" | "todos";

export function CadastroPanel({
  title,
  subtitle,
  items,
  onCreate,
  onEdit,
  onInativar,
  onReativar,
  onDelete,
  searchPlaceholder,
  showActiveFilter = false,
}: CadastroPanelProps) {
  const [nome, setNome] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("ativos");
  const [busca, setBusca] = useState("");
  const [creating, setCreating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CadastroItemRow | null>(null);

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return items.filter((item) => {
      if (showActiveFilter) {
        if (filtro === "ativos" && item.active === false) return false;
        if (filtro === "inativos" && item.active !== false) return false;
      }
      if (!q) return true;
      return (
        item.nome.toLowerCase().includes(q) ||
        (item.meta?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [items, filtro, busca, showActiveFilter]);

  async function handleCreate() {
    const trimmed = nome.trim();
    if (!trimmed) {
      toast.error("Informe um nome.");
      return;
    }
    setCreating(true);
    try {
      await onCreate(trimmed);
      setNome("");
      toast.success(`"${trimmed}" adicionado.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveEdit(id: string) {
    const trimmed = editNome.trim();
    if (!trimmed) {
      toast.error("Informe um nome.");
      return;
    }
    setSavingEdit(true);
    try {
      await onEdit(id, trimmed);
      setEditId(null);
      setEditNome("");
      toast.success("Alteração salva.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSavingEdit(false);
    }
  }

  async function runAction(id: string, fn: () => Promise<void>, okMsg?: string) {
    setActionId(id);
    try {
      await fn();
      if (okMsg) toast.success(okMsg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro na operação");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-3">
      {subtitle && <p className="text-xs leading-relaxed text-muted-foreground">{subtitle}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={searchPlaceholder ?? `Buscar ${title.toLowerCase()}...`}
            className="pl-9"
          />
        </div>
        {showActiveFilter && (
          <div className="flex gap-1 rounded-lg bg-muted p-0.5">
            {(["ativos", "inativos", "todos"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFiltro(f)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all",
                  filtro === f
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder={`Novo ${title.toLowerCase()}`}
          className="min-w-0 flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleCreate();
            }
          }}
        />
        <Button
          type="button"
          onClick={() => void handleCreate()}
          disabled={creating}
          className="kn-btn-primary shrink-0 gap-1.5"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Adicionar
        </Button>
      </div>

      <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {filtered.map((item) => {
          const isEditing = editId === item.id;
          const busy = actionId === item.id;

          return (
            <li
              key={item.id}
              className={cn(
                "group rounded-xl border px-3 py-2.5 text-sm transition-all",
                item.active === false
                  ? "border-border bg-muted/50 opacity-75"
                  : "border-border/70 bg-card shadow-sm hover:border-primary/25 hover:shadow-md",
                isEditing && "ring-2 ring-primary/30"
              )}
            >
              {isEditing ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleSaveEdit(item.id);
                      }
                      if (e.key === "Escape") {
                        setEditId(null);
                      }
                    }}
                    autoFocus
                    className="flex-1"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={savingEdit}
                      onClick={() => void handleSaveEdit(item.id)}
                      className="kn-btn-primary gap-1"
                    >
                      {savingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Salvar
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditId(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate font-medium",
                        item.active === false && "text-muted-foreground line-through"
                      )}
                    >
                      {item.nome}
                    </p>
                    {item.meta && <p className="mt-0.5 text-xs text-muted-foreground">{item.meta}</p>}
                  </div>
                  <div className="flex shrink-0 gap-0.5 opacity-80 transition group-hover:opacity-100">
                    {item.active !== false ? (
                      <>
                        <ActionBtn
                          title="Editar"
                          onClick={() => {
                            setEditId(item.id);
                            setEditNome(item.nome);
                          }}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </ActionBtn>
                        {onInativar && (
                          <ActionBtn
                            title="Inativar"
                            disabled={busy}
                            onClick={() =>
                              void runAction(item.id, () => onInativar(item.id), `"${item.nome}" inativado.`)
                            }
                            className="hover:bg-amber-500/10 hover:text-amber-700"
                          >
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                          </ActionBtn>
                        )}
                        {onDelete && (
                          <ActionBtn
                            title="Excluir"
                            disabled={busy}
                            onClick={() => setConfirmDelete(item)}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </ActionBtn>
                        )}
                      </>
                    ) : onReativar ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() =>
                          void runAction(item.id, () => onReativar(item.id), `"${item.nome}" reativado.`)
                        }
                        className="gap-1 text-primary"
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                        Reativar
                      </Button>
                    ) : null}
                  </div>
                </div>
              )}
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            Nenhum item encontrado.
          </li>
        )}
      </ul>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title={`Excluir ${title.toLowerCase()}?`}
        description={
          confirmDelete ? (
            <>
              <strong>{confirmDelete.nome}</strong> será removido permanentemente.
            </>
          ) : null
        }
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          if (!confirmDelete || !onDelete) return;
          const item = confirmDelete;
          setConfirmDelete(null);
          void runAction(item.id, () => onDelete(item.id), `"${item.nome}" removido.`);
        }}
      />
    </div>
  );
}

function ActionBtn({
  children,
  title,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-lg p-2 text-muted-foreground transition-all active:scale-90 disabled:opacity-40",
        className
      )}
    >
      {children}
    </button>
  );
}
