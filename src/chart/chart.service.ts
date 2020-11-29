import { Injectable } from '@nestjs/common';
import moment, { Moment } from 'moment';

import { SalesOrderService } from '../sales-order/sales-order.service';
import { parseWeekDay } from '../util/parsers';

@Injectable()
export class ChartService {
  constructor(private salesOrderService: SalesOrderService) {}

  async graphicalData() {
    const threeDays = await this.salesOrderService.getSalesForLastNDays(3);
    const sevenDays = await this.salesOrderService.getSalesForLastNDays(7);
    const thirtyDays = await this.salesOrderService.getSalesForLastNDays(30);

    const threeDaysData = this.quantitySales(3, threeDays);
    const sevenDaysData = this.quantitySales(7, sevenDays);
    const thirtyDaysData = this.quantitySales(30, thirtyDays);

    return {
      threeDaysData: this.renderPeriod(3, threeDaysData),
      sevenDaysData: this.renderPeriod(7, sevenDaysData),
      thirtyDaysData: this.renderPeriod(30, thirtyDaysData),
    };
  }

  private renderPeriod(days, data) {
    const lastNDays = this.getLastNDays(days);
    return {
      labels: lastNDays.map(day => day.date.format('DD/MM')),
      datasets: [
        {
          backgroundColor: '#77b5e8',
          borderColor: '#1E88E5',
          borderWidth: 1,
          data: data,
        },
      ],
    };
  }

  getLastNDays(days) {
    // we add one day here because the while loop subtract one
    // i.e., if we didn't do that, we would ignore "today"
    const currentDay = moment().add(1, 'days');
    const lastNDays: { date: Moment }[] = [];
    while (lastNDays.length < days) {
      lastNDays.push({
        date: moment(currentDay.subtract(1, 'days')).startOf('day'),
      });
    }
    return lastNDays.reverse();
  }

  private quantitySales(days, sales) {
    const lastNDays = this.getLastNDays(days);
    return lastNDays
      .map(day => day.date)
      .map(date => {
        return sales
          .filter(sale => {
            return moment(sale.approvalDate)
              .startOf('day')
              .isSame(date);
          })
          .reduce((total, sale) => (total += sale.paymentDetails.total), 0)
          .toFixed(2);
      });
  }
}
