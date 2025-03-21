import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
@Injectable()
export class FCMService {
  private readonly logger = new Logger(FCMService.name);

  constructor() {
    try {
      // 환경 변수에서 Firebase 키 파일 경로를 가져오거나 기본 경로 사용
      const keyFilePath = process.env.FIREBASE_KEY_PATH || 
                          path.join(process.cwd(), 'dist/asset', 'lovechedule-firebase-adminsdk-fbsvc-96c78810d7.json');
      
      this.logger.log(`Firebase 키 파일 경로: ${keyFilePath}`);
      
      if (!fs.existsSync(keyFilePath)) {
        this.logger.error(`Firebase 키 파일을 찾을 수 없습니다: ${keyFilePath}`);
        throw new Error(`Firebase 키 파일을 찾을 수 없습니다: ${keyFilePath}`);
      }

      admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(
            fs.readFileSync(keyFilePath, 'utf8')
          )
        )
      });
      this.logger.log('Firebase Admin SDK가 성공적으로 초기화되었습니다.');
    } catch (error) {
      this.logger.error('Firebase Admin SDK 초기화 오류:', error);
      throw error;
    }
  }

  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: any
  ) {
    try {
      const message = {
        notification: {
          title,
          body
        },
        data: data || {},
        token: fcmToken
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Successfully sent message: ${response}`);
      return response;
    } catch (error) {
      this.logger.error('Error sending message:', error);
      throw error;
    }
  }
}
