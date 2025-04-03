import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'hello1';
  }

  @Get('privacy')
  getPrivacyPolicy(@Res() res: Response): void {
    // HTML 파일 읽어서 반환
    let filePath = path.join(process.cwd(), 'dist/asset/privacy.html');

    // dist/asset에 파일이 없다면 src/asset에서 찾기
    if (!fs.existsSync(filePath)) {
      console.log(
        'dist/asset/privacy.html 파일이 없습니다. src/asset에서 찾습니다.'
      );
      filePath = path.join(process.cwd(), 'src/asset/privacy.html');

      // src/asset에 파일이 있으면 dist/asset으로 복사
      if (fs.existsSync(filePath)) {
        try {
          const destPath = path.join(process.cwd(), 'dist/asset');
          if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
          }
          fs.copyFileSync(filePath, path.join(destPath, 'privacy.html'));
          console.log('privacy.html 파일을 dist/asset으로 복사했습니다.');
        } catch (copyError) {
          console.error(`파일 복사 중 오류 발생: ${copyError.message}`);
        }
      }
    }

    try {
      if (fs.existsSync(filePath)) {
        const htmlContent = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(HttpStatus.OK).send(htmlContent);
      } else {
        console.error('privacy.html 파일을 찾을 수 없습니다.');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res
          .status(HttpStatus.NOT_FOUND)
          .send(
            '<html><body><h1>Privacy Policy</h1><p>Privacy policy file not found.</p></body></html>'
          );
      }
    } catch (error) {
      console.error(`Privacy 파일을 읽는데 실패했습니다: ${error.message}`);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(
          '<html><body><h1>Privacy Policy</h1><p>Error loading privacy policy.</p></body></html>'
        );
    }
  }
}
