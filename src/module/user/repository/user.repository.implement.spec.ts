import { Test, TestingModule } from '@nestjs/testing';
import { UserRepositoryImplement } from './user.repository.implement';

describe('UserRepositoryImplement', () => {
  let service: UserRepositoryImplement;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserRepositoryImplement],
    }).compile();

    service = module.get<UserRepositoryImplement>(UserRepositoryImplement);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
