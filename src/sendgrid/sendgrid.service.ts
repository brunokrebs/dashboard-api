import { HttpService, Injectable } from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class SendgridService {
  constructor(
    private httpService: HttpService,
    private customerService: CustomersService,
  ) {}

  async createList(): Promise<any> {
    try {
      const response = await this.httpService
        .post(
          'https://api.sendgrid.com/v3/marketing/lists',
          {
            name: 'Customers',
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
            },
          },
        )
        .toPromise();

      return response.data;
    } catch (err) {
      console.log(err);
    }
  }

  async populateList(): Promise<any> {
    const users = await this.customerService.findAllUsersWithEmail();

    const listUsers = users.map(user => {
      const userSlipedName = this.splitAtFirstSpace(user.name);
      return {
        email: user.email,
        first_name: userSlipedName[0],
        last_name: userSlipedName[1],
        state_province_region: user.state,
      };
    });

    //essa variavel server para saber em quantas vezes vou ter que paginar
    //os usuarios para envia-los ao sendgrid, eu deixei enviar 70 usuarios por vez
    //pois é oque o sendgrid estava aceitndo pelos testes
    const qntSentUsers = Math.trunc(listUsers.length / 70) + 1;

    for (let i = 0; i < qntSentUsers; i++) {
      let initialPosition = i > 0 ? i * 70 : 0;
      let finalPosition = i > 0 ? i * 70 + 70 : 70;
      const list = listUsers.slice(initialPosition, finalPosition);
      setTimeout(async () => {
        try {
          const response = await this.httpService
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
          console.log(response.data);
          return response.data;
        } catch (err) {
          console.log(err);
        }
      }, 300 * i);
      initialPosition += 70;
      finalPosition += 70;
    }
  }

  private splitAtFirstSpace(name: string) {
    if (!name) return [];
    let i = name.indexOf(' ');
    if (i > 0) {
      return [name.substring(0, i), name.substring(i + 1)];
    } else return [name];
  }
}
