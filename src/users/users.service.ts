import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import bcrypt from 'bcryptjs';
import { UserProfileDTO } from './user-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOne(email: string): Promise<User | undefined> {
    const users = await this.userRepository.find({
      email: email,
    });
    return users[0];
  }

  async getUserInfos(email: string) {
    const users = await this.userRepository.find({
      select: ['name', 'image', 'email'],
      where: { email: email },
    });
    return users[0];
  }

  async updateUser(loggedInUser: User, newProfile: UserProfileDTO) {
    const email = loggedInUser.email;
    if (newProfile.password) {
      newProfile.password = await bcrypt.hash(newProfile.password, 10);
    } else {
      delete newProfile.password;
    }
    await this.userRepository.update({ email }, newProfile);
  }
}
