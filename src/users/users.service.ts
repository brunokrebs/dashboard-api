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
    const name = user.name.trim();
    const password = user.password ? user.password.trim() : null;

    const { id, email } = await this.userRepository.findOne({
      where: { email: user.email },
    });

    if (name !== '' && password !== '' && email === user.email) {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      } else {
        delete user.password;
        //password is deleted because it when null the query failed
      }
      await this.userRepository.update(id, user);
    } else {
      throw new Error('user name and password can not be an empity string');
    }
  }
}
