import fetch from 'node-fetch';

export function sendSlackAlert(message: string = 'Houve um erro inesperado') {
  const formatedMessage = {
    text: 'Falha em Digituz Dashboard API',
    attachments: [
      {
        text: message,
        fallback: 'Não a erro',
        callback_id: 'wopr_game',
        color: '#3AA3E3',
        attachment_type: 'default',
        actions: [
          {
            name: 'goDatadog',
            text: 'Ir para os logs do datadog',
            style: 'danger',
            type: 'button',
            value: 'war',
            url: 'https://app.datadoghq.com/logs?index=%2A&query=',
          },
        ],
      },
    ],
  };

  try {
    fetch(process.env.ERROR_CHANNEL, {
      mode: 'no-cors',
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(formatedMessage),
    })
      .then(() => console.log('sucesso'))
      .catch(err => console.log(err));
  } catch (err) {
    console.log(err);
  }
}
