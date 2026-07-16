import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { getEnvironment } from '../config/environment';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import { campaigns, characterEditDrafts, characters, items, mediaAssets, monsters } from '../database/schema';
import { eq } from 'drizzle-orm';

export interface UploadedAsset {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

@Injectable()
export class MediaService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(@Inject(DATABASE) private readonly db: Database) {
    const environment = getEnvironment();
    const endpoint = environment.S3_ENDPOINT;
    const accessKeyId = environment.S3_ACCESS_KEY;
    const secretAccessKey = environment.S3_SECRET_KEY;
    this.bucket = environment.S3_BUCKET;

    this.s3Client = new S3Client({
      region: environment.S3_REGION,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async uploadImage(options: {
    userId: string;
    campaignId?: string | null;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    body: Buffer;
  }): Promise<UploadedAsset> {
    const key = `${options.userId}/${randomUUID()}-${options.fileName}`.replace(
      /\s+/g,
      '-',
    );

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: options.body,
        ContentType: options.mimeType,
      }),
    );

    const [asset] = await this.db
      .insert(mediaAssets)
      .values({
        ownerUserId: options.userId,
        campaignId: options.campaignId ?? null,
        bucket: this.bucket,
        storageKey: key,
        fileName: options.fileName,
        mimeType: options.mimeType,
        sizeBytes: options.sizeBytes,
        kind: 'image',
      })
      .returning();

    return {
      id: asset.id,
      url: `/media/${asset.id}/file`,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
    };
  }

  async getImageBuffer(assetId: string): Promise<{
    body: NodeJS.ReadableStream;
    mimeType: string;
    fileName: string;
  }> {
    const [asset] = await this.db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, assetId));

    if (!asset || asset.deletedAt) {
      throw new NotFoundException('Asset not found');
    }

    const result = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: asset.bucket,
        Key: asset.storageKey,
      }),
    );

    if (
      !result.Body ||
      typeof (result.Body as NodeJS.ReadableStream).pipe !== 'function'
    ) {
      throw new NotFoundException('Asset stream not available');
    }

    return {
      body: result.Body as NodeJS.ReadableStream,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
    };
  }

  async deleteImage(userId: string, assetId: string): Promise<void> {
    const [asset] = await this.db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, assetId));

    if (!asset || asset.deletedAt) {
      throw new NotFoundException('Asset not found');
    }
    if (asset.ownerUserId !== userId) {
      throw new NotFoundException('Asset not found');
    }

    if (await this.hasReferences(assetId)) {
      throw new BadRequestException('Asset is still in use; update or remove its record first');
    }

    await this.s3Client.send(
      new DeleteObjectCommand({ Bucket: asset.bucket, Key: asset.storageKey }),
    );
    await this.db
      .update(mediaAssets)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(mediaAssets.id, assetId));
  }

  /**
   * Release an owner-uploaded portrait only after the record which stopped
   * referencing it has been saved.  Copies can legitimately share a portrait,
   * so deleting an asset merely because one sheet replaced it would leave the
   * other sheet broken.
   */
  async releaseImageIfUnreferenced(userId: string, assetId: string | null | undefined): Promise<void> {
    if (!assetId) return;
    const [asset] = await this.db.select().from(mediaAssets).where(eq(mediaAssets.id, assetId));
    if (!asset || asset.deletedAt || asset.ownerUserId !== userId) return;
    if (await this.hasReferences(assetId)) return;
    await this.s3Client.send(new DeleteObjectCommand({ Bucket: asset.bucket, Key: asset.storageKey }));
    await this.db.update(mediaAssets).set({ deletedAt: new Date().toISOString() }).where(eq(mediaAssets.id, assetId));
  }

  private async hasReferences(assetId: string): Promise<boolean> {
    const [characterReference, editDraftReference, itemReference, monsterReference, campaignReference] = await Promise.all([
      this.db.select({ id: characters.id }).from(characters).where(eq(characters.imageAssetId, assetId)).limit(1),
      this.db.select({ id: characterEditDrafts.id }).from(characterEditDrafts).where(eq(characterEditDrafts.imageAssetId, assetId)).limit(1),
      this.db.select({ id: items.id }).from(items).where(eq(items.imageAssetId, assetId)).limit(1),
      this.db.select({ id: monsters.id }).from(monsters).where(eq(monsters.imageAssetId, assetId)).limit(1),
      this.db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.coverImageAssetId, assetId)).limit(1),
    ]);
    return Boolean(characterReference.length || editDraftReference.length || itemReference.length || monsterReference.length || campaignReference.length);
  }
}
