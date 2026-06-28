import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/atendimento", destination: "/clientes", permanent: false },
      { source: "/atendimento/clientes/:slug", destination: "/clientes/:slug", permanent: false },
      { source: "/atendimento/clientes/:slug/nova-demanda", destination: "/clientes/:slug/novo-projeto", permanent: false },
      { source: "/atendimento/clientes/:slug/nova-cotacao", destination: "/clientes/:slug/novo-projeto", permanent: false },
      { source: "/atendimento/demandas/:id", destination: "/clientes", permanent: false },
      { source: "/atendimento/cotacoes/:id", destination: "/clientes", permanent: false },
    ];
  },
};

export default nextConfig;
