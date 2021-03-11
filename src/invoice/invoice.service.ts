import { Get, HttpService, Injectable } from '@nestjs/common';

@Injectable()
export class InvoiceService {
  private headers = {
    'X-Consumer-Key': process.env.WEBMANIA_CONSUMER_KEY,
    'X-Consumer-Secret': process.env.WEBMANIA_CONSUMER_SECRET,
    'X-Access-Token': process.env.WEBMANIA_ACCESS_TOKEN,
    'X-Access-Token-Secret': process.env.WEBMANIA_ACCESS_TOKEN_SECRET,
  };

  constructor(private httpService: HttpService) {}

  public checkStatus(): void {
    this.httpService
      .get<{ status: boolean }>('https://webmaniabr.com/api/1/nfe/sefaz/', {
        headers: {
          ...this.headers,
        },
      })
      .subscribe(response => {
        console.log(response.data.status);
      });
  }
}
