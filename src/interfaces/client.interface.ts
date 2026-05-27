import { UpdateQuery } from 'mongoose';
import { UpdateClientDto } from 'src/dtos/client/UpdateClientDto';
import { Client } from 'src/schemas/client.schema';

export interface IClientRepository {
  findOne(filter: Partial<Client>): Promise<Client | null>;

  update(
    filter: Partial<Client>,
    data: UpdateQuery<UpdateClientDto>,
  ): Promise<Client | null>;

  deleteAll(where?: any): Promise<void>;
}
