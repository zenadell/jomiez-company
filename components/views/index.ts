import type { ComponentProps } from "react";
import { AboutView } from "./AboutView";
import { ArticleView } from "./ArticleView";
import { ContactView } from "./ContactView";
import { HomeView } from "./HomeView";
import { JournalView } from "./JournalView";
import { LegalView } from "./LegalView";
import { NotFoundView } from "./NotFoundView";
import { PageView } from "./PageView";
import { ProjectView } from "./ProjectView";
import { ServicesView } from "./ServicesView";
import { WorkView } from "./WorkView";

/*
 * Every page's content as a plain component of its data. The server renders
 * them for visitors; the admin's live preview re-renders them in the browser
 * from the unsaved form, so edits show as they are typed.
 */
export const VIEWS = {
  home: HomeView,
  about: AboutView,
  services: ServicesView,
  work: WorkView,
  journal: JournalView,
  contact: ContactView,
  legal: LegalView,
  notFound: NotFoundView,
  project: ProjectView,
  article: ArticleView,
  page: PageView,
};

export type ViewName = keyof typeof VIEWS;
export type ViewProps<N extends ViewName> = ComponentProps<(typeof VIEWS)[N]>;
