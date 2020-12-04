import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import bcrypt from 'bcryptjs';

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

  async updateUser(user: User) {
    const { id } = await this.userRepository.findOne({
      where: { email: user.email },
    });

    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
      this.userRepository.update(id, {
        name: user.name,
        password: user.password,
      });
    } else {
      this.userRepository.update(id, { name: user.name });
    }
  }
}
