import { ActivitiesManager } from "@/components/activities-manager";
import { getActivities } from "@/lib/actions/activities";

export default async function AtividadesPage() {
  const items = await getActivities();
  return <ActivitiesManager items={items} />;
}
