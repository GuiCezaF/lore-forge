"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import type { JSONContent } from "@tiptap/core";
import type { ClueStyle } from "./clue-types";

type ClueDocumentProps = {
  title: string | null;
  content: JSONContent;
  style: ClueStyle;
};

const viewerExtensions = [
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

export function ClueDocument({ title, content, style }: ClueDocumentProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: viewerExtensions,
    content,
    editorProps: { attributes: { class: "clue-document-body outline-none" } },
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  return (
    <article className={`clue-document clue-document--${style}`}>
      {style === "confidential-dossier" ? (
        <div className="clue-document__stamp">Confidencial</div>
      ) : null}
      {title ? <h1 className="clue-document__title">{title}</h1> : null}
      <EditorContent editor={editor} />
    </article>
  );
}
