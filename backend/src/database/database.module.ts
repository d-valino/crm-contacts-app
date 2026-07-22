import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				type: 'postgres',
				host: configService.get('database.host'),
				port: configService.get('database.port'),
				username: configService.get('database.user'),
				password: configService.get('database.password'),
				database: configService.get('database.name'),
				autoLoadEntities: true, // auto-registers entities declared in feature modules
				synchronize: true, // ⚠️ dev only — auto-creates tables from entities
			}),
		}),
	],
})
export class DatabaseModule {}
