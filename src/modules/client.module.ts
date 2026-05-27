import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientController } from 'src/controllers/client.controller';
import { ClientRepository } from 'src/repository/client.repository';
import { Client, ClientSchema } from 'src/schemas/client.schema';
import { ClientService } from 'src/services/client.service';
import { TokenModule } from 'src/token/token.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Client.name, schema: ClientSchema }]),
    TokenModule,
  ],
  controllers: [ClientController],
  providers: [
    ClientService,
    {
      provide: 'IClientRepository',
      useClass: ClientRepository,
    },
  ],
})
export class ClientModule {}
