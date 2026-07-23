import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsIn, IsString, Min, Max} from 'class-validator';


export class FindContactsDto {
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	page: number = 0;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	limit: number = 30;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	@Max(5)
	minScore?: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	@Max(5)
	maxScore?: number;

	@IsOptional()
	@IsString()
	@IsIn([
		'name',
		'enterprise',
		'phone',
		'date',
		'score',
		'createdAt',
	])
	sortField: string = 'createdAt';

	@IsOptional()
	@IsIn(['ASC', 'DESC'])
	direction: 'ASC' | 'DESC' = 'ASC';
}
