import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseDto } from '../../../common/dto/response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { PhotoService } from '../service/photo.service';

@ApiTags('PHOTO')
@Controller('photo')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @ApiOkResponse({
    type: ResponseDto,
    description: '성공'
  })
  @ApiOperation({ summary: '이미지 업로드' })
  @UseInterceptors(FileInterceptor('file'))
  @Post('upload')
  uploadFile(@UploadedFile() file: any) {
    return this.photoService.uploadFile(file);
  }

  @Get('uploads/:filename')
  async getImage(@Param('filename') filename: string, @Res() res: any) {
    res.body(filename, { root: 'uploads' });
  }
}
