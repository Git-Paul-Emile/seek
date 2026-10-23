import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect } from "react";
import { STYLES_TEXTE_RICHE } from "@/lib/stylesTexteRiche";
import {
  Bold,
  Italic,
  UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange?: (html: string) => void;
  readOnly?: boolean;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  readOnly = false,
  minHeight = "300px",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  const btn = (active: boolean) =>
    `inline-flex size-9 items-center justify-center rounded-control transition-colors duration-hover ${
      active ? "bg-baobab-100 text-baobab" : "text-texte2 hover:bg-white hover:text-encre"
    }`;

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-control border border-input bg-white focus-within:border-baobab">
      {!readOnly && (
        <div className="flex flex-wrap gap-1 border-b border-filet bg-surface p-2">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
            className={btn(editor.isActive("bold"))}
            aria-pressed={editor.isActive("bold")}
            title="Gras"
            aria-label="Gras"
          >
            <Bold aria-hidden className="size-[18px]" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
            className={btn(editor.isActive("italic"))}
            title="Italique"
            aria-label="Italique"
          >
            <Italic aria-hidden className="size-[18px]" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }}
            className={btn(editor.isActive("underline"))}
            title="Souligné"
            aria-label="Souligné"
          >
            <UnderlineIcon aria-hidden className="size-[18px]" />
          </button>

          <div className="mx-1 w-px bg-filet" />

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); }}
            className={btn(editor.isActive("heading", { level: 1 }))}
            title="Titre 1"
            aria-label="Titre 1"
          >
            <Heading1 aria-hidden className="size-[18px]" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
            className={btn(editor.isActive("heading", { level: 2 }))}
            title="Titre 2"
            aria-label="Titre 2"
          >
            <Heading2 aria-hidden className="size-[18px]" />
          </button>

          <div className="mx-1 w-px bg-filet" />

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
            className={btn(editor.isActive("bulletList"))}
            title="Liste à puces"
            aria-label="Liste à puces"
          >
            <List aria-hidden className="size-[18px]" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
            className={btn(editor.isActive("orderedList"))}
            title="Liste numérotée"
            aria-label="Liste numérotée"
          >
            <ListOrdered aria-hidden className="size-[18px]" />
          </button>

          <div className="mx-1 w-px bg-filet" />

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("left").run(); }}
            className={btn(editor.isActive({ textAlign: "left" }))}
            title="Aligner à gauche"
            aria-label="Aligner à gauche"
          >
            <AlignLeft aria-hidden className="size-[18px]" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("center").run(); }}
            className={btn(editor.isActive({ textAlign: "center" }))}
            title="Centrer"
            aria-label="Centrer"
          >
            <AlignCenter aria-hidden className="size-[18px]" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("right").run(); }}
            className={btn(editor.isActive({ textAlign: "right" }))}
            title="Aligner à droite"
            aria-label="Aligner à droite"
          >
            <AlignRight aria-hidden className="size-[18px]" />
          </button>
        </div>
      )}

      <EditorContent
        editor={editor}
        className={`p-4 ${STYLES_TEXTE_RICHE}`}
        style={{ minHeight }}
      />
    </div>
  );
}
