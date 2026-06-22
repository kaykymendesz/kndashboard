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

export const projectInfo = pgTable("project_info", {
  id: serial("id").primaryKey(),
  section: varchar("section", { length: 100 }).notNull(),
  field: varchar("field", { length: 200 }).notNull(),
  value: text("value").notNull().default(""),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
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
  plannedDate: timestamp("planned_date"),
  title: varchar("title", { length: 300 }).notNull(),
  category: varchar("category", { length: 100 }).default(""),
  priority: varchar("priority", { length: 20 }).default("Média"),
  status: varchar("status", { length: 50 }).default("Planejado"),
  plannedValue: numeric("planned_value", { precision: 12, scale: 2 }),
  actualValue: numeric("actual_value", { precision: 12, scale: 2 }),
  difference: numeric("difference", { precision: 12, scale: 2 }),
  responsible: varchar("responsible", { length: 100 }).default(""),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: varchar("description", { length: 300 }).notNull(),
  category: varchar("category", { length: 100 }).default(""),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
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

export type ProjectInfo = typeof projectInfo.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type ScheduleItem = typeof scheduleItems.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Client = typeof clients.$inferSelect;
