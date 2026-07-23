import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { ContactsModule } from './contacts/contacts.module';
import { ColumnsModule } from './columns/columns.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		DatabaseModule,
		ContactsModule,
		ColumnsModule,
	],
})
export class AppModule {}
