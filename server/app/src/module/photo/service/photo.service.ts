import { Inject, Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import * as crypto from 'crypto';
import { PhotoRepository } from '../interface/photo.repository';
import * as mime from 'mime-types';

@Injectable()
export class PhotoService {
  private s3: S3Client;
  private bucketName: string;
  private uploadPath: string;

  constructor(
    @Inject('PHOTO_REPOSITORY')
    private readonly photoRepository: PhotoRepository,
  ) {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.bucketName = process.env.AWS_S3_BUCKET;
    this.uploadPath = process.env.AWS_S3_UPLOAD_PATH;
  }

  /**
   * 📌 SHA-256 해시 생성 (파일 버퍼 기반)
   */
  private async generateFileHash(fileBuffer: Buffer): Promise<string> {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * 📌 S3 파일 업로드 (중복 체크 포함)
   */
  async uploadFile(file: Express.Multer.File): Promise<{ url: string }> {
    try {
      const fileExtension = mime.extension(file.mimetype);
      if (!fileExtension) {
        throw new Error(`Unsupported file type: ${file.mimetype}`);
      }

      // 📌 파일 해시값 생성
      const fileHash = await this.generateFileHash(file.buffer);

      // 📌 이미 저장된 해시값인지 확인 (중복 파일 방지)
      // const existingPhoto = await this.photoModel.findOne({ hash: fileHash });
      const existingPhoto = await this.photoRepository.findHash(fileHash);
      if (existingPhoto) {
        return { url: existingPhoto.url };
      }

      // 📌 랜덤 문자열로 파일명 생성
      const randomString = crypto.randomBytes(8).toString('hex');
      const fileName = `${this.uploadPath}${randomString}-${Date.now()}.${fileExtension}`;

      const fileStream = Readable.from(file.buffer);
      const fileSize = Buffer.byteLength(file.buffer);

      // 📌 S3에 업로드
      const params = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: fileStream,
        ContentType: file.mimetype,
        ContentLength: fileSize, // ✅ ContentLength 명시적으로 설정
      };

      await this.s3.send(new PutObjectCommand(params));

      const url = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

      // 📌 DB에 사진 정보 저장
      await this.photoRepository.insert({ url, hash: fileHash });

      return { url };
    } catch (error) {
      console.error('❌ S3 업로드 실패:', error);
      throw new Error('S3 업로드 중 오류 발생');
    }
  }
}
