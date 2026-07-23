import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { ColumnDefinition } from './entities/column-definition.entity';

type MockRepo = {
	find: jest.Mock;
	findBy: jest.Mock;
	findOneBy: jest.Mock;
	create: jest.Mock;
	save: jest.Mock;
	remove: jest.Mock;
	createQueryBuilder: jest.Mock;
};

function makeColumn(overrides: Partial<ColumnDefinition> = {}): ColumnDefinition {
	return {
		id: 'col-1',
		key: 'name',
		label: 'Name',
		type: 'text',
		order: 0,
		isCore: true,
		isMandatory: true,
		...overrides,
	} as ColumnDefinition;
}

describe('ColumnsService', () => {
	let service: ColumnsService;
	let repo: MockRepo;

	beforeEach(async () => {
		repo = {
			find: jest.fn(),
			findBy: jest.fn(),
			findOneBy: jest.fn(),
			create: jest.fn((data) => data),
			save: jest.fn(),
			remove: jest.fn(),
			createQueryBuilder: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [ColumnsService, { provide: getRepositoryToken(ColumnDefinition), useValue: repo }],
		}).compile();

		service = module.get<ColumnsService>(ColumnsService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findAll', () => {
		it('returns columns ordered by their order field', async () => {
			const columns = [makeColumn()];
			repo.find.mockResolvedValue(columns);

			await expect(service.findAll()).resolves.toBe(columns);
			expect(repo.find).toHaveBeenCalledWith({ order: { order: 'ASC' } });
		});
	});

	describe('create', () => {
		function mockMaxOrder(max: number | null) {
			const qb: any = {
				select: jest.fn().mockReturnThis(),
				getRawOne: jest.fn().mockResolvedValue(max === null ? undefined : { max }),
			};
			repo.createQueryBuilder.mockReturnValue(qb);
		}

		it('always creates a custom, non-core, non-mandatory column with a generated key', async () => {
			mockMaxOrder(3);
			repo.save.mockImplementation((c) => Promise.resolve({ id: 'new-id', ...c }));

			const result = await service.create({ label: 'LinkedIn', type: 'text' });

			expect(repo.create).toHaveBeenCalledWith(
				expect.objectContaining({
					label: 'LinkedIn',
					type: 'text',
					isCore: false,
					isMandatory: false,
					order: 4,
				}),
			);
			expect(repo.create.mock.calls[0][0].key).toMatch(/^custom_\d+$/);
			expect(result.id).toBe('new-id');
		});

		it('starts at order 0 when there are no existing columns', async () => {
			mockMaxOrder(null);
			repo.save.mockImplementation((c) => Promise.resolve(c));

			await service.create({ label: 'First', type: 'text' });

			expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ order: 0 }));
		});

		it('ignores any client-supplied key/isCore/isMandatory — always generates its own', async () => {
			mockMaxOrder(0);
			repo.save.mockImplementation((c) => Promise.resolve(c));

			// CreateColumnDto only exposes label/type, but guard against a future
			// regression that widens the DTO without updating the service.
			await service.create({ label: 'Score', type: 'number' } as any);

			const created = repo.create.mock.calls[0][0];
			expect(created.key).not.toBe('score');
			expect(created.isCore).toBe(false);
		});
	});

	describe('update', () => {
		it('only overwrites the fields provided', async () => {
			const existing = makeColumn({ label: 'Old label', type: 'text', isCore: false, isMandatory: false });
			repo.findOneBy.mockResolvedValue(existing);
			repo.save.mockImplementation((c) => Promise.resolve(c));

			const result = await service.update('col-1', { label: 'New label' });

			expect(result.label).toBe('New label');
			expect(result.type).toBe('text'); // untouched
		});

		it('throws NotFoundException for an unknown column', async () => {
			repo.findOneBy.mockResolvedValue(null);

			await expect(service.update('missing', { label: 'X' })).rejects.toThrow(NotFoundException);
		});
	});

	describe('remove', () => {
		it('deletes a non-mandatory column', async () => {
			const column = makeColumn({ isMandatory: false });
			repo.findOneBy.mockResolvedValue(column);

			await service.remove('col-1');

			expect(repo.remove).toHaveBeenCalledWith(column);
		});

		it('refuses to delete a mandatory column', async () => {
			const column = makeColumn({ isMandatory: true, label: 'Phone' });
			repo.findOneBy.mockResolvedValue(column);

			await expect(service.remove('col-1')).rejects.toThrow(ForbiddenException);
			expect(repo.remove).not.toHaveBeenCalled();
		});

		it('throws NotFoundException for an unknown column', async () => {
			repo.findOneBy.mockResolvedValue(null);

			await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
		});
	});

	describe('reorder', () => {
		it('assigns each column its new index and saves them', async () => {
			const colA = makeColumn({ id: 'a', order: 0 });
			const colB = makeColumn({ id: 'b', order: 1 });
			const colC = makeColumn({ id: 'c', order: 2 });
			repo.findBy.mockResolvedValue([colA, colB, colC]);
			repo.save.mockResolvedValue(undefined);
			repo.find.mockResolvedValue([colC, colB, colA]); // re-fetch after reorder

			const result = await service.reorder(['c', 'a', 'b']);

			expect(colC.order).toBe(0);
			expect(colA.order).toBe(1);
			expect(colB.order).toBe(2);
			expect(repo.save).toHaveBeenCalledWith(expect.arrayContaining([colA, colB, colC]));
			expect(result).toEqual([colC, colB, colA]);
		});

		it('ignores ids that no longer exist', async () => {
			const colA = makeColumn({ id: 'a', order: 0 });
			repo.findBy.mockResolvedValue([colA]);
			repo.save.mockResolvedValue(undefined);
			repo.find.mockResolvedValue([colA]);

			await service.reorder(['a', 'deleted-id']);

			expect(colA.order).toBe(0);
		});
	});
});
