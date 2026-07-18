import { BadRequestException } from '@nestjs/common';

export type CreateInventoryInput =
  | {
      sourceItemId: string;
      quantity: number;
      isEquipped: boolean;
      visibleNotes: string | null;
      gmNotes: string | null;
    }
  | {
      name: string;
      spacePerUnit: number;
      quantity: number;
      isEquipped: boolean;
      visibleNotes: string | null;
      gmNotes: string | null;
    };
export type UpdateInventoryInput = Partial<
  Omit<Extract<CreateInventoryInput, { name: string }>, 'name'>
>;

const createKeys = new Set([
  'sourceItemId',
  'name',
  'spacePerUnit',
  'quantity',
  'isEquipped',
  'visibleNotes',
  'gmNotes',
]);
const updateKeys = new Set([
  'quantity',
  'spacePerUnit',
  'isEquipped',
  'visibleNotes',
  'gmNotes',
]);

export function parseCreateInventoryInput(body: unknown): CreateInventoryInput {
  const value = ensureObject(body, createKeys);
  const hasSource = 'sourceItemId' in value;
  const hasCustom = 'name' in value || 'spacePerUnit' in value;
  if (hasSource === hasCustom)
    throw new BadRequestException(
      'Provide exactly one inventory entry variant',
    );
  const shared = parseShared(value, true);
  if (hasSource) {
    if (typeof value.sourceItemId !== 'string' || !isUuid(value.sourceItemId))
      throw new BadRequestException('sourceItemId must be a UUID');
    if ('name' in value || 'spacePerUnit' in value)
      throw new BadRequestException(
        'Catalog entries cannot override snapshots',
      );
    return { sourceItemId: value.sourceItemId, ...shared };
  }
  return {
    name: parseName(value.name),
    spacePerUnit: parseSpace(value.spacePerUnit),
    ...shared,
  };
}

export function parseUpdateInventoryInput(body: unknown): UpdateInventoryInput {
  const value = ensureObject(body, updateKeys);
  if (!Object.keys(value).length)
    throw new BadRequestException('At least one field is required');
  const result: UpdateInventoryInput = {};
  if ('quantity' in value) result.quantity = parseQuantity(value.quantity);
  if ('spacePerUnit' in value)
    result.spacePerUnit = parseSpace(value.spacePerUnit);
  if ('isEquipped' in value)
    result.isEquipped = parseBoolean(value.isEquipped, 'isEquipped');
  if ('visibleNotes' in value)
    result.visibleNotes = parseNotes(value.visibleNotes, 2000, 'visibleNotes');
  if ('gmNotes' in value)
    result.gmNotes = parseNotes(value.gmNotes, 10000, 'gmNotes');
  return result;
}

function parseShared(value: Record<string, unknown>, required: boolean) {
  if (required && (!('quantity' in value) || !('isEquipped' in value)))
    throw new BadRequestException('quantity and isEquipped are required');
  return {
    quantity: parseQuantity(value.quantity),
    isEquipped: parseBoolean(value.isEquipped, 'isEquipped'),
    visibleNotes:
      'visibleNotes' in value
        ? parseNotes(value.visibleNotes, 2000, 'visibleNotes')
        : null,
    gmNotes:
      'gmNotes' in value ? parseNotes(value.gmNotes, 10000, 'gmNotes') : null,
  };
}
function ensureObject(
  body: unknown,
  keys: Set<string>,
): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new BadRequestException('Invalid inventory payload');
  const value = body as Record<string, unknown>;
  if (Object.keys(value).some((key) => !keys.has(key)))
    throw new BadRequestException('Unknown inventory field');
  return value;
}
function parseQuantity(value: unknown): number {
  if (
    !Number.isInteger(value) ||
    (value as number) < 1 ||
    (value as number) > 9999
  )
    throw new BadRequestException(
      'quantity must be an integer between 1 and 9999',
    );
  return value as number;
}
function parseSpace(value: unknown): number {
  if (
    !Number.isInteger(value) ||
    (value as number) < 0 ||
    (value as number) > 9999
  )
    throw new BadRequestException(
      'spacePerUnit must be an integer between 0 and 9999',
    );
  return value as number;
}
function parseBoolean(value: unknown, name: string): boolean {
  if (typeof value !== 'boolean')
    throw new BadRequestException(`${name} must be a boolean`);
  return value;
}
function parseName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 200)
    throw new BadRequestException('name must be between 1 and 200 characters');
  return value.trim();
}
function parseNotes(value: unknown, max: number, name: string): string | null {
  if (value !== null && typeof value !== 'string')
    throw new BadRequestException(`${name} must be a string or null`);
  if (typeof value === 'string' && value.trim().length > max)
    throw new BadRequestException(`${name} is too long`);
  return typeof value === 'string' ? value.trim() || null : null;
}
function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
