import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChartService } from './chart.service';

@Controller('/chart')
@UseGuards(JwtAuthGuard)
export class ChartController {
  constructor(private chartService: ChartService) {}

  @Get('/home')
  async graphicalData() {
    return this.chartService.graphicalData();
  }
}
