import { IsNotEmpty, IsOptional, IsString, IsDateString, IsNumber, Matches } from 'class-validator';

export class CreateContactDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsOptional()
	@IsString()
	enterprise?: string;

	@IsString()
	@IsNotEmpty()
	@Matches(/^\+33[1-9]\d{8}$/, { message: 'Phone must be a valid French number in the format +33XXXXXXXXX' })
	phone: string;

	@IsOptional()
	@IsDateString()
	date?: string;

	@IsOptional()
	@IsNumber()
	score?: number;
}
