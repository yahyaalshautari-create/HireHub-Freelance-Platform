import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateFreelancerDto } from 'src/dtos/freelancer/update-freelancer.dto';
import { Skills } from 'src/enums/freelancer.enum';
import { AuthUser } from 'src/interfaces/auth-user.interface';
import type { IFreelancerRepository } from 'src/interfaces/freelancer.interface';
import { assertOwnerOrAdmin, response } from 'src/libs/helpers';
import { messages } from 'src/libs/messages';

@Injectable()
export class FreelancerService {
  constructor(
    @Inject('IFreelancerRepository')
    private readonly freelancerRepository: IFreelancerRepository,
  ) {}

  async getFreelancer(freelancerId: string) {
    const profile = await this.freelancerRepository.findOne({ freelancerId });
    if (!profile) {
      throw new NotFoundException(messages.freelancer.notFound);
    }

    return response(profile, null);
  }
  async updateFreelancer(authUser: AuthUser, data: UpdateFreelancerDto) {
    const profile = await this.freelancerRepository.findOne({
      freelancerId: authUser._id,
    });

    if (!profile) {
      throw new NotFoundException(messages.freelancer.notFound);
    }

    assertOwnerOrAdmin({
      ownerId: profile.freelancerId,
      authUser,
      message: messages.freelancer.forbidden,
    });

    const hasData = Object.values(data).some((value) => value !== undefined);

    if (!hasData) {
      throw new BadRequestException(messages.freelancer.update.invalidSkills);
    }

    if (data.skills) {
      if (data.skills.includes(Skills.NO_SKILLS) && data.skills.length > 1) {
        throw new BadRequestException(messages.freelancer.update.invalidSkills);
      }

      if (data.skills.length === 0) {
        data.skills = [Skills.NO_SKILLS];
      }
    }

    const updatedProfile = await this.freelancerRepository.update(
      { freelancerId: authUser._id },
      data,
    );

    return response(updatedProfile, messages.freelancer.success);
  }
}
