export type ProposalServiceItem = {
  id: number;
  name: string;
  category?: string;
  description?: string;
};

export type ProposalPaymentTerms = {
  methods: string[];
  installments: number;
  downPayment: number;
  installmentValue: number;
  notes: string;
};

export type ProposalFormData = {
  templateId?: number | null;
  status: string;
  clientId?: number | null;
  clientName: string;
  clientCompany: string;
  clientDocument: string;
  clientResponsible: string;
  clientEmail: string;
  clientPhone: string;
  projectName: string;
  serviceType: string;
  category: string;
  projectObjective: string;
  description: string;
  includedItems: string;
  devValue: string;
  monthlyValue: string;
  domainValue: string;
  hostingValue: string;
  sslValue: string;
  additionalValue: string;
  discountValue: string;
  totalValue: string;
  paymentMethods: string[];
  installments: string;
  downPayment: string;
  installmentValue: string;
  paymentNotes: string;
  validityDays: string;
  issuedAt: string;
  validUntil: string;
  deliveryDeadline: string;
  city: string;
  observations: string;
  selectedServices: ProposalServiceItem[];
  selectedGuarantees: string[];
  customLayout: string;
};

export const DEFAULT_PROPOSAL_FORM: ProposalFormData = {
  status: "Em elaboração",
  clientName: "",
  clientCompany: "",
  clientDocument: "",
  clientResponsible: "",
  clientEmail: "",
  clientPhone: "",
  projectName: "",
  serviceType: "",
  category: "",
  projectObjective: "",
  description: "",
  includedItems: "",
  devValue: "0",
  monthlyValue: "0",
  domainValue: "0",
  hostingValue: "0",
  sslValue: "0",
  additionalValue: "0",
  discountValue: "0",
  totalValue: "0",
  paymentMethods: ["PIX"],
  installments: "1",
  downPayment: "0",
  installmentValue: "0",
  paymentNotes: "",
  validityDays: "60",
  issuedAt: new Date().toISOString().slice(0, 10),
  validUntil: "",
  deliveryDeadline: "",
  city: "São Paulo - SP",
  observations: "",
  selectedServices: [],
  selectedGuarantees: [],
  customLayout: "{}",
};

export type ProposalDocumentData = {
  proposalNumber: string;
  issuedAt: string;
  validUntil: string;
  clientName: string;
  clientCompany: string;
  clientDocument: string;
  clientResponsible: string;
  clientEmail: string;
  clientPhone: string;
  projectName: string;
  serviceType: string;
  category: string;
  projectObjective: string;
  description: string;
  includedItems: string;
  services: ProposalServiceItem[];
  guarantees: string[];
  devValue: number;
  monthlyValue: number;
  domainValue: number;
  hostingValue: number;
  sslValue: number;
  additionalValue: number;
  discountValue: number;
  totalValue: number;
  paymentMethods: string[];
  installments: number;
  downPayment: number;
  installmentValue: number;
  paymentNotes: string;
  deliveryDeadline: string;
  city: string;
  observations: string;
  pageNumber?: number;
  totalPages?: number;
};
