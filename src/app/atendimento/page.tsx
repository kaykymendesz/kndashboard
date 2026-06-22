import Link from "next/link";
import { MessageCircle, Mail, Clock, CheckCircle2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { COMPANY_LEGAL_NAME } from "@/lib/constants";

const services = [
  {
    icon: MessageCircle,
    title: "Suporte técnico",
    description: "Dúvidas sobre projetos em andamento, apps e entregas da K&N.",
  },
  {
    icon: CheckCircle2,
    title: "Acompanhamento",
    description: "Status de solicitações, prazos e próximos passos do seu projeto.",
  },
  {
    icon: Clock,
    title: "Novas demandas",
    description: "Abertura de chamados para melhorias, correções ou novos desenvolvimentos.",
  },
];

export default function AtendimentoPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Central de Atendimento K&N
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl leading-relaxed">
          Bem-vindo à área de clientes da {COMPANY_LEGAL_NAME}. Aqui você acompanha suporte e solicitações — separado do painel interno de gestão.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {services.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="kn-card">
            <CardHeader className="pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 mb-2">
                <Icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="kn-card border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 to-white">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5 text-emerald-700" />
            Fale com a K&N
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para abrir um atendimento ou consultar seu projeto, entre em contato com nossa equipe. Em breve esta área terá login e chamados online.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2">
              <a href="mailto:contato@kn.dev">contato@kn.dev</a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar à escolha de área
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
