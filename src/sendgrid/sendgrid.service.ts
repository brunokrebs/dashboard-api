import { HttpService, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class SendgridService {
  constructor(
    private httpService: HttpService,
    private customerService: CustomersService,
  ) {}

  //every 10 minutes
  @Cron('0 */10 * * * *')
  async populateList(): Promise<any> {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    )
      return;

    const users = await this.customerService.findAllUsersWithEmail();

    const listUsers = users.map(user => {
      const name = user.name.split(' ');
      const firstName = name[0];
      const lastName = name.slice(1, name.length).join(' ');
      return {
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        state_province_region: user.state,
      };
    });

    //essa variavel server para saber em quantas vezes vou ter que paginar
    //os usuarios para envia-los ao sendgrid, eu deixei enviar 70 usuarios por vez
    //pois é oque o sendgrid estava aceitndo pelos testes
    const pages = Math.trunc(listUsers.length / 70) + 1;
    const jobs = [];

    for (let i = 0; i < pages; i++) {
      let initialPosition = i * 70;
      let finalPosition = i * 70 + 70;
      const list = listUsers.slice(initialPosition, finalPosition);
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
      .then(values => console.log(values))
      .catch(err => console.log(err));
  }
}
