import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ColumnDefinition } from './entities/column-definition.entity';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@Injectable()
export class ColumnsService {
	constructor(
		@InjectRepository(ColumnDefinition)
		private readonly columnsRepository: Repository<ColumnDefinition>,
	) {}

	findAll(): Promise<ColumnDefinition[]> {
		return this.columnsRepository.find({ order: { order: 'ASC' } });
	}

	async create(dto: CreateColumnDto): Promise<ColumnDefinition> {
		const maxOrder = await this.columnsRepository
			.createQueryBuilder('col')
			.select('MAX(col.order)', 'max')
			.getRawOne();

		const column = this.columnsRepository.create({
			key: `custom_${Date.now()}`,
			label: dto.label,
			type: dto.type,
			order: (maxOrder?.max ?? -1) + 1,
			isCore: false,
			isMandatory: false,
		});

		return this.columnsRepository.save(column);
	}

	async update(id: string, dto: UpdateColumnDto): Promise<ColumnDefinition> {
		const column = await this.findOneOrFail(id);

		if (dto.label !== undefined) column.label = dto.label;
		if (dto.type !== undefined) column.type = dto.type;

		return this.columnsRepository.save(column);
	}

	async remove(id: string): Promise<void> {
		const column = await this.findOneOrFail(id);

		if (column.isMandatory) {
			throw new ForbiddenException(`Column "${column.label}" cannot be deleted.`);
		}

		await this.columnsRepository.remove(column);
	}

	async reorder(orderedIds: string[]): Promise<ColumnDefinition[]> {
		const columns = await this.columnsRepository.findBy({});
		const columnMap = new Map(columns.map((c) => [c.id, c]));

		orderedIds.forEach((id, index) => {
			const column = columnMap.get(id);
			if (column) column.order = index;
		});

		await this.columnsRepository.save(Array.from(columnMap.values()));
		return this.findAll();
	}

	private async findOneOrFail(id: string): Promise<ColumnDefinition> {
		const column = await this.columnsRepository.findOneBy({ id });
		if (!column) {
			throw new NotFoundException(`Column with id ${id} not found`);
		}
		return column;
	}
}
