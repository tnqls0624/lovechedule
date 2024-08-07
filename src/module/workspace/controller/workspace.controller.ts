import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
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

@ApiTags('Workspace')
@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @ApiOperation({
    summary: 'Workspace Create',
  })
  @ApiOkResponse({
    type: ResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(CreateWorkspaceResponseDto)
  @Post('/')
  create(@User() user: UserDto, @Body() body: CreateWorkspaceRequestDto) {
    return this.workspaceService.create(user, body);
  }

  @ApiOperation({
    summary: 'Tag Create',
  })
  @ApiOkResponse({
    type: ResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(CreateTagResponseDto)
  @Post('/')
  createTag(@User() _id: string, @Body() body: CreateTagRequestDto) {
    return this.workspaceService.createTag(_id, body);
  }

  @ApiOperation({
    summary: 'Workspace Join User',
  })
  @ApiOkResponse({
    type: ResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(JoinWorkspaceResponseDto)
  @Post('/join')
  join(@User() user: UserDto, @Body() body: JoinWorkspaceRequestDto) {
    return this.workspaceService.join(user, body);
  }

  @ApiOperation({
    summary: 'Workspace Find',
  })
  @ApiOkResponse({
    type: ResponseDto,
  })
  @ApiBearerAuth()
  @Serialize(WorkspaceResponseDto)
  @ApiParam({
    name: '_id',
    required: true,
    type: 'string',
  })
  @Get('/:_id')
  findOneById(@Param('_id') _id: string) {
    return this.workspaceService.findOneById(_id);
  }
}
