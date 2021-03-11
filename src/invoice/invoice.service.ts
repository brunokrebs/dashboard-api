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

  public emitInvoice(): void {
    const invoice = {
      ID: 1137,
      // eslint-disable-next-line @typescript-eslint/camelcase
      url_notificacao: 'https://webmaniabr.com/retorno.php',
      operacao: 1,
      // eslint-disable-next-line @typescript-eslint/camelcase
      natureza_operacao: 'Venda de mercadorias',
      modelo: 1,
      finalidade: 1,
      ambiente: 2,
      cliente: {
        cpf: '009.622.850-48',
        // eslint-disable-next-line @typescript-eslint/camelcase
        nome_completo: 'Miguel Pereira da Silva',
        endereco: 'Av. Anita Garibaldi',
        complemento: 'Sala 809 Royal',
        numero: 850,
        bairro: 'Ahú',
        cidade: 'Curitiba',
        uf: 'PR',
        cep: '80540-180',
        telefone: '(41) 4063-9102',
        email: 'suporte@webmaniabr.com',
      },
      produtos: [
        {
          nome: 'Camisetas Night Run',
          sku: 'camiseta-night-run',
          ncm: '6109.10.00',
          cest: '28.038.00',
          quantidade: 3,
          unidade: 'UN',
          peso: 0.8,
          origem: 0,
          subtotal: 44.9,
          total: 134.7,
          // eslint-disable-next-line @typescript-eslint/camelcase
          classe_imposto: 'REF12625360',
        },
      ],
      pedido: {
        pagamento: 0,
        presenca: 2,
        // eslint-disable-next-line @typescript-eslint/camelcase
        modalidade_frete: 0,
        frete: 12.56,
        desconto: 10.0,
        total: 174.6,
      },
    };
    this.httpService
      .post<any>('https://webmaniabr.com/api/1/nfe/emissao/', invoice, {
        headers: {
          ...this.headers,
        },
      })
      .subscribe(
        response => {
          console.log(response.status);
          console.log(response.data.status);
        },
        error => {
          console.error(error);
        },
      );
  }
}
