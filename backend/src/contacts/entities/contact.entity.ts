import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contacts')
export class Contact {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'varchar' })
	name: string;

	@Column({ type: 'varchar', nullable: true })
	enterprise: string | null;

	@Column({ type: 'varchar', unique: true })
	phone: string;

	@Column({ type: 'date', default: () => 'CURRENT_DATE' })
	date: Date;

	@Column({ type: 'int', default: 0 })
	score: number;

	@Column({ type: 'jsonb', default: {} })
	customFields: Record<string, string | number | null>;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
