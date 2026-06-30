export type ProposalContactConfig = {
  name: string;
  role: string;
  phone: string;
};

export type ProposalLayoutConfig = {
  logoUrl?: string;
  subtitle?: string;
  titleLine1?: string;
  titleLine2?: string;
  legalName?: string;
  city?: string;
  contact1?: ProposalContactConfig;
  contact2?: ProposalContactConfig;
  colors?: {
    purple?: string;
    blue?: string;
  };
  bodyPaddingMm?: number;
  showPageNumber?: boolean;
};

export const DEFAULT_LAYOUT_CONFIG: ProposalLayoutConfig = {
  logoUrl: "/kn-logo.png",
  subtitle: "Tecnologia",
  titleLine1: "Proposta",
  titleLine2: "Comercial",
  legalName: "K & N DESENVOLVIMENTO DE SOFTWARES LTDA",
  city: "São Paulo - SP",
  contact1: {
    name: "Kayky Mendes",
    role: "Desenvolvimento • Tecnologia",
    phone: "11 99484-0027",
  },
  contact2: {
    name: "Elaine Anaya",
    role: "Relacionamento • Gestão de Projetos",
    phone: "11 91369-3011",
  },
  colors: {
    purple: "#8e2de2",
    blue: "#4a00e0",
  },
  bodyPaddingMm: 24,
  showPageNumber: true,
};

export function parseLayoutConfig(raw: string | null | undefined): ProposalLayoutConfig {
  if (!raw) return { ...DEFAULT_LAYOUT_CONFIG };
  try {
    const parsed = JSON.parse(raw) as Partial<ProposalLayoutConfig>;
    return {
      ...DEFAULT_LAYOUT_CONFIG,
      ...parsed,
      contact1: { ...DEFAULT_LAYOUT_CONFIG.contact1!, ...parsed.contact1 },
      contact2: { ...DEFAULT_LAYOUT_CONFIG.contact2!, ...parsed.contact2 },
      colors: { ...DEFAULT_LAYOUT_CONFIG.colors, ...parsed.colors },
    };
  } catch {
    return { ...DEFAULT_LAYOUT_CONFIG };
  }
}

export function mergeLayoutWithForm(
  layout: ProposalLayoutConfig,
  city?: string
): ProposalLayoutConfig {
  return {
    ...layout,
    city: city || layout.city,
  };
}
