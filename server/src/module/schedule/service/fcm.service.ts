import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
@Injectable()
export class FCMService {
  private readonly logger = new Logger(FCMService.name);

  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(
            fs.readFileSync(
              path.join(
                `${__dirname}/asset`,
                'lovechedule-firebase-adminsdk-fbsvc-96c78810d7.json'
              ),
              'utf8'
            )
          )
        )
      });
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
