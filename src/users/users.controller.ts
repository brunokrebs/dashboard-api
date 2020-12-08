import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserProfileDTO } from './user-profile.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findOne(@Request() req) {
    const loggedInUser = req.user;
    return this.usersService.getUserInfos(loggedInUser.email);
  }

  @Put()
  async updateUser(@Request() req, @Body() newProfile: UserProfileDTO) {
    const loggedInUser = req.user;
    return this.usersService.updateUser(loggedInUser, newProfile);
  }
}
