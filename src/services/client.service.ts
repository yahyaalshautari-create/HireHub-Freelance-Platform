import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateClientDto } from 'src/dtos/client/UpdateClientDto';
import { AuthUser } from 'src/interfaces/auth-user.interface';
import type { IClientRepository } from 'src/interfaces/client.interface';
import { assertOwnerOrAdmin, response } from 'src/libs/helpers';
import { messages } from 'src/libs/messages';

@Injectable()
export class ClientService {
  constructor(
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
  ) {}

  async getClient(clientId: string) {
    const profile = await this.clientRepository.findOne({ clientId });

    if (!profile) {
      throw new NotFoundException(messages.client.notFound);
    }

    return response(profile, null);
  }

  async updateClient(authUser: AuthUser, data: UpdateClientDto) {
    const profile = await this.clientRepository.findOne({
      clientId: authUser._id,
    });

    if (!profile) {
      throw new NotFoundException(messages.client.notFound);
    }

    assertOwnerOrAdmin({
      ownerId: profile.clientId,
      authUser,
      message: messages.client.forbidden,
    });

    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestException(messages.client.update.noData);
    }

    const updatedProfile = await this.clientRepository.update(
      { clientId: authUser._id },
      data,
    );

    return response(updatedProfile, messages.client.success);
  }
}
