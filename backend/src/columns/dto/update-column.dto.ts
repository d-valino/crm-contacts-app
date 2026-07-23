import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { ColumnType } from '../entities/column-definition.entity';

const VALID_TYPES: ColumnType[] = ['text', 'number', 'date', 'phone'];

export class UpdateColumnDto {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	label?: string;

	@IsOptional()
	@IsIn(VALID_TYPES)
	type?: ColumnType;
}
