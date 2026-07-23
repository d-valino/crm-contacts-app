import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { ContactsService } from './contacts.service';
import { Contact } from './entities/contact.entity';

type MockRepo = {
	create: jest.Mock;
	save: jest.Mock;
	findOneBy: jest.Mock;
	remove: jest.Mock;
	createQueryBuilder: jest.Mock;
};

function makeContact(overrides: Partial<Contact> = {}): Contact {
	return {
		id: 'contact-1',
		name: 'Jane Doe',
		enterprise: 'Acme',
		phone: '+33612345678',
		date: new Date('2024-01-01'),
		score: 3,
		customFields: {},
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
		...overrides,
	} as Contact;
}

function makeDuplicatePhoneError(): QueryFailedError {
	const err = new QueryFailedError('INSERT INTO contacts...', [], {
		code: '23505',
		message: 'duplicate key value violates unique constraint',
	} as any);
	// TypeORM normally copies driver-error fields onto the instance; set it
	// explicitly too so this test doesn't depend on that internal behavior.
	(err as any).code = '23505';
	return err;
}

describe('ContactsService', () => {
	let service: ContactsService;
	let repo: MockRepo;

	beforeEach(async () => {
		repo = {
			create: jest.fn((dto) => ({ ...dto })),
			save: jest.fn(),
			findOneBy: jest.fn(),
			remove: jest.fn(),
			createQueryBuilder: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [ContactsService, { provide: getRepositoryToken(Contact), useValue: repo }],
		}).compile();

		service = module.get<ContactsService>(ContactsService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('saves and returns the new contact', async () => {
			const dto = { name: 'Jane', phone: '+33612345678' } as any;
			const saved = makeContact();
			repo.save.mockResolvedValue(saved);

			const result = await service.create(dto);

			expect(repo.create).toHaveBeenCalledWith(dto);
			expect(repo.save).toHaveBeenCalled();
			expect(result).toBe(saved);
		});

		it('throws ConflictException on duplicate phone', async () => {
			repo.save.mockRejectedValue(makeDuplicatePhoneError());

			await expect(
				service.create({ name: 'Jane', phone: '+33612345678' } as any),
			).rejects.toThrow(ConflictException);
		});

		it('rethrows unrelated errors', async () => {
			const err = new Error('something else broke');
			repo.save.mockRejectedValue(err);

			await expect(
				service.create({ name: 'Jane', phone: '+33612345678' } as any),
			).rejects.toThrow(err);
		});
	});

	describe('findAll', () => {
		function mockQueryBuilder(contacts: Contact[], total: number) {
			const qb: any = {
				andWhere: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				addOrderBy: jest.fn().mockReturnThis(),
				skip: jest.fn().mockReturnThis(),
				take: jest.fn().mockReturnThis(),
				getManyAndCount: jest.fn().mockResolvedValue([contacts, total]),
			};
			repo.createQueryBuilder.mockReturnValue(qb);
			return qb;
		}

		it('searches only on name — never enterprise or another field', async () => {
			const qb = mockQueryBuilder([makeContact()], 1);

			await service.findAll({ page: 0, limit: 30, search: 'Jane', sortField: 'createdAt', direction: 'ASC' });

			expect(qb.andWhere).toHaveBeenCalledWith('contact.name ILIKE :search', { search: 'Jane%' });
		});

		it('does not filter by search when no search term is given', async () => {
			const qb = mockQueryBuilder([], 0);

			await service.findAll({ page: 0, limit: 30, sortField: 'createdAt', direction: 'ASC' });

			expect(qb.andWhere).not.toHaveBeenCalledWith(expect.stringContaining('ILIKE'), expect.anything());
		});

		it('applies min/max score filters when provided', async () => {
			const qb = mockQueryBuilder([], 0);

			await service.findAll({
				page: 0,
				limit: 30,
				sortField: 'createdAt',
				direction: 'ASC',
				minScore: 2,
				maxScore: 4,
			});

			expect(qb.andWhere).toHaveBeenCalledWith('contact.score >= :minScore', { minScore: 2 });
			expect(qb.andWhere).toHaveBeenCalledWith('contact.score <= :maxScore', { maxScore: 4 });
		});

		it('sorts, paginates and reports hasMore correctly', async () => {
			const qb = mockQueryBuilder([makeContact()], 45);

			const result = await service.findAll({ page: 1, limit: 30, sortField: 'score', direction: 'DESC' });

			expect(qb.orderBy).toHaveBeenCalledWith('contact.score', 'DESC');
			expect(qb.addOrderBy).toHaveBeenCalledWith('contact.id', 'ASC');
			expect(qb.skip).toHaveBeenCalledWith(30); // page 1 * limit 30
			expect(qb.take).toHaveBeenCalledWith(30);
			expect(result).toEqual({ contacts: [makeContact()], total: 45, hasMore: false }); // (1+1)*30=60, not < 45
		});
	});

	describe('findOne', () => {
		it('returns the contact when found', async () => {
			const contact = makeContact();
			repo.findOneBy.mockResolvedValue(contact);

			await expect(service.findOne('contact-1')).resolves.toBe(contact);
		});

		it('throws NotFoundException when missing', async () => {
			repo.findOneBy.mockResolvedValue(null);

			await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
		});
	});

	describe('update', () => {
		it('merges the dto onto the existing contact and saves it', async () => {
			const existing = makeContact({ score: 1 });
			repo.findOneBy.mockResolvedValue(existing);
			repo.save.mockImplementation((c) => Promise.resolve(c));

			const result = await service.update('contact-1', { score: 4 } as any);

			expect(result.score).toBe(4);
			expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ score: 4 }));
		});

		it('throws ConflictException on duplicate phone', async () => {
			repo.findOneBy.mockResolvedValue(makeContact());
			repo.save.mockRejectedValue(makeDuplicatePhoneError());

			await expect(
				service.update('contact-1', { phone: '+33698765432' } as any),
			).rejects.toThrow(ConflictException);
		});

		it('throws NotFoundException when the contact does not exist', async () => {
			repo.findOneBy.mockResolvedValue(null);

			await expect(service.update('missing-id', { score: 4 } as any)).rejects.toThrow(NotFoundException);
		});
	});

	describe('remove', () => {
		it('removes an existing contact', async () => {
			const contact = makeContact();
			repo.findOneBy.mockResolvedValue(contact);

			await service.remove('contact-1');

			expect(repo.remove).toHaveBeenCalledWith(contact);
		});

		it('throws NotFoundException when the contact does not exist', async () => {
			repo.findOneBy.mockResolvedValue(null);

			await expect(service.remove('missing-id')).rejects.toThrow(NotFoundException);
		});
	});
});
