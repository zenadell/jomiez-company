import type { ComponentType } from "react";
import { VIEWS, type ViewName, type ViewProps } from "@/components/views";
import { isPreview } from "@/lib/cms";
import { LiveView, type LiveDoc } from "./LiveView";

/*
 * A page's content. Visitors get it rendered on the server. In the admin's live
 * preview it renders in the browser instead, so edits appear as they are typed,
 * before anything is saved or published.
 */
export async function Live<N extends ViewName>({
  view,
  props,
  doc,
}: {
  view: N;
  props: ViewProps<N>;
  doc: LiveDoc<Extract<keyof ViewProps<N>, string>>;
}) {
  if (await isPreview()) return <LiveView view={view} props={props as Record<string, unknown>} doc={doc} />;
  const View = VIEWS[view] as ComponentType<Record<string, unknown>>;
  return <View {...(props as Record<string, unknown>)} />;
}
