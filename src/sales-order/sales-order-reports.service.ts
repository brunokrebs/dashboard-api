import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Moment } from 'moment';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { PaymentStatus } from './entities/payment-status.enum';

import { SaleOrder } from './entities/sale-order.entity';

@Injectable()
export class SalesOrderReportsService {
  constructor(
    @InjectRepository(SaleOrder)
    private salesOrderRepository: Repository<SaleOrder>,
  ) {}

  async generateReport(
    groupedBy: string,
    startDate: Moment,
    endDate: Moment,
    xlsx: boolean,
  ) {
    switch (groupedBy) {
      case groupedBy:
        return this.generateReportByCustomer(startDate, endDate, xlsx);
    }
  }

  private async generateReportByCustomer(
    startDate: Moment,
    endDate: Moment,
    xlsx: boolean,
  ) {
    const columns = [
      'customer.name as name',
      'customer.email as email',
      'customer.phone_number',
      'SUM(so.paymentDetails.total) as total',
    ];

    if (!xlsx) columns.push('customer.id as id');

    const reportResults = await this.salesOrderRepository
      .createQueryBuilder('so')
      .select(columns)
      .leftJoin('so.customer', 'customer')
      .where(`so.paymentDetails.paymentStatus = :paymentStatus`, {
        paymentStatus: PaymentStatus.APPROVED,
      })
      .andWhere(`so.creationDate >= :startDate`, { startDate })
      .andWhere(`so.creationDate <= :endDate`, { endDate })
      .groupBy(
        'customer.name, customer.email, customer.phone_number, customer.id',
      )
      .orderBy('total', 'DESC')
      .getRawMany();

    if (!xlsx)
      return {
        items: reportResults,
        meta: {
          totalItems: reportResults.length,
          itemCount: reportResults.length,
          itemsPerPage: reportResults.length,
          totalPages: 1,
          currentPage: 1,
        },
        links: { first: '', previous: '', next: '', last: '' },
      };

    const header = [
      'Data de Aprovação',
      'Boletos',
      'Qted. Boletos',
      'Cartão de Credito',
      'Qted. de Vendas no Credito',
    ];
    const columnConfig = [{ wch: 40 }, { wch: 40 }, { wch: 25 }, { wch: 20 }];
    return this.exportXls(reportResults, header, columnConfig);
  }

  private async exportXls(
    reportData: any,
    header: string[],
    columnConfig: { wch: number }[],
  ) {
    const wb = XLSX.utils.book_new();
    wb.Props = {
      Title: 'Relatório de Vendas',
      CreatedDate: new Date(),
    };
    const workSheet = XLSX.utils.json_to_sheet(reportData, { header });

    workSheet['!cols'] = columnConfig;
    XLSX.utils.book_append_sheet(wb, workSheet, 'Vendas');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}
