import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description").default(""),
  status: varchar("status", { length: 50 }).default("Ativo"),
  projectType: varchar("project_type", { length: 30 }).default("interno"),
  clientId: integer("client_id").references(() => clients.id),
  contractedRevenue: numeric("contracted_revenue", { precision: 12, scale: 2 }),
  proposalId: integer("proposal_id"),
  suggestedPrice: numeric("suggested_price", { precision: 12, scale: 2 }),
  negotiatedPrice: numeric("negotiated_price", { precision: 12, scale: 2 }),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }),
  discountReason: text("discount_reason").default(""),
  color: varchar("color", { length: 20 }).default("#1e3a5f"),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectInfo = pgTable("project_info", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  section: varchar("section", { length: 100 }).notNull(),
  field: varchar("field", { length: 200 }).notNull(),
  value: text("value").notNull().default(""),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  externalId: varchar("external_id", { length: 20 }),
  area: varchar("area", { length: 100 }).notNull().default(""),
  feature: varchar("feature", { length: 200 }).notNull().default(""),
  description: text("description").default(""),
  status: varchar("status", { length: 50 }).notNull().default("A fazer"),
  priority: varchar("priority", { length: 20 }).notNull().default("Média"),
  responsible: varchar("responsible", { length: 100 }).default(""),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scheduleItems = pgTable("schedule_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  flowId: integer("flow_id"),
  plannedDate: timestamp("planned_date"),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").default(""),
  category: varchar("category", { length: 100 }).default(""),
  priority: varchar("priority", { length: 20 }).default("Média"),
  status: varchar("status", { length: 50 }).default("Planejado"),
  plannedValue: numeric("planned_value", { precision: 12, scale: 2 }),
  actualValue: numeric("actual_value", { precision: 12, scale: 2 }),
  difference: numeric("difference", { precision: 12, scale: 2 }),
  responsible: varchar("responsible", { length: 100 }).default(""),
  notes: text("notes").default(""),
  hasCost: boolean("has_cost").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  clientId: integer("client_id").references(() => clients.id),
  description: varchar("description", { length: 300 }).notNull(),
  expenseType: varchar("expense_type", { length: 20 }).default("Único"),
  planVariant: varchar("plan_variant", { length: 100 }).default(""),
  planNotes: text("plan_notes").default(""),
  category: varchar("category", { length: 100 }).default(""),
  vendorId: integer("vendor_id").references(() => vendors.id),
  vendor: varchar("vendor", { length: 200 }).default(""),
  purchaseDate: timestamp("purchase_date"),
  financialResponsible: varchar("financial_responsible", { length: 100 }).default(""),
  totalValue: numeric("total_value", { precision: 12, scale: 2 }).notNull().default("0"),
  elaineShare: numeric("elaine_share", { precision: 12, scale: 2 }).default("0"),
  kaykyShare: numeric("kayky_share", { precision: 12, scale: 2 }).default("0"),
  isInstallment: boolean("is_installment").default(false),
  installmentCount: integer("installment_count").default(1),
  installmentValue: numeric("installment_value", { precision: 12, scale: 2 }),
  paidInstallments: integer("paid_installments").default(0),
  remainingInstallments: integer("remaining_installments").default(0),
  status: varchar("status", { length: 50 }).default("Pendente"),
  dueDate: timestamp("due_date"),
  paymentMethod: varchar("payment_method", { length: 50 }).default(""),
  paidBy: varchar("paid_by", { length: 100 }).default(""),
  elaineSettled: boolean("elaine_settled").default(false),
  kaykySettled: boolean("kayky_settled").default(false),
  elainePending: numeric("elaine_pending", { precision: 12, scale: 2 }).default("0"),
  kaykyPending: numeric("kayky_pending", { precision: 12, scale: 2 }).default("0"),
  linkedEmail: varchar("linked_email", { length: 200 }).default(""),
  autoRenew: boolean("auto_renew").default(false),
  expirationDate: timestamp("expiration_date"),
  registeredBy: varchar("registered_by", { length: 100 }).default(""),
  scheduleItemId: integer("schedule_item_id").references(() => scheduleItems.id),
  hasCost: boolean("has_cost").default(true),
  contractedPlan: varchar("contracted_plan", { length: 100 }).default(""),
  contractedPlanValue: numeric("contracted_plan_value", { precision: 12, scale: 2 }),
  planChangeVariant: varchar("plan_change_variant", { length: 100 }).default(""),
  planChangeDate: timestamp("plan_change_date"),
  paymentType: varchar("payment_type", { length: 50 }).default(""),
  paymentCard: varchar("payment_card", { length: 120 }).default(""),
  expenseScope: varchar("expense_scope", { length: 30 }).default("kn_interno"),
  costCenter: varchar("cost_center", { length: 300 }).default(""),
  paymentResponsible: varchar("payment_responsible", { length: 50 }).default("K&N"),
  reimbursementStatus: varchar("reimbursement_status", { length: 50 }).default("Não possui"),
  hasSubscription: boolean("has_subscription").default(false),
  subscriptionPlan: varchar("subscription_plan", { length: 50 }).default(""),
  subscriptionRecurrence: varchar("subscription_recurrence", { length: 50 }).default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  category: varchar("category", { length: 100 }).default(""),
  email: varchar("email", { length: 200 }).default(""),
  phone: varchar("phone", { length: 50 }).default(""),
  notes: text("notes").default(""),
  status: varchar("status", { length: 50 }).default("Ativo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const revenues = pgTable("revenues", {
  id: serial("id").primaryKey(),
  description: varchar("description", { length: 300 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  receivedDate: timestamp("received_date"),
  category: varchar("category", { length: 100 }).default(""),
  status: varchar("status", { length: 50 }).default("Recebido"),
  projectId: integer("project_id").references(() => projects.id),
  clientId: integer("client_id").references(() => clients.id),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const expensePlanChanges = pgTable("expense_plan_changes", {
  id: serial("id").primaryKey(),
  expenseId: integer("expense_id")
    .notNull()
    .references(() => expenses.id, { onDelete: "cascade" }),
  planName: varchar("plan_name", { length: 100 }).notNull().default(""),
  planValue: numeric("plan_value", { precision: 12, scale: 2 }),
  changeDate: timestamp("change_date"),
  notes: text("notes").default(""),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 120 }).unique(),
  company: varchar("company", { length: 200 }).default(""),
  email: varchar("email", { length: 200 }).default(""),
  phone: varchar("phone", { length: 50 }).default(""),
  project: varchar("project", { length: 200 }).default(""),
  status: varchar("status", { length: 50 }).default("Ativo"),
  contractValue: numeric("contract_value", { precision: 12, scale: 2 }),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  label: varchar("label", { length: 100 }).notNull(),
  href: varchar("href", { length: 200 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull().default("LayoutDashboard"),
  groupLabel: varchar("group_label", { length: 100 }).default("Navegação"),
  sortOrder: integer("sort_order").default(0),
  visible: boolean("visible").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const classifications = pgTable("classifications", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).default("#1e3a5f"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const processFlows = pgTable("process_flows", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").default(""),
  isDefault: boolean("is_default").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const processSteps = pgTable("process_steps", {
  id: serial("id").primaryKey(),
  flowId: integer("flow_id")
    .notNull()
    .references(() => processFlows.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 100 }).default(""),
  description: text("description").default(""),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scheduleProcesses = pgTable("schedule_processes", {
  id: serial("id").primaryKey(),
  scheduleItemId: integer("schedule_item_id")
    .notNull()
    .references(() => scheduleItems.id, { onDelete: "cascade" }),
  stepId: integer("step_id").references(() => processSteps.id),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 100 }).default(""),
  status: varchar("status", { length: 50 }).default("Pendente"),
  notes: text("notes").default(""),
  sortOrder: integer("sort_order").default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").default(""),
  value: numeric("value", { precision: 12, scale: 2 }).default("0"),
  status: varchar("status", { length: 50 }).default("Rascunho"),
  validUntil: timestamp("valid_until"),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attendanceCases = pgTable("attendance_cases", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  quotationId: integer("quotation_id").references(() => quotations.id),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").default(""),
  demandType: varchar("demand_type", { length: 50 }).default("Novo projeto"),
  status: varchar("status", { length: 50 }).default("Aguardando"),
  responsible: varchar("responsible", { length: 100 }).default(""),
  notes: text("notes").default(""),
  attendedAt: timestamp("attended_at"),
  finishedAt: timestamp("finished_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attendanceSteps = pgTable("attendance_steps", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id")
    .notNull()
    .references(() => attendanceCases.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 100 }).default(""),
  status: varchar("status", { length: 50 }).default("Pendente"),
  notes: text("notes").default(""),
  sortOrder: integer("sort_order").default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type ProjectInfo = typeof projectInfo.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type ScheduleItem = typeof scheduleItems.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type ExpensePlanChange = typeof expensePlanChanges.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type Revenue = typeof revenues.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type Classification = typeof classifications.$inferSelect;
export type ProcessFlow = typeof processFlows.$inferSelect;
export type ProcessStep = typeof processSteps.$inferSelect;
export type ScheduleProcess = typeof scheduleProcesses.$inferSelect;
export type Quotation = typeof quotations.$inferSelect;
export type AttendanceCase = typeof attendanceCases.$inferSelect;
export type AttendanceStep = typeof attendanceSteps.$inferSelect;

export const proposalTemplates = pgTable("proposal_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  templateType: varchar("template_type", { length: 50 }).default("proposta_comercial"),
  layoutConfig: text("layout_config").default("{}"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const proposalServiceCatalog = pgTable("proposal_service_catalog", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 100 }).default(""),
  description: text("description").default(""),
  defaultValue: numeric("default_value", { precision: 12, scale: 2 }),
  sortOrder: integer("sort_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const proposalGuaranteeCatalog = pgTable("proposal_guarantee_catalog", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").default(""),
  sortOrder: integer("sort_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commercialProposals = pgTable("commercial_proposals", {
  id: serial("id").primaryKey(),
  proposalNumber: varchar("proposal_number", { length: 30 }).notNull().unique(),
  templateId: integer("template_id").references(() => proposalTemplates.id),
  status: varchar("status", { length: 50 }).default("Em elaboração"),
  version: integer("version").default(1),
  clientId: integer("client_id").references(() => clients.id),
  projectId: integer("project_id").references(() => projects.id),
  clientName: varchar("client_name", { length: 200 }).default(""),
  clientCompany: varchar("client_company", { length: 200 }).default(""),
  clientDocument: varchar("client_document", { length: 50 }).default(""),
  clientResponsible: varchar("client_responsible", { length: 200 }).default(""),
  clientEmail: varchar("client_email", { length: 200 }).default(""),
  clientPhone: varchar("client_phone", { length: 50 }).default(""),
  projectName: varchar("project_name", { length: 300 }).notNull().default(""),
  serviceType: varchar("service_type", { length: 100 }).default(""),
  category: varchar("category", { length: 100 }).default(""),
  projectObjective: text("project_objective").default(""),
  description: text("description").default(""),
  includedItems: text("included_items").default(""),
  devValue: numeric("dev_value", { precision: 12, scale: 2 }).default("0"),
  monthlyValue: numeric("monthly_value", { precision: 12, scale: 2 }).default("0"),
  domainValue: numeric("domain_value", { precision: 12, scale: 2 }).default("0"),
  hostingValue: numeric("hosting_value", { precision: 12, scale: 2 }).default("0"),
  sslValue: numeric("ssl_value", { precision: 12, scale: 2 }).default("0"),
  additionalValue: numeric("additional_value", { precision: 12, scale: 2 }).default("0"),
  discountValue: numeric("discount_value", { precision: 12, scale: 2 }).default("0"),
  totalValue: numeric("total_value", { precision: 12, scale: 2 }).default("0"),
  paymentMethods: text("payment_methods").default("[]"),
  installments: integer("installments").default(1),
  downPayment: numeric("down_payment", { precision: 12, scale: 2 }).default("0"),
  installmentValue: numeric("installment_value", { precision: 12, scale: 2 }).default("0"),
  paymentNotes: text("payment_notes").default(""),
  validityDays: integer("validity_days").default(60),
  issuedAt: timestamp("issued_at"),
  validUntil: timestamp("valid_until"),
  deliveryDeadline: varchar("delivery_deadline", { length: 200 }).default(""),
  city: varchar("city", { length: 100 }).default("São Paulo - SP"),
  observations: text("observations").default(""),
  selectedServices: text("selected_services").default("[]"),
  selectedGuarantees: text("selected_guarantees").default("[]"),
  customLayout: text("custom_layout").default("{}"),
  createdBy: varchar("created_by", { length: 200 }).default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const proposalVersions = pgTable("proposal_versions", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id")
    .notNull()
    .references(() => commercialProposals.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  snapshot: text("snapshot").notNull(),
  changeNote: text("change_note").default(""),
  createdBy: varchar("created_by", { length: 200 }).default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const proposalExports = pgTable("proposal_exports", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id")
    .notNull()
    .references(() => commercialProposals.id, { onDelete: "cascade" }),
  format: varchar("format", { length: 20 }).notNull(),
  versionNumber: integer("version_number"),
  createdBy: varchar("created_by", { length: 200 }).default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ProposalTemplate = typeof proposalTemplates.$inferSelect;
export type ProposalServiceCatalog = typeof proposalServiceCatalog.$inferSelect;
export type ProposalGuaranteeCatalog = typeof proposalGuaranteeCatalog.$inferSelect;
export type CommercialProposal = typeof commercialProposals.$inferSelect;
export type ProposalVersion = typeof proposalVersions.$inferSelect;
export type ProposalExport = typeof proposalExports.$inferSelect;

export const PROPOSAL_STATUSES = [
  "Em elaboração",
  "Enviada",
  "Em negociação",
  "Aprovada",
  "Recusada",
  "Cancelada",
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const PROPOSAL_PAYMENT_METHODS = ["PIX", "Cartão", "Boleto", "Nota Fiscal"] as const;

/** Histórico de verificações do Painel Operacional */
export const monitorCheckLogs = pgTable("monitor_check_logs", {
  id: serial("id").primaryKey(),
  serviceId: varchar("service_id", { length: 80 }).notNull(),
  status: varchar("status", { length: 30 }).notNull(),
  responseTimeMs: integer("response_time_ms"),
  httpStatus: integer("http_status"),
  errorMessage: text("error_message"),
  plainSummary: text("plain_summary").notNull().default(""),
  technicalDetail: text("technical_detail"),
  suggestedSteps: text("suggested_steps").default("[]"),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});

export type MonitorCheckLog = typeof monitorCheckLogs.$inferSelect;

export const appUsers = pgTable("app_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AppUser = typeof appUsers.$inferSelect;

export const EXPENSE_TYPES = ["Anual", "Mensal", "Único"] as const;
export type ExpenseType = (typeof EXPENSE_TYPES)[number];

export const PAYMENT_TYPES = ["Crédito", "Débito", "PIX", "Boleto", "Transferência", "Dinheiro"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const PROCESS_STATUSES = ["Pendente", "Em andamento", "Concluído", "Cancelado"] as const;

export const ATTENDANCE_STATUSES = ["Aguardando", "Em atendimento", "Finalizado", "Cancelado"] as const;
export const ATTENDANCE_TYPES = ["Novo projeto", "Cotação", "Suporte", "Melhoria"] as const;
export const QUOTATION_STATUSES = ["Rascunho", "Enviada", "Aprovada", "Recusada"] as const;

export const DEFAULT_ATTENDANCE_STEPS = [
  { name: "Receber demanda", category: "Análise", sortOrder: 1 },
  { name: "Levantamento de requisitos", category: "Análise", sortOrder: 2 },
  { name: "Elaborar cotação", category: "Documentação", sortOrder: 3 },
  { name: "Aprovação do cliente", category: "Aprovação", sortOrder: 4 },
  { name: "Execução do projeto", category: "Execução", sortOrder: 5 },
  { name: "Entrega e finalização", category: "Aprovação", sortOrder: 6 },
] as const;

export const WIKINAYA_SLUG = "wikinaya";
export const COMPANY_PROJECT_SLUG = "kn-empresa";

export const REVENUE_STATUSES = ["Recebido", "Pendente"] as const;
export type RevenueStatus = (typeof REVENUE_STATUSES)[number];

export const PROJECT_TYPES = ["interno", "cliente", "arquivado"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const EXPENSE_SCOPES = ["kn_interno", "kn_geral", "projeto_cliente"] as const;
export type ExpenseScope = (typeof EXPENSE_SCOPES)[number];

export const PAYMENT_RESPONSIBLES = ["K&N", "Cliente", "Terceiro"] as const;
export type PaymentResponsible = (typeof PAYMENT_RESPONSIBLES)[number];

export const REIMBURSEMENT_STATUSES = [
  "Não possui",
  "Aguardando reembolso",
  "Reembolsado",
] as const;
export type ReimbursementStatus = (typeof REIMBURSEMENT_STATUSES)[number];

export const SUBSCRIPTION_PLANS = [
  "Starter",
  "Pro",
  "Pro+",
  "Business",
  "Enterprise",
  "Outro",
] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const SUBSCRIPTION_RECURRENCES = [
  "Pagamento único",
  "Mensal",
  "Trimestral",
  "Semestral",
  "Anual",
  "Personalizado",
] as const;
export type SubscriptionRecurrence = (typeof SUBSCRIPTION_RECURRENCES)[number];

export const PROJECT_LIFECYCLE_STATUSES = [
  "Prospecção",
  "Levantamento",
  "Cotação",
  "Em desenvolvimento",
  "Homologação",
  "Implantação",
  "Concluído",
  "Cancelado",
] as const;
export type ProjectLifecycleStatus = (typeof PROJECT_LIFECYCLE_STATUSES)[number];

export const DEFAULT_CLIENT_PROJECT_STATUS: ProjectLifecycleStatus = "Prospecção";
export const DEFAULT_INTERNAL_PROJECT_STATUS = "Ativo";

export function isArchivedProject(project: { projectType?: string | null; status?: string | null }) {
  return (
    project.projectType === "arquivado" ||
    (project.status?.toLowerCase().includes("arquiv") ?? false)
  );
}

export function isClosedProject(status?: string | null) {
  return status === "Concluído" || status === "Cancelado";
}

export function canAcceptNewExpenses(project: {
  projectType?: string | null;
  status?: string | null;
}) {
  if (isArchivedProject(project)) return false;
  if (isClosedProject(project.status)) return false;
  return true;
}

export function lifecycleStatusVariant(status?: string | null): "default" | "secondary" | "destructive" | "outline" {
  if (status === "Cancelado") return "destructive";
  if (status === "Concluído") return "default";
  if (status === "Cotação" || status === "Prospecção" || status === "Levantamento") return "outline";
  return "secondary";
}

// ─── ERP v2.0 — Catálogos e composição financeira ───────────────────────────

export const CLIENT_STATUSES = [
  "Cliente ativo",
  "Cliente inativo",
  "Cliente potencial",
  "Cliente encerrado",
] as const;

export const CATALOG_PERIODICITIES = [
  "Pagamento único",
  "Mensal",
  "Trimestral",
  "Semestral",
  "Anual",
] as const;

export const COMPOSITION_LINE_TYPES = ["infraestrutura", "mao_obra", "custo_exclusivo"] as const;
export type CompositionLineType = (typeof COMPOSITION_LINE_TYPES)[number];

export const FINANCIAL_ENTRY_TYPES = ["receber", "pagar"] as const;
export type FinancialEntryType = (typeof FINANCIAL_ENTRY_TYPES)[number];

export const FINANCIAL_ENTRY_STATUSES = ["Pendente", "Parcial", "Quitado", "Cancelado"] as const;

export const FINANCIAL_ORIGIN_TYPES = [
  "proposta",
  "projeto",
  "gasto",
  "cronograma",
  "reembolso",
  "distribuicao",
  "mensalidade",
  "manual",
] as const;

export const FINANCIAL_COST_TYPES = [
  "Infraestrutura",
  "Mão de Obra",
  "Custo Exclusivo",
  "Administrativo",
  "Reembolso",
  "Investimento",
] as const;

export const catalogInfrastructure = pgTable("catalog_infrastructure", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  vendor: varchar("vendor", { length: 200 }).default(""),
  description: text("description").default(""),
  periodicity: varchar("periodicity", { length: 50 }).default("Mensal"),
  companyCost: numeric("company_cost", { precision: 12, scale: 2 }).default("0"),
  compositionValue: numeric("composition_value", { precision: 12, scale: 2 }).default("0"),
  category: varchar("category", { length: 100 }).default("Infraestrutura"),
  notes: text("notes").default(""),
  active: boolean("active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const catalogLabor = pgTable("catalog_labor", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").default(""),
  defaultValue: numeric("default_value", { precision: 12, scale: 2 }).default("0"),
  category: varchar("category", { length: 100 }).default("Mão de Obra"),
  notes: text("notes").default(""),
  active: boolean("active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const catalogExclusiveCosts = pgTable("catalog_exclusive_costs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").default(""),
  defaultValue: numeric("default_value", { precision: 12, scale: 2 }).default("0"),
  category: varchar("category", { length: 100 }).default("Custo Exclusivo"),
  notes: text("notes").default(""),
  active: boolean("active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const companySettings = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 120 }).notNull().unique(),
  value: text("value").notNull().default("{}"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectCompositions = pgTable("project_compositions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" })
    .unique(),
  proposalId: integer("proposal_id").references(() => commercialProposals.id),
  infraTotal: numeric("infra_total", { precision: 12, scale: 2 }).default("0"),
  laborTotal: numeric("labor_total", { precision: 12, scale: 2 }).default("0"),
  exclusiveTotal: numeric("exclusive_total", { precision: 12, scale: 2 }).default("0"),
  suggestedPrice: numeric("suggested_price", { precision: 12, scale: 2 }).default("0"),
  negotiatedPrice: numeric("negotiated_price", { precision: 12, scale: 2 }).default("0"),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).default("0"),
  discountPercent: numeric("discount_percent", { precision: 8, scale: 4 }).default("0"),
  discountReason: text("discount_reason").default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectCompositionLines = pgTable("project_composition_lines", {
  id: serial("id").primaryKey(),
  compositionId: integer("composition_id")
    .notNull()
    .references(() => projectCompositions.id, { onDelete: "cascade" }),
  lineType: varchar("line_type", { length: 30 }).notNull(),
  catalogId: integer("catalog_id"),
  label: varchar("label", { length: 300 }).notNull(),
  compositionValue: numeric("composition_value", { precision: 12, scale: 2 }).notNull().default("0"),
  companyCost: numeric("company_cost", { precision: 12, scale: 2 }),
  notes: text("notes").default(""),
  sortOrder: integer("sort_order").default(0),
});

/** Ledger unificado — contas a receber/pagar com rastreabilidade (ERP v2) */
export const financialEntries = pgTable("financial_entries", {
  id: serial("id").primaryKey(),
  entryType: varchar("entry_type", { length: 20 }).notNull(),
  originType: varchar("origin_type", { length: 30 }).notNull().default("manual"),
  originId: integer("origin_id"),
  description: varchar("description", { length: 400 }).notNull(),
  originalAmount: numeric("original_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 30 }).default("Pendente"),
  dueDate: timestamp("due_date"),
  clientId: integer("client_id").references(() => clients.id),
  projectId: integer("project_id").references(() => projects.id),
  vendorId: integer("vendor_id").references(() => vendors.id),
  category: varchar("category", { length: 100 }).default(""),
  costType: varchar("cost_type", { length: 50 }).default(""),
  financialResponsible: varchar("financial_responsible", { length: 100 }).default(""),
  paymentMethod: varchar("payment_method", { length: 50 }).default(""),
  isReimbursable: boolean("is_reimbursable").default(false),
  recurrence: varchar("recurrence", { length: 50 }).default("Pagamento único"),
  notes: text("notes").default(""),
  createdBy: varchar("created_by", { length: 200 }).default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const financialEntryPayments = pgTable("financial_entry_payments", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id")
    .notNull()
    .references(() => financialEntries.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).default(""),
  notes: text("notes").default(""),
  createdBy: varchar("created_by", { length: 200 }).default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const financialEntryHistory = pgTable("financial_entry_history", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id")
    .notNull()
    .references(() => financialEntries.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  snapshot: text("snapshot").default("{}"),
  note: text("note").default(""),
  createdBy: varchar("created_by", { length: 200 }).default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CatalogInfrastructure = typeof catalogInfrastructure.$inferSelect;
export type CatalogLabor = typeof catalogLabor.$inferSelect;
export type CatalogExclusiveCost = typeof catalogExclusiveCosts.$inferSelect;
export type CompanySetting = typeof companySettings.$inferSelect;
export type ProjectComposition = typeof projectCompositions.$inferSelect;
export type ProjectCompositionLine = typeof projectCompositionLines.$inferSelect;
export type FinancialEntry = typeof financialEntries.$inferSelect;
export type FinancialEntryPayment = typeof financialEntryPayments.$inferSelect;
export type FinancialEntryHistory = typeof financialEntryHistory.$inferSelect;

export const expensePartnerPayments = pgTable("expense_partner_payments", {
  id: serial("id").primaryKey(),
  expenseId: integer("expense_id")
    .notNull()
    .references(() => expenses.id, { onDelete: "cascade" }),
  partnerSlug: varchar("partner_slug", { length: 50 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes").default(""),
  createdBy: varchar("created_by", { length: 200 }).default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ExpensePartnerPayment = typeof expensePartnerPayments.$inferSelect;
