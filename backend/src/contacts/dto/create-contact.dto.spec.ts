import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateContactDto } from './create-contact.dto';

async function validateDto(data: Partial<CreateContactDto>) {
	const dto = plainToInstance(CreateContactDto, data);
	return validate(dto);
}

describe('CreateContactDto', () => {
	const valid = { name: 'Jane Doe', phone: '+33612345678' };

	it('passes with just the required fields', async () => {
		expect(await validateDto(valid)).toHaveLength(0);
	});

	it('requires a name', async () => {
		const errors = await validateDto({ ...valid, name: '' });
		expect(errors.some((e) => e.property === 'name')).toBe(true);
	});

	it('rejects a phone number not in French format', async () => {
		const errors = await validateDto({ ...valid, phone: '0612345678' });
		expect(errors.some((e) => e.property === 'phone')).toBe(true);
	});

	it('accepts a phone number in the correct format', async () => {
		const errors = await validateDto({ ...valid, phone: '+33612345678' });
		expect(errors.some((e) => e.property === 'phone')).toBe(false);
	});

	it('allows enterprise and date to be omitted', async () => {
		expect(await validateDto(valid)).toHaveLength(0);
	});

	it('accepts a score of 0 and 5 (inclusive bounds)', async () => {
		expect(await validateDto({ ...valid, score: 0 })).toHaveLength(0);
		expect(await validateDto({ ...valid, score: 5 })).toHaveLength(0);
	});

	it('rejects a score below 0 or above 5', async () => {
		const tooLow = await validateDto({ ...valid, score: -1 });
		const tooHigh = await validateDto({ ...valid, score: 6 });

		expect(tooLow.some((e) => e.property === 'score')).toBe(true);
		expect(tooHigh.some((e) => e.property === 'score')).toBe(true);
	});

	it('allows an omitted score, since it is optional', async () => {
		const errors = await validateDto(valid);
		expect(errors.some((e) => e.property === 'score')).toBe(false);
	});
});
