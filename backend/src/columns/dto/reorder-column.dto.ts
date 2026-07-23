import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderColumnsDto {
	@IsArray()
	@ArrayNotEmpty()
	@IsUUID('4', { each: true })
	orderedIds: string[];
}
