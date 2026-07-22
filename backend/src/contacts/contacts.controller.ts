import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	HttpCode,
	HttpStatus,
	Query
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { FindContactsDto } from './dto/find-contacts.dto';


@Controller('contacts')
export class ContactsController {
	constructor(private readonly contactsService: ContactsService) {}

	@Post()
	create(@Body() createContactDto: CreateContactDto) {
		return this.contactsService.create(createContactDto);
	}

	@Get()
	findAll(@Query() filters: FindContactsDto) {
		return this.contactsService.findAll(filters);
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto) {
		return this.contactsService.update(id, updateContactDto);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(@Param('id') id: string) {
		return this.contactsService.remove(id);
	}
}
