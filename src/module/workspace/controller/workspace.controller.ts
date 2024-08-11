import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { WorkspaceService } from '../service/workspace.service';
import { ResponseDto } from '../../../common/dto/response.dto';
import { JwtAuthGuard } from '../../auth/guard';
import { Serialize } from '../../../interceptor/serialize.interceptor';
import { CreateWorkspaceResponseDto } from '../dto/response/create-workspace.response.dto';
import { CreateWorkspaceRequestDto } from '../dto/request/create-workspace.request.dto';
import { UserDto } from '../../auth/dto/user.dto';
import { User } from '../../../common/decorator/user.decorator';
import { JoinWorkspaceResponseDto } from '../dto/response/join-workspace.response.dto';
import { JoinWorkspaceRequestDto } from '../dto/request/join-workspace.request.dto';
import { WorkspaceResponseDto } from '../dto/response/workspace.response.dto';
import { CreateTagRequestDto } from '../dto/request/create-tag.request.dto';
import { CreateTagResponseDto } from '../dto/response/create-tag.response.dto';
import { CreateAnniversaryRequestDto } from '../dto/request/create-anniversary.request.dto';
import { AnniversaryResponseDto } from '../dto/response/anniversary.response.dto';

@ApiTags('Workspace')
@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @ApiOperation({
    summary: 'Workspace Create'
  })
  @ApiOkResponse({
    type: ResponseDto
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(CreateWorkspaceResponseDto)
  @Post('/')
  create(@User() user: UserDto, @Body() body: CreateWorkspaceRequestDto) {
    return this.workspaceService.create(user, body);
  }

  @ApiOperation({
    summary: 'Tag Create'
  })
  @ApiOkResponse({
    type: ResponseDto
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(CreateTagResponseDto)
  @Post('/')
  createTag(@User() _id: string, @Body() body: CreateTagRequestDto) {
    return this.workspaceService.createTag(_id, body);
  }

  @ApiOperation({
    summary: 'Workspace Join User'
  })
  @ApiOkResponse({
    type: ResponseDto
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(JoinWorkspaceResponseDto)
  @Post('/join')
  join(@User() user: UserDto, @Body() body: JoinWorkspaceRequestDto) {
    return this.workspaceService.join(user, body);
  }

  @ApiOperation({
    summary: 'Workspace Find'
  })
  @ApiOkResponse({
    type: ResponseDto
  })
  @ApiBearerAuth()
  @Serialize(WorkspaceResponseDto)
  @ApiParam({
    name: '_id',
    required: true,
    type: 'string'
  })
  @Get('/:_id')
  findById(@Param('_id') _id: string) {
    return this.workspaceService.findOneById(_id);
  }

  @ApiOperation({
    summary: 'Anniversary Create'
  })
  @ApiOkResponse({
    type: ResponseDto
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(AnniversaryResponseDto)
  @ApiParam({
    name: '_id',
    required: true,
    type: 'string'
  })
  @Post('/:_id/anniversary')
  anniversaryCreate(
    @Param('_id') _id: string,
    @Body() body: CreateAnniversaryRequestDto
  ) {
    return this.workspaceService.anniversaryCreate(_id, body);
  }

  @ApiOperation({
    summary: 'Anniversary Find'
  })
  @ApiOkResponse({
    type: ResponseDto
  })
  @ApiBearerAuth()
  @Serialize(AnniversaryResponseDto)
  @ApiParam({
    name: '_id',
    required: true,
    type: 'string'
  })
  @Get('/:_id/anniversary')
  findAnniversaryById(@Param('_id') _id: string) {
    return this.workspaceService.findAnniversaryById(_id);
  }

  @ApiOperation({
    summary: 'Anniversary Delete'
  })
  @ApiOkResponse({
    type: ResponseDto
  })
  @ApiBearerAuth()
  @Serialize(AnniversaryResponseDto)
  @ApiParam({
    name: '_id',
    required: true,
    type: 'string'
  })
  @ApiQuery({
    name: 'title',
    required: true,
    type: 'string'
  })
  @Delete('/:_id/anniversary/:name')
  deleteAnniversaryById(
    @Param('_id') _id: string,
    @Query('title') title: string
  ) {
    return this.workspaceService.deleteAnniversaryById(_id, title);
  }
}
