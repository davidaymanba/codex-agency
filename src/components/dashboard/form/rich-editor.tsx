"use client";

import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { RichDoc } from "@/content/types";
import { cn } from "@/lib/utils";
import { Tip } from "../ui/overlays";

/**
 * Tiptap editor bound to a form field (stores ProseMirror JSON). Direction is set per
 * language so Arabic content is edited RTL with correct punctuation and list markers.
 * Only the node/mark set the public renderer supports is enabled.
 */
function Btn({
  label,
  on,
  onClick,
  disabled,
  children,
}: {
  label: string;
  on?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Tip label={label}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={on}
        className={cn(
          "grid size-8 place-items-center transition-colors disabled:opacity-40 [&_svg]:size-4",
          on ? "bg-primary text-white" : "hover:bg-surface-2",
        )}
      >
        {children}
      </button>
    </Tip>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const t = useTranslations("dash.editor");
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(t("linkPrompt"), prev ?? "https://");
    if (url === null) return;
    if (!url || !/^(https?:|mailto:|\/)/.test(url))
      return void editor.chain().focus().unsetLink().run();
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-0.5 border-b border-border bg-surface p-1"
    >
      <Btn label={t("bold")} on={s.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold />
      </Btn>
      <Btn
        label={t("italic")}
        on={s.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </Btn>
      <Btn
        label={t("underline")}
        on={s.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline />
      </Btn>
      <span className="mx-1 h-5 w-px bg-border" />
      <Btn
        label={t("h2")}
        on={s.h2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 />
      </Btn>
      <Btn
        label={t("h3")}
        on={s.h3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 />
      </Btn>
      <Btn
        label={t("bullet")}
        on={s.bullet}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </Btn>
      <Btn
        label={t("ordered")}
        on={s.ordered}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered />
      </Btn>
      <Btn
        label={t("quote")}
        on={s.quote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote />
      </Btn>
      <span className="mx-1 h-5 w-px bg-border" />
      <Btn label={t("link")} on={s.link} onClick={setLink}>
        <Link2 />
      </Btn>
      {s.link && (
        <Btn label={t("unlink")} onClick={() => editor.chain().focus().unsetLink().run()}>
          <Unlink />
        </Btn>
      )}
      <span className="ms-auto" />
      <Btn
        label={t("undo")}
        disabled={!s.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="rtl:-scale-x-100" />
      </Btn>
      <Btn
        label={t("redo")}
        disabled={!s.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="rtl:-scale-x-100" />
      </Btn>
    </div>
  );
}

function Rich({
  value,
  onChange,
  dir,
  label,
}: {
  value: RichDoc | null;
  onChange: (v: RichDoc) => void;
  dir: "ltr" | "rtl";
  label: string;
}) {
  const t = useTranslations("dash.editor");
  const editor = useEditor({
    immediatelyRender: false,
    textDirection: dir,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
        strike: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: true,
          protocols: ["https", "mailto"],
          HTMLAttributes: { rel: "noopener noreferrer" },
        },
      }),
      Placeholder.configure({ placeholder: t("placeholder") }),
    ],
    content: value ?? undefined,
    editorProps: {
      attributes: {
        "aria-label": label,
        dir,
        lang: dir === "rtl" ? "ar" : "en",
        class: cn(
          "prose-dash min-h-56 px-4 py-3 text-[0.9375rem] leading-7 outline-none",
          dir === "rtl" && "font-[family-name:var(--font-rubik)] leading-8",
        ),
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getJSON() as RichDoc),
  });

  return (
    <div className="border border-border bg-bg focus-within:border-primary">
      {editor ? <Toolbar editor={editor} /> : <div className="h-10 border-b border-border" />}
      <EditorContent editor={editor} />
    </div>
  );
}

export function RichField({
  name,
  label,
  dir,
}: {
  name: string;
  label: string;
  dir: "ltr" | "rtl";
}) {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div>
          <p className="mb-1.5 text-xs font-medium text-fg-muted">{label}</p>
          <Rich value={field.value} onChange={field.onChange} dir={dir} label={label} />
        </div>
      )}
    />
  );
}
