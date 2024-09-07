import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  Response
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';
import { PhotoService } from '../service/photo.service';
import { ResponseDto } from '../../../common/dto/response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadImageRequestDto } from '../dto/request/upload-image.request';
import { diskStorage } from 'multer';

@ApiTags('PHOTO')
@Controller('photo')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @ApiOkResponse({
    type: ResponseDto,
    description: '성공'
  })
  @ApiOperation({ summary: '이미지 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '이미지 파일',
    type: UploadImageRequestDto
  })
  @UseInterceptors(FileInterceptor('file'))
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename(_, file, callback): void {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        }
      })
    })
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
    return {
      url: `http://localhost:3000/api/uploads/${file.filename}`
    };
  }

  @Get('uploads/:filename')
  async getImage(@Param('filename') filename: string, @Res() res: Response) {
    res.body(filename, { root: 'uploads' });
  }
}
