const express = require('express');
const app = express(); //само приложение
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Сервер работает');
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Счётчик подключений</title>
        <meta charset="utf-8">
      </head>
      <body>
        <h1>Клиентская страница</h1>
        <p>Здесь позже появится номер подключения</p>
      </body>
    </html>
  `;
  res.send(html);
}); //Когда кто то заходить на сервер выводит

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
}); // пишет в консоль сервере на каком порту он запущен