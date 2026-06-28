import { ClientsManager } from "@/components/clients-manager";
import { getClientsWithSummary } from "@/lib/actions/clients";

export default async function ClientesPage() {
  const items = await getClientsWithSummary();
  return <ClientsManager items={items} />;
}
