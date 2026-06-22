import { ClientsManager } from "@/components/clients-manager";
import { getClients } from "@/lib/actions/clients";

export default async function ClientesPage() {
  const items = await getClients();
  return <ClientsManager items={items} />;
}
