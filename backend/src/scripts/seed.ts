import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppModule } from '../app.module';
import { Contact } from '../contacts/entities/contact.entity';
import { ColumnDefinition } from '../columns/entities/column-definition.entity';

const firstNames = [
	'Emma', 'Liam', 'Noah', 'Olivia', 'Lucas', 'Sophia',
	'Hugo', 'Alice', 'Jules', 'Chloé', 'Louis', 'Léa',
	'Gabriel', 'Camille', 'Nathan', 'Sarah',
];

const lastNames = [
	'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert',
	'Petit', 'Richard', 'Durand', 'Moreau', 'Simon',
	'Laurent', 'Michel', 'Garcia', 'Roux', 'David',
];

const companies = [
	'Google',
	'Microsoft',
	'Apple',
	'Amazon',
	'Meta',
	'Spotify',
	'Netflix',
	'Airbus',
	'Capgemini',
	'Dassault Systèmes',
	'Ubisoft',
	'Rodium',
	'',
];

const coreColumns = [
	{ key: 'name', label: 'Name', type: 'text', order: 0, isCore: true, isMandatory: true },
	{ key: 'enterprise', label: 'Enterprise', type: 'text', order: 1, isCore: true, isMandatory: false },
	{ key: 'phone', label: 'Phone', type: 'phone', order: 2, isCore: true, isMandatory: true },
	{ key: 'date', label: 'Date', type: 'date', order: 3, isCore: true, isMandatory: false },
	{ key: 'score', label: 'Score', type: 'number', order: 4, isCore: true, isMandatory: false },
] as const satisfies Omit<ColumnDefinition, 'id'>[];

function randomItem<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

function randomPhone(usedPhones: Set<string>): string {
	const prefixes = ['6', '7'];
	let phone: string;

	do {
		phone =
			'+33' +
			randomItem(prefixes) +
			Math.floor(10000000 + Math.random() * 90000000);
	} while (usedPhones.has(phone));

	usedPhones.add(phone);
	return phone;
}

function randomDate(): Date {
	const start = new Date(2020, 0, 1).getTime();
	const end = Date.now();

	return new Date(start + Math.random() * (end - start));
}

function randomScore(): number {
	return Math.floor(Math.random() * 6);
}

async function seedColumns(app: Awaited<ReturnType<typeof NestFactory.createApplicationContext>>) {
	const columnRepository = app.get<Repository<ColumnDefinition>>(
		getRepositoryToken(ColumnDefinition),
	);

	await columnRepository.clear();
	await columnRepository.insert(coreColumns);

	console.log(`${coreColumns.length} core columns created.`);
}

async function seedContacts(app: Awaited<ReturnType<typeof NestFactory.createApplicationContext>>) {
	const repository = app.get<Repository<Contact>>(
		getRepositoryToken(Contact),
	);

	await repository.clear();

	const usedPhones = new Set<string>();
	const contacts: Array<Contact> = [];
	for (let index = 0; index < 500; index++) {
		contacts.push(
			repository.create({
			name: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
			enterprise: randomItem(companies) || null,
			phone: randomPhone(usedPhones),
			date: randomDate(),
			score: randomScore(),
			}),
		);
		await repository.insert(contacts[index]);
	}
	console.log(`${contacts.length} contacts created.`);
}

async function seed() {
	const app = await NestFactory.createApplicationContext(AppModule);

	try {
		await seedColumns(app);
		await seedContacts(app);
	} finally {
		await app.close();
	}
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
