import type { Contact } from '../types/contact';
import type { ColumnDefinition } from '../types/column';
import './ContactRow.css';

interface ContactRowProps {
	contact: Contact;
	columns: ColumnDefinition[];
	onClick: (contact: Contact) => void;
}

function getCellValue(contact: Contact, column: ColumnDefinition): unknown {
	if (column.isCore) {
		return (contact as unknown as Record<string, unknown>)[column.key];
	}
	return contact.customFields?.[column.key];
}

function formatFrenchPhone(phone: string): string {
	const local = phone.replace('+33', '0');
	return local.replace(/(\d)(?=(\d{2})+(?!\d))/g, '$1 ');
}

function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString();
}

function renderCell(column: ColumnDefinition, value: unknown): string {
	if (value === null || value === undefined || value === '') {
		return '—';
	}

	switch (column.type) {
		case 'date':
			return formatDate(value as string);
		case 'phone':
			return formatFrenchPhone(value as string);
		default:
			return String(value);
	}
}

export default function ContactRow({ contact, columns, onClick }: ContactRowProps) {
	return (
		<tr className="contact-row" onClick={() => onClick(contact)}>
			{columns.map((column) => (
				<td key={column.id}>{renderCell(column, getCellValue(contact, column))}</td>
			))}
		</tr>
	);
}
