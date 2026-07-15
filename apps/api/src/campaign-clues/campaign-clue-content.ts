import { BadRequestException } from '@nestjs/common';
import { getSchema } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import TextAlign from '@tiptap/extension-text-align';
import StarterKit from '@tiptap/starter-kit';

export type CampaignClueContent = Record<string, unknown>;

const MAX_SERIALIZED_BYTES = 64 * 1024;
const MAX_TEXT_CHARACTERS = 40_000;
const MAX_NODES = 2_000;
const MAX_DEPTH = 16;
const TEXT_ALIGNMENTS = new Set(['left', 'center', 'right', 'justify']);

const clueSchema = getSchema([
  StarterKit.configure({
    code: false,
    codeBlock: false,
    document: false,
    dropcursor: false,
    gapcursor: false,
    hardBreak: false,
    heading: { levels: [1, 2, 3] },
    link: false,
    listKeymap: false,
    strike: false,
    trailingNode: false,
    underline: false,
    undoRedo: false,
  }),
  Document.extend({ content: 'block*' }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
    alignments: ['left', 'center', 'right', 'justify'],
    defaultAlignment: null,
  }),
]);

interface ValidationState {
  nodeCount: number;
  textCharacters: number;
}

export function validateCampaignClueContent(
  value: unknown,
): CampaignClueContent {
  if (!isRecord(value))
    throw new BadRequestException('content must be a JSON document');

  const serialized = JSON.stringify(value);
  if (new TextEncoder().encode(serialized).length > MAX_SERIALIZED_BYTES) {
    throw new BadRequestException(
      'content exceeds the maximum serialized size',
    );
  }

  const normalized = normalizeNode(
    value,
    { nodeCount: 0, textCharacters: 0 },
    1,
  );
  try {
    clueSchema.nodeFromJSON(normalized).check();
  } catch {
    throw new BadRequestException(
      'content does not match the allowed document schema',
    );
  }
  return normalized;
}

function normalizeNode(
  value: Record<string, unknown>,
  state: ValidationState,
  depth: number,
): CampaignClueContent {
  if (depth > MAX_DEPTH)
    throw new BadRequestException('content exceeds the maximum depth');
  state.nodeCount += 1;
  if (state.nodeCount > MAX_NODES)
    throw new BadRequestException('content exceeds the maximum node count');
  if (typeof value.type !== 'string')
    throw new BadRequestException('content nodes need a type');

  switch (value.type) {
    case 'doc':
      ensureKeys(value, ['type', 'content']);
      return {
        type: 'doc',
        content: normalizeChildren(value.content, state, depth, false),
      };
    case 'paragraph':
      ensureKeys(value, ['type', 'attrs', 'content']);
      return withInlineContent('paragraph', value, state, depth);
    case 'heading':
      ensureKeys(value, ['type', 'attrs', 'content']);
      return withInlineContent('heading', value, state, depth);
    case 'text':
      ensureKeys(value, ['type', 'text', 'marks']);
      if (typeof value.text !== 'string')
        throw new BadRequestException('text nodes need text');
      state.textCharacters += value.text.length;
      if (state.textCharacters > MAX_TEXT_CHARACTERS)
        throw new BadRequestException(
          'content exceeds the maximum text length',
        );
      return { type: 'text', text: value.text, ...normalizeMarks(value.marks) };
    case 'bulletList':
      ensureKeys(value, ['type', 'content']);
      return {
        type: value.type,
        content: normalizeChildren(value.content, state, depth, false),
      };
    case 'orderedList':
      ensureKeys(value, ['type', 'attrs', 'content']);
      return {
        type: 'orderedList',
        ...normalizeOrderedListAttributes(value.attrs),
        content: normalizeChildren(value.content, state, depth, false),
      };
    case 'listItem':
    case 'blockquote':
      ensureKeys(value, ['type', 'content']);
      return {
        type: value.type,
        content: normalizeChildren(value.content, state, depth, false),
      };
    case 'horizontalRule':
      ensureKeys(value, ['type']);
      return { type: 'horizontalRule' };
    default:
      throw new BadRequestException('content contains an unsupported node');
  }
}

function withInlineContent(
  type: 'paragraph' | 'heading',
  value: Record<string, unknown>,
  state: ValidationState,
  depth: number,
): CampaignClueContent {
  const attrs = normalizeBlockAttributes(type, value.attrs);
  const content =
    value.content === undefined
      ? []
      : normalizeChildren(value.content, state, depth, true);
  const normalized: CampaignClueContent = { type };
  if (Object.keys(attrs).length) normalized.attrs = attrs;
  if (content.length) normalized.content = content;
  return normalized;
}

function normalizeBlockAttributes(
  type: 'paragraph' | 'heading',
  value: unknown,
): Record<string, unknown> {
  if (value === undefined) return type === 'heading' ? { level: 1 } : {};
  if (!isRecord(value))
    throw new BadRequestException('node attributes must be an object');
  const allowed = type === 'heading' ? ['level', 'textAlign'] : ['textAlign'];
  ensureKeys(value, allowed);
  const attrs: Record<string, unknown> = {};
  if (type === 'heading') {
    const level = value.level ?? 1;
    if (level !== 1 && level !== 2 && level !== 3)
      throw new BadRequestException('heading level must be between 1 and 3');
    attrs.level = level;
  }
  if (value.textAlign !== undefined && value.textAlign !== null) {
    if (
      typeof value.textAlign !== 'string' ||
      !TEXT_ALIGNMENTS.has(value.textAlign)
    )
      throw new BadRequestException('text alignment is invalid');
    attrs.textAlign = value.textAlign;
  }
  return attrs;
}

function normalizeOrderedListAttributes(
  value: unknown,
): Partial<CampaignClueContent> {
  if (value === undefined) return {};
  if (!isRecord(value))
    throw new BadRequestException('node attributes must be an object');
  ensureKeys(value, ['start']);
  if (
    value.start !== undefined &&
    (typeof value.start !== 'number' ||
      !Number.isInteger(value.start) ||
      value.start < 1)
  ) {
    throw new BadRequestException(
      'ordered list start must be a positive integer',
    );
  }
  return value.start === undefined || value.start === 1
    ? {}
    : { attrs: { start: value.start } };
}

function normalizeChildren(
  value: unknown,
  state: ValidationState,
  depth: number,
  allowInline: boolean,
): CampaignClueContent[] {
  if (!Array.isArray(value))
    throw new BadRequestException('content children must be an array');
  return value.map((child) => {
    if (!isRecord(child))
      throw new BadRequestException('content child must be an object');
    const normalized = normalizeNode(child, state, depth + 1);
    if (allowInline && normalized.type !== 'text')
      throw new BadRequestException('inline content only accepts text nodes');
    if (!allowInline && normalized.type === 'text')
      throw new BadRequestException('text nodes must be inside a text block');
    return normalized;
  });
}

function normalizeMarks(value: unknown): Partial<CampaignClueContent> {
  if (value === undefined) return {};
  if (!Array.isArray(value))
    throw new BadRequestException('marks must be an array');
  return {
    marks: value.map((mark) => {
      if (!isRecord(mark) || typeof mark.type !== 'string')
        throw new BadRequestException('mark is invalid');
      ensureKeys(mark, ['type']);
      if (mark.type !== 'bold' && mark.type !== 'italic')
        throw new BadRequestException('content contains an unsupported mark');
      return { type: mark.type };
    }),
  };
}

function ensureKeys(value: Record<string, unknown>, allowed: string[]): void {
  if (Object.keys(value).some((key) => !allowed.includes(key)))
    throw new BadRequestException('content contains unsupported properties');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
