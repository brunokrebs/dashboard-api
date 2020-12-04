import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findOne(@Query('email') email: string) {
    return this.usersService.getUserInfos(email);
  }

  @Put()
  async updateUser(@Body() user: User) {
    return this.usersService.updateUser(user);
  }
}
