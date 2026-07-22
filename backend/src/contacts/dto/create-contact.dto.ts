import { IsNotEmpty, IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';

export class CreateContactDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsOptional()
	@IsString()
	enterprise?: string;

	@IsString()
	@IsNotEmpty()
	phone: string;

	@IsOptional()
	@IsDateString()
	date?: string;

	@IsOptional()
	@IsNumber()
	score?: number;
}
