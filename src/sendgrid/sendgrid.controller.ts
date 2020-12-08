import { Controller, Get, Post } from '@nestjs/common';
import { SendgridService } from './sendgrid.service';

@Controller('sendgrid')
export class SendgridController {
  constructor(private sendgridService: SendgridService) {}

  @Post('create-list')
  async createList() {
    return this.sendgridService.createList();
  }

  @Post()
  async populateList() {
    return this.sendgridService.populateList();
  }
}
