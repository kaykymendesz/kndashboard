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
  Headphones,
  Truck,
  TrendingUp,
  Activity,
  FileText,
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
  Headphones,
  Truck,
  TrendingUp,
  Activity,
  FileText,
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
  { value: "process_category", label: "Categoria de processo" },
  { value: "project_status", label: "Status de projeto" },
  { value: "client_status", label: "Status de cliente" },
] as const;

export type ClassificationType = (typeof CLASSIFICATION_TYPES)[number]["value"];

export const COMPANY_LEGAL_NAME = "K&N Desenvolvimento de Software LTDA";
export const COMPANY_CNPJ = "67.529.522/0001-56";
export const COMPANY_SHORT_NAME = "K&N Desenvolvimento de Software";

export const DEFAULT_MENUS = [
  { label: "Visão Geral", href: "/gestao", icon: "LayoutDashboard", groupLabel: "Navegação", sortOrder: 1 },
  { label: "Financeiro", href: "/financeiro", icon: "PieChart", groupLabel: "Navegação", sortOrder: 2 },
  { label: "Propostas", href: "/propostas", icon: "FileText", groupLabel: "Navegação", sortOrder: 3 },
  { label: "Lucro", href: "/lucro", icon: "TrendingUp", groupLabel: "Navegação", sortOrder: 4 },
  { label: "Gastos", href: "/gastos", icon: "Wallet", groupLabel: "Navegação", sortOrder: 5 },
  { label: "Fornecedores", href: "/fornecedores", icon: "Truck", groupLabel: "Navegação", sortOrder: 6 },
  { label: "Projeto Wikinaya", href: "/projetos/wikinaya", icon: "FolderKanban", groupLabel: "Projetos", sortOrder: 7 },
  { label: "Projetos", href: "/projetos", icon: "FolderKanban", groupLabel: "Projetos", sortOrder: 8 },
  { label: "Cronograma", href: "/cronograma", icon: "Calendar", groupLabel: "Navegação", sortOrder: 9 },
  { label: "Clientes", href: "/clientes", icon: "Users", groupLabel: "Navegação", sortOrder: 10 },
  { label: "Dados da Empresa", href: "/projeto", icon: "Building2", groupLabel: "Empresa", sortOrder: 11 },
  { label: "Configurações", href: "/configuracoes", icon: "Settings", groupLabel: "Sistema", sortOrder: 12 },
  { label: "Painel Operacional", href: "/operacional", icon: "Activity", groupLabel: "Sistema", sortOrder: 13 },
] as const;

export const DEFAULT_ATENDIMENTO_MENUS = [
  { label: "Central de Clientes", href: "/atendimento", icon: "Users", groupLabel: "Atendimento", sortOrder: 1 },
  { label: "Gestão K&N", href: "/gestao", icon: "LayoutDashboard", groupLabel: "Sistema", sortOrder: 1 },
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
  { type: "schedule_status", name: "Concluído", color: "#16a34a", sortOrder: 5 },
  { type: "process_category", name: "Análise", color: "#2563eb", sortOrder: 1 },
  { type: "process_category", name: "Execução", color: "#3b82f6", sortOrder: 2 },
  { type: "project_status", name: "Prospecção", color: "#6366f1", sortOrder: 1 },
  { type: "project_status", name: "Levantamento", color: "#8b5cf6", sortOrder: 2 },
  { type: "project_status", name: "Cotação", color: "#a855f7", sortOrder: 3 },
  { type: "project_status", name: "Em desenvolvimento", color: "#2563eb", sortOrder: 4 },
  { type: "project_status", name: "Homologação", color: "#0ea5e9", sortOrder: 5 },
  { type: "project_status", name: "Implantação", color: "#14b8a6", sortOrder: 6 },
  { type: "project_status", name: "Concluído", color: "#16a34a", sortOrder: 7 },
  { type: "project_status", name: "Cancelado", color: "#64748b", sortOrder: 8 },
] as const;
