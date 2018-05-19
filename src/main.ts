import * as express from 'express';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import AV = require('leanengine');
let PORT = 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await AV.init({
    appId: 'R6WVbOfXJcKUOkqPPjcF5sKY-9Nh9j0Va',
    appKey: 'g8LzQz8yC7dcDj8XXYnPNk0o',
    masterKey: 'WidzveEgaDBQsW0iqxxEveEG',
  });

  app.use(express.static(path.join(__dirname, 'public')));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  if (process.env.LEANCLOUD_APP_PORT ){
    PORT = parseInt(process.env.LEANCLOUD_APP_PORT, 10);
  }

  await app.listen(PORT);
}
bootstrap();
