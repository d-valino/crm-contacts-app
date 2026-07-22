import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,			// strips properties not defined in the DTO
			forbidNonWhitelisted: true,	// throws an error if extra properties are sent
			transform: true,			// auto-converts payloads to DTO instances
		}),
	);

	app.enableCors({ origin: 'http://localhost:5173' }); // Vite default port

	await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
