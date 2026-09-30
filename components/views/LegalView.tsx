import { LegalPage } from "@/components/sections/LegalPage";
import type { Privacy, Site, Term } from "@/payload-types";

export type LegalViewProps = { page: Privacy | Term; site: Site };

export function LegalView({ page, site }: LegalViewProps) {
  return <LegalPage data={page as Privacy} site={site} />;
}
