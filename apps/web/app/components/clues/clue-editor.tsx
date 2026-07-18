"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import type { JSONContent } from "@tiptap/core";

type ClueEditorProps = {
  content: JSONContent;
  onChange: (content: JSONContent) => void;
};

const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    code: false,
    codeBlock: false,
    dropcursor: false,
    gapcursor: false,
    hardBreak: false,
    link: false,
    listKeymap: false,
    strike: false,
    undoRedo: false,
  }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
];

type ToolbarButtonProps = {
  label: string;
  isActive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({
  label,
  isActive = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-medium ${isActive ? "bg-red-700 text-white" : "text-zinc-300 hover:bg-zinc-800"}`}
    >
      {children}
    </button>
  );
}

export function ClueEditor({ content, onChange }: ClueEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content,
    editorProps: {
      attributes: {
        class: "clue-editor-content min-h-80 p-4 text-zinc-100 outline-none",
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getJSON()),
  });

  if (!editor)
    return (
      <div className="min-h-80 animate-pulse rounded border border-zinc-800 bg-zinc-950" />
    );

  const setHeading = (level: 1 | 2 | 3) =>
    editor.chain().focus().toggleHeading({ level }).run();

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <div
        className="flex flex-wrap gap-1 border-b border-zinc-800 p-2"
        role="toolbar"
        aria-label="Formatação da pista"
      >
        <ToolbarButton
          label="Negrito"
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          label="Itálico"
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          label="Título 1"
          isActive={editor.isActive("heading", { level: 1 })}
          onClick={() => setHeading(1)}
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          label="Título 2"
          isActive={editor.isActive("heading", { level: 2 })}
          onClick={() => setHeading(2)}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          label="Título 3"
          isActive={editor.isActive("heading", { level: 3 })}
          onClick={() => setHeading(3)}
        >
          H3
        </ToolbarButton>
        <ToolbarButton
          label="Lista com marcadores"
          isActive={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • Lista
        </ToolbarButton>
        <ToolbarButton
          label="Lista numerada"
          isActive={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. Lista
        </ToolbarButton>
        <ToolbarButton
          label="Citação"
          isActive={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          Citar
        </ToolbarButton>
        <ToolbarButton
          label="Linha horizontal"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          Linha
        </ToolbarButton>
        <select
          aria-label="Alinhamento"
          value={
            (editor.getAttributes("paragraph").textAlign as
              string | undefined) ?? "left"
          }
          onChange={(event) =>
            editor.chain().focus().setTextAlign(event.target.value).run()
          }
          className="rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
        >
          <option value="left">À esquerda</option>
          <option value="center">Centralizado</option>
          <option value="right">À direita</option>
          <option value="justify">Justificado</option>
        </select>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
