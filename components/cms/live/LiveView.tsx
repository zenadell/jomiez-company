"use client";

import type { ComponentType } from "react";
import { useSiteData } from "@/components/cms/SiteData";
import { VIEWS, type ViewName } from "@/components/views";
import { useReportEditedPage } from "./LiveSiteData";
import { useLiveDoc, type LiveTarget } from "./useLiveDoc";

export type LiveDoc<F extends string = string> = LiveTarget & { field: F };

/*
 * A page in the admin's live preview: the document being edited (`doc.field`
 * of the props) follows the edit form keystroke by keystroke, and the shared
 * site settings follow theirs.
 */
export function LiveView({ view, props, doc }: { view: ViewName; props: Record<string, unknown>; doc: LiveDoc }) {
  const data = useLiveDoc(props[doc.field], doc);
  useReportEditedPage(doc.collection === "pages" ? data : null);
  const { site } = useSiteData();
  const View = VIEWS[view] as ComponentType<Record<string, unknown>>;
  return <View {...props} {...("site" in props ? { site } : null)} {...{ [doc.field]: data }} />;
}
