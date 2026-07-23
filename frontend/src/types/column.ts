export type ColumnType = 'text' | 'number' | 'date' | 'phone';

export interface ColumnDefinition {
	id: string;
	key: string;
	label: string;
	type: ColumnType;
	order: number;
	isCore: boolean;
	isMandatory: boolean;
}
