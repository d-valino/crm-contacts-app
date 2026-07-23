import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import type { ColumnType } from '../entities/column-definition.entity';

const VALID_TYPES: ColumnType[] = ['text', 'number', 'date', 'phone'];

export class CreateColumnDto {
	@IsString()
	@IsNotEmpty()
	label: string;

	@IsIn(VALID_TYPES)
	type: ColumnType;
}
