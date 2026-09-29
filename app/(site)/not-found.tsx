import { Live } from "@/components/cms/live/Live";
import { getGlobal } from "@/lib/cms";

export default async function NotFound() {
  const page = await getGlobal("not-found");
  return <Live view="notFound" doc={{ field: "page", global: "not-found" }} props={{ page }} />;
}
