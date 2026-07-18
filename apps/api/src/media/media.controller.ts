import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaService } from './media.service';

@Controller('media')
@ApiTags('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @ApiOperation({ summary: 'Upload an image asset' })
  @ApiOkResponse({ description: 'Asset created' })
  async upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile()
    file:
      | { originalname: string; mimetype: string; size: number; buffer: Buffer }
      | undefined,
    @Req() request: Request,
  ) {
    if (!file) {
      throw new BadRequestException('Missing file');
    }

    const campaignId =
      typeof request.body?.campaignId === 'string'
        ? request.body.campaignId
        : null;

    return this.mediaService.uploadImage({
      userId: user.id,
      campaignId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      body: file.buffer,
    });
  }

  @Get(':assetId/file')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download an authorized image asset' })
  @ApiOkResponse({
    description: 'Image binary response',
    content: { 'image/*': { schema: { type: 'string', format: 'binary' } } },
  })
  async download(
    @CurrentUser() user: AuthUser,
    @Param('assetId') assetId: string,
    @Res() res: Response,
  ): Promise<void> {
    const asset = await this.mediaService.getImageBuffer(assetId, user.id);
    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${asset.fileName.replace(/"/g, '')}"`,
    );
    asset.body.pipe(res);
  }

  @Delete(':assetId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('assetId') assetId: string,
  ): Promise<void> {
    await this.mediaService.deleteImage(user.id, assetId);
  }
}
