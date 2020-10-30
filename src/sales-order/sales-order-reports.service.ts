import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Moment } from 'moment';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { PaymentStatus } from './entities/payment-status.enum';
import { PaymentType } from './entities/payment-type.enum';
import { SaleOrderItem } from './entities/sale-order-item.entity';

import { SaleOrder } from './entities/sale-order.entity';

@Injectable()
export class SalesOrderReportsService {
  constructor(
    @InjectRepository(SaleOrder)
    private salesOrderRepository: Repository<SaleOrder>,
    @InjectRepository(SaleOrderItem)
    private salesOrderItemRepository: Repository<SaleOrderItem>,
  ) {}

  async generateReport(
    groupedBy: string,
    startDate: Moment,
    endDate: Moment,
    xlsx: boolean,
  ) {
    switch (groupedBy) {
      case 'CUSTOMER':
        return this.generateReportByCustomer(startDate, endDate, xlsx);
      case 'PRODUCT':
        return this.generateReportByProduct(startDate, endDate, xlsx);
      case 'PRODUCT_VARIATION':
        return this.generateReportByProductVariation(startDate, endDate, xlsx);
      case 'APPROVAL_DATE':
        return this.generateReportByApprovalDate(startDate, endDate, xlsx);
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

    const header = ['Nome', 'Email', 'Numero de Telefone', 'Total'];
    const columnConfig = [{ wch: 40 }, { wch: 40 }, { wch: 25 }, { wch: 20 }];
    return this.exportXls(reportResults, header, columnConfig);
  }

  private async generateReportByProduct(
    startDate: Moment,
    endDate: Moment,
    xlsx: boolean,
  ) {
    const columns = [
      'product.sku as sku',
      'product.title as title',
      'SUM(soi.amount) as amount',
      'ROUND(SUM((soi.price * soi.amount) - (soi.discount * soi.amount)), 2) as Total',
    ];

    const reportResults = await this.salesOrderItemRepository
      .createQueryBuilder('soi')
      .select(columns)
      .leftJoin('soi.saleOrder', 'so')
      .leftJoin('soi.productVariation', 'pv')
      .leftJoin('pv.product', 'product')
      .where(`so.paymentDetails.paymentStatus = :paymentStatus`, {
        paymentStatus: PaymentStatus.APPROVED,
      })
      .andWhere(`so.creationDate >= :startDate`, { startDate })
      .andWhere(`so.creationDate <= :endDate`, { endDate })
      .groupBy('product.id')
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

    const header = ['SKU', 'PRODUTO', 'Quantidade', 'Total'];
    const columnConfig = [{ wch: 15 }, { wch: 60 }, { wch: 10 }, { wch: 10 }];
    return this.exportXls(reportResults, header, columnConfig);
  }

  private async generateReportByProductVariation(
    startDate: Moment,
    endDate: Moment,
    xlsx: boolean,
  ) {
    const columns = [
      'p.sku as productSku',
      'p.title as title',
      'pv.description as description',
      'SUM(soi.amount) as amount',
      'ROUND(SUM((soi.price * soi.amount) - (soi.discount * soi.amount)),2) as Total',
    ];

    if (!xlsx) {
      columns.push('p.sku as SKU');
    }

    const reportResults = await this.salesOrderItemRepository
      .createQueryBuilder('soi')
      .select(columns)
      .leftJoin('soi.saleOrder', 'so')
      .leftJoin('soi.productVariation', 'pv')
      .leftJoin('pv.product', 'p')
      .where('so.creationDate >= :startDate', { startDate })
      .andWhere('so.creationDate <= :endDate', { endDate })
      .andWhere('so.paymentDetails.paymentStatus = :paymentStatus', {
        paymentStatus: PaymentStatus.APPROVED,
      })
      .groupBy('pv.id, p.sku, p.title')
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
      'SKU',
      'PRODUTO',
      'Descrição do Produto',
      'Quantidade',
      'Total',
    ];
    const columnConfig = [
      { wch: 15 },
      { wch: 60 },
      { wch: 25 },
      { wch: 10 },
      { wch: 10 },
    ];
    return this.exportXls(reportResults, header, columnConfig);
  }

  private async generateReportByApprovalDate(
    startDate: Moment,
    endDate: Moment,
    xlsx: boolean,
  ) {
    const columns = [
      'DATE(so.approval_date) as approvalDate',
      'so.payment_type as paymentType',
      'count(1) as count',
      'SUM(total) as total',
    ];

    let reportResults = await this.salesOrderRepository
      .createQueryBuilder('so')
      .select(columns)
      .where(`so.paymentDetails.paymentStatus = :paymentStatus`, {
        paymentStatus: PaymentStatus.APPROVED,
      })
      .andWhere(`so.creationDate >= :startDate`, { startDate })
      .andWhere(`so.creationDate <= :endDate`, { endDate })
      .groupBy('approvalDate, so.payment_type')
      .orderBy('approvalDate', 'DESC')
      .getRawMany();

    const datesInMs = reportResults.map(s => s.approvaldate.getTime());
    reportResults = datesInMs
      // removing duplicates
      .filter((dateInMs, idx) => datesInMs.indexOf(dateInMs) === idx)
      // groupby results by date
      .map(dateInMs => {
        const slip = reportResults.find(
          s =>
            s.paymenttype === PaymentType.BANK_SLIP &&
            s.approvaldate.getTime() === dateInMs,
        );
        const card = reportResults.find(
          s =>
            s.paymenttype === PaymentType.CREDIT_CARD &&
            s.approvaldate.getTime() === dateInMs,
        );
        return {
          approvalDate: new Date(dateInMs),
          bankSlipCount: slip ? Number.parseInt(slip.count) : 0,
          bankSlip: slip ? Number.parseFloat(slip.total) : 0,
          cardCount: card ? Number.parseInt(card.count) : 0,
          card: card ? Number.parseFloat(card.total) : 0,
        };
      });

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
      'Qted. Boletos',
      'Boletos',
      'Qted. de Cartões',
      'Cartão de Credito',
    ];
    const columnConfig = [
      { wch: 15 },
      { wch: 15 },
      { wch: 7 },
      { wch: 15 },
      { wch: 15 },
    ];
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
    let workSheet = XLSX.utils.sheet_add_aoa(wb, [header]);
    workSheet = XLSX.utils.sheet_add_json(wb, reportData, {
      origin: 'A2',
      skipHeader: true,
    });

    workSheet['!cols'] = columnConfig;
    XLSX.utils.book_append_sheet(wb, workSheet, 'Vendas');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}
