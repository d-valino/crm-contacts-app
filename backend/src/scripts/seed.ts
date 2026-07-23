import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppModule } from '../app.module';
import { Contact } from '../contacts/entities/contact.entity';

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

async function seed() {
	const app = await NestFactory.createApplicationContext(AppModule);

	try {
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
	} finally {
		await app.close();
	}
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
