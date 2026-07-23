import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColumnsService } from './columns.service';
import { ColumnsController } from './columns.controller';
import { ColumnDefinition } from './entities/column-definition.entity';

@Module({
	imports: [TypeOrmModule.forFeature([ColumnDefinition])],
	controllers: [ColumnsController],
	providers: [ColumnsService],
	exports: [ColumnsService],
})
export class ColumnsModule {}
