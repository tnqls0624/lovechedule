import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleRepository } from '../interface/schedule.repository';
import { WorkspaceRepository } from '../../workspace/interface/workspace.repository';
import { HttpService } from '@nestjs/axios';
import { CACHE_GENERATOR } from '../../../lib/cache.module';
import { Types } from 'mongoose';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let scheduleRepository: jest.Mocked<ScheduleRepository>;
  let workspaceRepository: jest.Mocked<WorkspaceRepository>;

  const mockScheduleRepository = {
    findByWorkspaceId: jest.fn(),
    findById: jest.fn(),
    count: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };

  const mockWorkspaceRepository = {
    findOneById: jest.fn()
  };

  const mockCacheGenerator = {
    getCache: jest.fn()
  };

  const mockHttpService = {
    post: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        {
          provide: 'SCHEDULE_REPOSITORY',
          useValue: mockScheduleRepository
        },
        {
          provide: 'WORKSPACE_REPOSITORY',
          useValue: mockWorkspaceRepository
        },
        {
          provide: CACHE_GENERATOR,
          useValue: mockCacheGenerator
        },
        {
          provide: HttpService,
          useValue: mockHttpService
        }
      ]
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    scheduleRepository = module.get('SCHEDULE_REPOSITORY');
    workspaceRepository = module.get('WORKSPACE_REPOSITORY');

    // 모든 mock 함수 초기화
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ObjectId Validation', () => {
    describe('find', () => {
      it('should throw BadRequestException for invalid workspace ID', async () => {
        const invalidId = 'invalid-id';

        await expect(
          service.find(invalidId, '2023', '12', '', '')
        ).rejects.toThrow(BadRequestException);

        await expect(
          service.find(invalidId, '2023', '12', '', '')
        ).rejects.toThrow('유효하지 않은 Workspace ID 형식입니다.');
      });

      it('should throw BadRequestException for empty workspace ID', async () => {
        await expect(service.find('', '2023', '12', '', '')).rejects.toThrow(
          BadRequestException
        );

        await expect(service.find('', '2023', '12', '', '')).rejects.toThrow(
          'Workspace ID가 필요합니다.'
        );
      });

      it('should work with valid workspace ID', async () => {
        const validId = new Types.ObjectId().toString();
        mockScheduleRepository.findByWorkspaceId.mockResolvedValue([]);
        mockCacheGenerator.getCache.mockResolvedValue(null);

        await expect(
          service.find(validId, '2023', '12', '', '')
        ).resolves.not.toThrow();

        expect(mockScheduleRepository.findByWorkspaceId).toHaveBeenCalledWith(
          expect.any(Types.ObjectId),
          '2023',
          '12',
          '',
          ''
        );
      });
    });

    describe('findById', () => {
      it('should throw BadRequestException for invalid schedule ID', async () => {
        const invalidId = 'invalid-id';

        await expect(service.findById(invalidId)).rejects.toThrow(
          BadRequestException
        );

        await expect(service.findById(invalidId)).rejects.toThrow(
          '유효하지 않은 Schedule ID 형식입니다.'
        );
      });

      it('should work with valid schedule ID', async () => {
        const validId = new Types.ObjectId().toString();
        const mockSchedule = { _id: validId, title: 'Test Schedule' };
        mockScheduleRepository.findById.mockResolvedValue(mockSchedule as any);

        const result = await service.findById(validId);

        expect(result).toEqual(mockSchedule);
        expect(mockScheduleRepository.findById).toHaveBeenCalledWith(
          expect.any(Types.ObjectId)
        );
      });
    });

    describe('count', () => {
      it('should throw BadRequestException for invalid workspace ID', async () => {
        const invalidId = 'invalid-id';

        await expect(service.count(invalidId)).rejects.toThrow(
          BadRequestException
        );

        await expect(service.count(invalidId)).rejects.toThrow(
          '유효하지 않은 Workspace ID 형식입니다.'
        );
      });

      it('should validate master and guest user IDs', async () => {
        const validWorkspaceId = new Types.ObjectId().toString();
        const invalidMasterId = 'invalid-master-id';

        const mockWorkspace = {
          master: { _id: invalidMasterId, name: 'Master' },
          users: [{ _id: new Types.ObjectId().toString(), name: 'Guest' }],
          tags: { master: [], guest: [], together: [], anniversary: [] }
        };

        mockWorkspaceRepository.findOneById.mockResolvedValue(
          mockWorkspace as any
        );

        await expect(service.count(validWorkspaceId)).rejects.toThrow(
          BadRequestException
        );

        await expect(service.count(validWorkspaceId)).rejects.toThrow(
          '유효하지 않은 Master ID 형식입니다.'
        );
      });
    });

    describe('insert', () => {
      it('should throw BadRequestException for invalid workspace ID', async () => {
        const invalidWorkspaceId = 'invalid-workspace-id';
        const validUser = {
          _id: new Types.ObjectId().toString(),
          name: 'Test User'
        };
        const mockBody = { title: 'Test Schedule', participants: [] };

        await expect(
          service.insert(validUser as any, invalidWorkspaceId, mockBody as any)
        ).rejects.toThrow(BadRequestException);

        await expect(
          service.insert(validUser as any, invalidWorkspaceId, mockBody as any)
        ).rejects.toThrow('유효하지 않은 Workspace ID 형식입니다.');
      });

      it('should throw BadRequestException for invalid user ID', async () => {
        const validWorkspaceId = new Types.ObjectId().toString();
        const invalidUser = { _id: 'invalid-user-id', name: 'Test User' };
        const mockBody = { title: 'Test Schedule', participants: [] };

        await expect(
          service.insert(invalidUser as any, validWorkspaceId, mockBody as any)
        ).rejects.toThrow(BadRequestException);

        await expect(
          service.insert(invalidUser as any, validWorkspaceId, mockBody as any)
        ).rejects.toThrow('유효하지 않은 User ID 형식입니다.');
      });
    });

    describe('update', () => {
      it('should throw BadRequestException for invalid schedule ID', async () => {
        const invalidId = 'invalid-id';
        const mockBody = { title: 'Updated Schedule' };

        await expect(
          service.update(invalidId, mockBody as any)
        ).rejects.toThrow(BadRequestException);

        await expect(
          service.update(invalidId, mockBody as any)
        ).rejects.toThrow('유효하지 않은 Schedule ID 형식입니다.');
      });
    });

    describe('delete', () => {
      it('should throw BadRequestException for invalid schedule ID', async () => {
        const invalidId = 'invalid-id';

        await expect(service.delete(invalidId)).rejects.toThrow(
          BadRequestException
        );

        await expect(service.delete(invalidId)).rejects.toThrow(
          '유효하지 않은 Schedule ID 형식입니다.'
        );
      });
    });
  });
});
