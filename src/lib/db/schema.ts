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
