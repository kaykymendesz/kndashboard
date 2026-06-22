import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Wallet,
  ListTodo,
  Calendar,
  Users,
  Building2,
  PieChart,
  FolderKanban,
  Settings,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Wallet,
  ListTodo,
  Calendar,
  Users,
  Building2,
  PieChart,
  FolderKanban,
  Settings,
};

export const ICON_OPTIONS = Object.keys(ICON_MAP);

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? LayoutDashboard;
}

export const CLASSIFICATION_TYPES = [
  { value: "expense_category", label: "Categoria de gasto" },
  { value: "activity_status", label: "Status de atividade" },
  { value: "activity_priority", label: "Prioridade de atividade" },
  { value: "schedule_status", label: "Status do cronograma" },
  { value: "project_status", label: "Status de projeto" },
  { value: "client_status", label: "Status de cliente" },
] as const;

export type ClassificationType = (typeof CLASSIFICATION_TYPES)[number]["value"];

export const COMPANY_LEGAL_NAME = "K&N Desenvolvimento de Software LTDA";
export const COMPANY_SHORT_NAME = "K&N Desenvolvimento de Software";

export const DEFAULT_MENUS = [
  { label: "Visão Geral", href: "/", icon: "LayoutDashboard", groupLabel: "Navegação", sortOrder: 1 },
  { label: "Financeiro", href: "/financeiro", icon: "PieChart", groupLabel: "Navegação", sortOrder: 2 },
  { label: "Gastos", href: "/gastos", icon: "Wallet", groupLabel: "Navegação", sortOrder: 3 },
  { label: "Projetos", href: "/projetos", icon: "FolderKanban", groupLabel: "Navegação", sortOrder: 4 },
  { label: "Cronograma", href: "/cronograma", icon: "Calendar", groupLabel: "Navegação", sortOrder: 5 },
  { label: "Atividades Wikinaya", href: "/atividades", icon: "ListTodo", groupLabel: "Wikinaya", sortOrder: 6 },
  { label: "Clientes", href: "/clientes", icon: "Users", groupLabel: "Navegação", sortOrder: 7 },
  { label: "Dados da Empresa", href: "/projeto", icon: "Building2", groupLabel: "Empresa", sortOrder: 8 },
  { label: "Configurações", href: "/configuracoes", icon: "Settings", groupLabel: "Sistema", sortOrder: 9 },
] as const;

export const DEFAULT_CLASSIFICATIONS = [
  { type: "expense_category", name: "Domínio", color: "#1e3a5f", sortOrder: 1 },
  { type: "expense_category", name: "Play Store", color: "#2563eb", sortOrder: 2 },
  { type: "expense_category", name: "Desenvolvimento", color: "#3b82f6", sortOrder: 3 },
  { type: "expense_category", name: "Legalização", color: "#64748b", sortOrder: 4 },
  { type: "expense_category", name: "Impostos", color: "#94a3b8", sortOrder: 5 },
  { type: "activity_status", name: "Funcionando", color: "#16a34a", sortOrder: 1 },
  { type: "activity_status", name: "Erro", color: "#dc2626", sortOrder: 2 },
  { type: "activity_status", name: "A fazer", color: "#f59e0b", sortOrder: 3 },
  { type: "activity_status", name: "Planejamento", color: "#6366f1", sortOrder: 4 },
  { type: "activity_priority", name: "Crítica", color: "#dc2626", sortOrder: 1 },
  { type: "activity_priority", name: "Alta", color: "#f59e0b", sortOrder: 2 },
  { type: "activity_priority", name: "Média", color: "#3b82f6", sortOrder: 3 },
  { type: "activity_priority", name: "Baixa", color: "#94a3b8", sortOrder: 4 },
] as const;
