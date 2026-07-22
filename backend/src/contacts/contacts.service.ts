import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

interface ContactFilters {
	page: number;
	limit: number;

	search?: string;
	searchField: string;

	minScore?: number;
	maxScore?: number;

	sortField: string;
	direction: 'ASC' | 'DESC';
}

@Injectable()
export class ContactsService {
	constructor(
		@InjectRepository(Contact)
		private readonly contactsRepository: Repository<Contact>,
	) {}

	create(createContactDto: CreateContactDto): Promise<Contact> {
		const contact = this.contactsRepository.create(createContactDto);
		return this.contactsRepository.save(contact);
	}

	async findAll(filters: ContactFilters) {
		const {
			page,
			limit,
			search,
			searchField,
			minScore,
			maxScore,
			sortField,
			direction,
		} = filters;

		const query = this.contactsRepository
			.createQueryBuilder('contact');

		if (search) {
			query.andWhere(
				`contact.${searchField} ILIKE :search`,
				{
					search: `${search}%`,
				}
			);
		}

		if (minScore !== undefined) {
			query.andWhere(
				'contact.score >= :minScore',
				{
					minScore,
				}
			);
		}

		if (maxScore !== undefined) {
			query.andWhere(
				'contact.score <= :maxScore',
				{
					maxScore,
				}
			);
		}

		query
			.orderBy(
				`contact.${sortField}`,
				direction
			)
			.addOrderBy(
				'contact.id',
				'ASC'
			)
			.skip(page * limit)
			.take(limit);

		const [contacts, total] =
			await query.getManyAndCount();

		return {
			contacts,
			total,
			hasMore: (page + 1) * limit < total,
		};
	}

	async findOne(id: string): Promise<Contact> {
		const contact = await this.contactsRepository.findOneBy({ id });
		if (!contact) {
			throw new NotFoundException(`Contact with id ${id} not found`);
		}
		return contact;
	}

	async update(id: string, updateContactDto: UpdateContactDto): Promise<Contact> {
		const contact = await this.findOne(id); // throws if not found
		Object.assign(contact, updateContactDto);
		return this.contactsRepository.save(contact);
	}

	async remove(id: string): Promise<void> {
		const contact = await this.findOne(id); // throws if not found
		await this.contactsRepository.remove(contact);
	}
}
