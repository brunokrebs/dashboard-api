# Integração com o Mercado Livre (ML)

Para integrar com o ML, você vai precisar seguir estes passos:

1. logar na sua conta de desenvolvedor do Mercado Livre
2. criar credenciais no ML
3. preencher
4. adicione as variáveis de ambiente

### para criar uma api para teste entre com sua conta do mercado livre através deste link

https://developers.mercadolivre.com.br/

para teste ‘sua url de redirecionamento’ pode ser criada através do ngrok se necessario

Variáveis de Teste

Siga esses passos para pegar seu client id e seu client secret: https://developers.mercadolivre.com.br/kjashdkhjbashjkbdjaw

Após isso, use essas informações no arquivo `.env` que fica na pasta raíz:

```text
ML_CLIENT_ID = 8549654584565096,
ML_CLIENT_SECRET = hnmngMTYNe6Uf8ogcdDzZ9VemjkayZ4s,
ML_REDIRECT_URL = 'https://2ad5522b7c94.ngrok.io/mercado-livre';
```

4. vá no digituz entre na opção do mercado livre e clique no botão para vincular sua conta

5. agora sincornize os produtos com o mercado livre

6. depois de sincronizar algum produto vá ao mercado livre e veja seus anuncios, vá no menu do anuncio e clique alterar e selecione a forma de entrega como mercado envios( para que sejá habilitado a geração de etiquetas para envio)

para criar usuarios de teste basta utilizar esta url
https://api.mercadolibre.com/users/test_user?access_token=$token

para ver suas informações como vendedor
https://api.mercadolibre.com/users/me?access_token=$token
