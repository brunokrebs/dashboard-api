/* eslint-disable @typescript-eslint/camelcase */
import { HttpService, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppLogger } from '../logger/app-logger.service';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class SendgridService {
  constructor(
    private httpService: HttpService,
    private customerService: CustomersService,
    private logger: AppLogger,
  ) {}

  // every hour
  @Cron('0 0 * * * *')
  async populateList(): Promise<any> {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    )
      return;

    const customers = await this.customerService.findCustomersWithEmail();

    const sendgridContacts = customers.map(customer => {
      const name = customer.name.split(' ');
      const firstName = name[0];
      const lastName = name.slice(1, name.length).join(' ');
      return {
        email: customer.email,
        first_name: firstName,
        last_name: lastName,
        state_province_region: customer.state,
      };
    });

    //essa variavel server para saber em quantas vezes vou ter que paginar
    //os usuarios para envia-los ao sendgrid, eu deixei enviar 70 usuarios por vez
    //pois é oque o sendgrid estava aceitndo pelos testes
    const pages = Math.trunc(sendgridContacts.length / 70) + 1;
    const jobs = [];

    for (let i = 0; i < pages; i++) {
      const initialPosition = i * 70;
      const finalPosition = initialPosition + 70;
      const list = sendgridContacts.slice(initialPosition, finalPosition);
      const job = this.httpService
        .put(
          'https://api.sendgrid.com/v3/marketing/contacts',
          { contacts: list },
          {
            headers: {
              Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        )
        .toPromise();
      jobs.push(job);
    }

    Promise.all(jobs)
      .then(() => {
        this.logger.log('Synced contacts with SendGrid.');
      })
      .catch(err => {
        this.logger.error('Error while syncing up contacts with SendGrid.');
        this.logger.error(err);
      });
  }
}
