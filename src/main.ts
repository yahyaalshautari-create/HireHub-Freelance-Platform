import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TokenService } from './token/token.service';
import { FRONTEND_URL } from './url';
import cookieParser from 'cookie-parser';
import { AuthSocketAdapter } from './socket/socket.adapter';
import { ValidationPipe } from '@nestjs/common';
import multer from 'multer';
import { GlobalExceptionFilter } from './filters/error.filter';
import { AppLogger } from './libs/debug.logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: new AppLogger(),
  });

  app.use(cookieParser());

  app.enableCors({
    origin: FRONTEND_URL, // Allow requests from the frontend URL
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  const tokenService = app.get(TokenService);
  app.useWebSocketAdapter(new AuthSocketAdapter(app, tokenService));

  const port = process.env.PORT || 9090

  await app.listen(port, '0.0.0.0');
  console.log(`Server running on  http://localhost:${port}`);
}
bootstrap();
