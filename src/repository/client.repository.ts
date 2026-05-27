import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IClientRepository } from 'src/interfaces/client.interface';
import { Client, ClientDocument } from 'src/schemas/client.schema';
import { UpdateClientDto } from 'src/dtos/client/UpdateClientDto';

@Injectable()
export class ClientRepository implements IClientRepository {
  constructor(
    @InjectModel(Client.name)
    private readonly clientModel: Model<ClientDocument>,
  ) {}

  async findOne(filter: Partial<Client>): Promise<Client | null> {
    return this.clientModel.findOne(filter).exec();
  }

  async update(
    filter: Partial<Client>,
    data: Partial<UpdateClientDto>,
  ): Promise<Client | null> {
    return this.clientModel.findOneAndUpdate(
      filter,
      { $set: data },
      { new: true },
    );
  }

  async deleteAll(where: any = {}): Promise<void> {
    await this.clientModel.deleteMany(where).exec();
  }
}
