# Integração com o Mercado Livre (ML) dev

Para fazer a integração com o ML funcionar siga estas etapas

1. esteja logado na sua conta do ML e entre no digituz

2. no menu que aparece após entrar no ML quando passa o mouse pelo seu nome, clique na opção meus dados e preencha as informações do seu endereço,

## Acessar Conta do Desenvolvedor no ML

Vá para a seguinte página https://developers.mercadolivre.com.br/, e acesse com suas credenciais.

## Credenciais do Desenvolvedor no ML

Após logar como desenvolvedor no ML, siga as instrucoes aqui
https://developers.mercadolivre.com.br/pt_br/registre-o-seu-aplicativo, para criar seu `CLIENT_ID` e `CLIENT_SECRET`

## Var. de Ambiente

```text
ML_CLIENT_ID = 8549654584565096,
ML_CLIENT_SECRET = hnmngMTYNe6Uf8ogcdDzZ9VemjkayZ4s,
ML_REDIRECT_URL = 'https://2ad5522b7c94.ngrok.io/mercado-livre';
ML_SITE_ID=MLB
```

cartão para vendas de teste https://www.mercadopago.com.br/developers/en/guides/resources/localization/local-cards

para pegar seu token para as requisições de teste
curl -H 'Authorization: Bearer '\$JWT localhost:3005/v1/mercado-livre/token

# copy the token from the command above

MLTOKEN=APP_USR...065

para criar usuarios de teste basta utilizar esta url
https://api.mercadolibre.com/users/test_user?access_token=MLTOKEN

para ver suas informações como vendedor
https://api.mercadolibre.com/users/me?access_token=MLTOKEN
