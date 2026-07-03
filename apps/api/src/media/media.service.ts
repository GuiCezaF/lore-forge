import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { getEnvironment } from '../config/environment';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import { mediaAssets } from '../database/schema';
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
}
