import type { ReactNode } from "react";
import type { RichDoc, RichMark, RichNode } from "@/content/types";
import { cn } from "@/lib/utils";

/**
 * Renders Tiptap JSON as React elements (no dangerouslySetInnerHTML, so stored content can't
 * inject markup). Supports the node/mark set the dashboard editor allows.
 */
const SAFE_URL = /^(https?:|mailto:|tel:|\/)/i;

function applyMarks(text: ReactNode, marks: RichMark[] = [], key: string): ReactNode {
  return marks.reduce<ReactNode>((acc, m, i) => {
    const k = `${key}-${i}`;
    switch (m.type) {
      case "bold":
        return <strong key={k}>{acc}</strong>;
      case "italic":
        return <em key={k}>{acc}</em>;
      case "underline":
        return <u key={k}>{acc}</u>;
      case "strike":
        return <s key={k}>{acc}</s>;
      case "code":
        return (
          <code key={k} className="bg-surface-2 px-1 font-mono text-[0.9em]">
            {acc}
          </code>
        );
      case "link": {
        const href = String(m.attrs?.href ?? "");
        if (!SAFE_URL.test(href)) return acc;
        const external = /^https?:/i.test(href);
        return (
          <a
            key={k}
            href={href}
            className="text-link underline underline-offset-4"
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {acc}
          </a>
        );
      }
      default:
        return acc;
    }
  }, text);
}

function Node({ node, k }: { node: RichNode; k: string }): ReactNode {
  const kids = (node.content ?? []).map((c, i) => (
    <Node key={`${k}-${i}`} node={c} k={`${k}-${i}`} />
  ));
  const dir = (node.attrs?.dir as string | undefined) ?? undefined;
  switch (node.type) {
    case "text":
      return applyMarks(node.text ?? "", node.marks, k);
    case "paragraph":
      return (
        <p dir={dir} className="mt-6 first:mt-0">
          {kids.length ? kids : <br />}
        </p>
      );
    case "heading": {
      const level = Number(node.attrs?.level ?? 2);
      return level >= 3 ? (
        <h3 dir={dir} className="mt-10 text-title font-medium">
          {kids}
        </h3>
      ) : (
        <h2 dir={dir} className="mt-14 font-display text-title font-bold">
          {kids}
        </h2>
      );
    }
    case "bulletList":
      return <ul className="mt-6 space-y-3">{kids}</ul>;
    case "orderedList":
      return <ol className="mt-6 list-decimal space-y-3 ps-6 marker:text-link">{kids}</ol>;
    case "listItem":
      return (
        <li className="flex gap-3 [&>p]:mt-0 [ol_&]:list-item [ol_&]:ps-1">
          <span aria-hidden className="mt-[0.7em] size-1.5 shrink-0 bg-link [ol_&]:hidden" />
          <div className="min-w-0">{kids}</div>
        </li>
      );
    case "blockquote":
      return (
        <blockquote className="my-12 border-s-4 border-primary ps-6 font-display text-title font-bold text-link [&>p]:mt-0">
          {kids}
        </blockquote>
      );
    case "hardBreak":
      return <br />;
    case "horizontalRule":
      return <hr className="my-12 border-border" />;
    case "codeBlock":
      return (
        <pre
          dir="ltr"
          className="mt-6 overflow-x-auto bg-navy-950 p-4 font-mono text-sm text-indigo-200"
        >
          <code>{kids}</code>
        </pre>
      );
    default:
      return <>{kids}</>;
  }
}

export function RichText({
  doc,
  className,
}: {
  doc: RichDoc | null | undefined;
  className?: string;
}) {
  if (!doc?.content?.length) return null;
  return (
    <div className={cn(className)}>
      {doc.content.map((n, i) => (
        <Node key={i} node={n} k={String(i)} />
      ))}
    </div>
  );
}
