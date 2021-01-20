Para fazer a integração com o mercado livre funcionar siga estas etapas

1. esteja logado na sua conta do mercado livre e entre no digituz
2. no mercado livre preencha as informações do seu endereço
3. adicione as variaveis de ambiente

### para criar uma api para teste entre com sua conta do mercado livre através deste link

https://developers.mercadolivre.com.br/

para teste ‘sua url de redirecionamento’ pode ser criada através do ngrok se necessario

Variáveis de Teste:

```text
ML_CLIENT_ID = 8549654584565096,
ML_CLIENT_SECRET = hnmngMTYNe6Uf8ogcdDzZ9VemjkayZ4s,
ML_REDIRECT_URL = 'https://2ad5522b7c94.ngrok.io/mercado-livre';
```

#####production keys
ML_CLIENT_ID = '6962689565848218';
ML_CLIENT_SECRET = '0j9pICVyBzxaQ8zGI4UdGlj5HkjWXn6Q';
ML_REDIRECT_URL = 'https://digituz.com.br/api/v1/mercado-livre';

4. vá no digituz entre na opção do mercado livre e clique no botão para vincular sua conta

5. agora sincornize os produtos com o mercado livre

6. depois de sincronizar algum produto vá ao mercado livre e veja seus anuncios, vá no menu do anuncio e clique alterar e selecione a forma de entrega como mercado envios( para que sejá habilitado a geração de etiquetas para envio)

para criar usuarios de teste basta utilizar esta url
https://api.mercadolibre.com/users/test_user?access_token=$token

para ver suas informações como vendedor
https://api.mercadolibre.com/users/me?access_token=$token
