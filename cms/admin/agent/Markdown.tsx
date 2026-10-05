"use client";

import { Fragment, type ReactNode } from "react";

/*
 * Just enough Markdown for the agent's replies: headings, lists, bold, italics,
 * code and links. Built from React elements (never raw HTML), so nothing the
 * model writes can inject markup into the admin.
 */

const safeHref = (href: string) => (/^(https?:\/\/|\/|mailto:|tel:|#)/i.test(href) ? href : null);

function inline(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  // Links, bare admin/site paths, code, bold, italics, in that order of precedence.
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*|_[^_\s][^_]*_)|((?<![\w/])\/admin\/[\w\-/?=&.]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${i++}`;
    if (m[1] && m[2]) {
      const href = safeHref(m[2]);
      out.push(
        href ? (
          <a key={k} href={href} target={href.startsWith("/admin") ? undefined : "_blank"} rel="noopener">
            {m[1]}
          </a>
        ) : (
          m[1]
        ),
      );
    } else if (m[3]) out.push(<code key={k}>{m[3].slice(1, -1)}</code>);
    else if (m[4]) out.push(<strong key={k}>{inline(m[4].slice(2, -2), i)}</strong>);
    else if (m[5]) out.push(<em key={k}>{m[5].slice(1, -1)}</em>);
    else if (m[6])
      out.push(
        <a key={k} href={m[6]}>
          {m[6]}
        </a>,
      );
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];
  let code: string[] | null = null;

  const flushPara = () => {
    if (para.length) blocks.push(<p key={`p${blocks.length}`}>{inline(para.join(" "), blocks.length)}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, n) => <li key={n}>{inline(it, n)}</li>);
    blocks.push(list.ordered ? <ol key={`l${blocks.length}`}>{items}</ol> : <ul key={`l${blocks.length}`}>{items}</ul>);
    list = null;
  };

  for (const raw of lines) {
    if (code) {
      if (raw.trim().startsWith("```")) {
        blocks.push(<pre key={`c${blocks.length}`}>{code.join("\n")}</pre>);
        code = null;
      } else code.push(raw);
      continue;
    }
    const line = raw.trimEnd();
    if (line.trim().startsWith("```")) {
      flushPara();
      flushList();
      code = [];
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (heading) {
      flushPara();
      flushList();
      blocks.push(<p key={`h${blocks.length}`} className="jz-md-h">{inline(heading[2], blocks.length)}</p>);
    } else if (bullet || numbered) {
      flushPara();
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((bullet ?? numbered)![1]);
    } else if (!line.trim()) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  if (code) blocks.push(<pre key="c-end">{(code as string[]).join("\n")}</pre>);
  flushPara();
  flushList();
  return <Fragment>{blocks}</Fragment>;
}
