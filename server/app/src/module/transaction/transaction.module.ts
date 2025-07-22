import { forwardRef, Module, Provider } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionController } from './controller/transaction.controller';
import { TransactionService } from './service/transaction.service';
import { TransactionRepositoryImplement } from './repository/transaction.repository.implement';
import { Transaction, TransactionSchema } from './schema/transaction.schema';
import { User, UserSchema } from '../user/schema/user.schema';
import {
  Workspace,
  WorkspaceSchema
} from '../workspace/schema/workspace.schema';
import { UserModule } from '../user/user.module';
import { WorkspaceModule } from '../workspace/workspace.module';

const infrastructure: Provider[] = [
  {
    provide: 'TRANSACTION_REPOSITORY',
    useClass: TransactionRepositoryImplement
  }
];

const services = [TransactionService];

const controller = [TransactionController];

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Transaction.name, schema: TransactionSchema },
        { name: User.name, schema: UserSchema },
        { name: Workspace.name, schema: WorkspaceSchema }
      ],
      'lovechedule'
    ),
    forwardRef(() => UserModule),
    forwardRef(() => WorkspaceModule)
  ],
  controllers: [...controller],
  providers: [...services, ...infrastructure],
  exports: [...services, ...infrastructure]
})
export class TransactionModule {}
