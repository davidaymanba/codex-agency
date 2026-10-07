import type { ContentBlock, RichDoc, RichNode } from "@/content/types";

const text = (t: string): RichNode => ({ type: "text", text: t });

/** Convert the simple seed blocks into Tiptap JSON. */
export function blocksToDoc(blocks: ContentBlock[]): RichDoc {
  return {
    type: "doc",
    content: blocks.map((b): RichNode => {
      switch (b.type) {
        case "h2":
          return { type: "heading", attrs: { level: 2 }, content: [text(b.text)] };
        case "ul":
          return {
            type: "bulletList",
            content: b.items.map((i) => ({
              type: "listItem",
              content: [{ type: "paragraph", content: [text(i)] }],
            })),
          };
        case "quote":
          return { type: "blockquote", content: [{ type: "paragraph", content: [text(b.text)] }] };
        default:
          return { type: "paragraph", content: [text(b.text)] };
      }
    }),
  };
}

export const emptyDoc = (): RichDoc => ({ type: "doc", content: [{ type: "paragraph" }] });

/** Plain-text length of a doc (validation, reading time). */
export function docText(doc: RichDoc | null | undefined): string {
  const walk = (n: RichNode): string => (n.text ?? "") + (n.content ?? []).map(walk).join(" ");
  return doc?.content?.map(walk).join(" ").trim() ?? "";
}
