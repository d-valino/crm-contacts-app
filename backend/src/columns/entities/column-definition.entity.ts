import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type ColumnType = 'text' | 'number' | 'date' | 'phone';

@Entity('column_definitions')
export class ColumnDefinition {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar', unique: true })
	key: string;

	@Column({ type: 'varchar' })
	label: string;

	@Column({ type: 'varchar' })
	type: ColumnType;

	@Column({ type: 'int' })
	order: number;

	@Column({ type: 'boolean', default: false })
	isCore: boolean;

	@Column({ type: 'boolean', default: false })
	isMandatory: boolean; // true for name/phone — cannot be deleted, must stay required
}
