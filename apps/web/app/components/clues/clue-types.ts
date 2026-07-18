import type { JSONContent } from "@tiptap/core";

export const clueStyles = [
  "plain-document",
  "handwritten-letter",
  "typewritten-report",
  "newspaper-clipping",
  "confidential-dossier",
] as const;

export type ClueStyle = (typeof clueStyles)[number];

export type CampaignClueSummary = {
  id: string;
  gmLabel: string;
  title: string | null;
  style: ClueStyle;
  createdAt: string;
  updatedAt: string;
};

export type CampaignClue = CampaignClueSummary & {
  privateNotes: string | null;
  content: JSONContent;
};

export type ClueDraft = {
  gmLabel: string;
  title: string;
  privateNotes: string;
  style: ClueStyle;
  content: JSONContent;
};

export const emptyClueContent: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export const emptyClueDraft: ClueDraft = {
  gmLabel: "",
  title: "",
  privateNotes: "",
  style: "plain-document",
  content: emptyClueContent,
};
