import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<User> {
    const user = await this.usersService.findOne(username);
    const isValidPassword = await bcrypt.compare(pass, user.password);
    if (user && isValidPassword) {
      delete user.password;
      return user;
    }
    return null;
  }

  async login(user: User) {
    const dbUser = await this.usersService.findOne(user.email);
    const payload = {
      username: dbUser.email,
      sub: dbUser.id,
      name: dbUser.name,
      image: dbUser.image,
    };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '4d' }),
    };
  }
}
