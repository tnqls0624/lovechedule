import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards
} from '@nestjs/common';
import { AlbumService } from '../service/album.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags
} from '@nestjs/swagger';
import { ResponseDto } from '../../../common/dto/response.dto';
import { JwtAuthGuard } from '../../auth/guard';
import { Serialize } from '../../../interceptor/serialize.interceptor';
import { AlbumDto } from '../dto/album.dto';
import { CreateAlbumRequestDto } from '../dto/request/create-album.request.dto';
import { UserDto } from '../../auth/dto/user.dto';
import { User } from '../../../common/decorator/user.decorator';

@ApiTags('ALBUM')
@Controller('album')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @ApiOkResponse({
    type: ResponseDto,
    description: '성공'
  })
  @ApiOperation({ summary: 'Find My Album' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(AlbumDto)
  @ApiParam({
    type: 'string',
    name: '_id',
    description: '워크스페이스 아이디',
    required: true
  })
  @Get('workspace/:_id')
  findAll(@Param('_id') _id: string) {
    return this.albumService.findAll(_id);
  }

  @ApiOkResponse({
    type: ResponseDto,
    description: '성공'
  })
  @ApiOperation({ summary: 'Create Album' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(AlbumDto)
  @ApiParam({
    type: 'string',
    name: '_id',
    description: '워크스페이스 아이디',
    required: true
  })
  @Post('/workspace/:_id')
  insert(
    @User() user: UserDto,
    @Param('_id') _id: string,
    @Body() body: CreateAlbumRequestDto
  ) {
    return this.albumService.insert(user, _id, body);
  }

  @ApiOkResponse({
    type: ResponseDto,
    description: '성공'
  })
  @ApiOperation({ summary: 'Delete Album' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(AlbumDto)
  @ApiParam({
    type: 'string',
    name: '_id',
    description: '앨범 아이디',
    required: true
  })
  @Delete('/:_id')
  delete(@Param('_id') _id: string) {
    return this.albumService.delete(_id);
  }
}
