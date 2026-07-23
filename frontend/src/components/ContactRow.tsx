import type { Contact } from '../types/contact';
import type { ColumnDefinition } from '../types/column';
import EditableCell from './EditableCell';
import './ContactRow.css';

interface ContactRowProps {
	contact: Contact;
	columns: ColumnDefinition[];
	onCellSave: (contact: Contact, column: ColumnDefinition, rawValue: string) => Promise<void>;
	onEditClick: (contact: Contact) => void;
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

function formatDisplayValue(column: ColumnDefinition, value: unknown): string {
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

export default function ContactRow({ contact, columns, onCellSave, onEditClick }: ContactRowProps) {
	return (
		<tr className="contact-row">
			{columns.map((column) => {
				const value = getCellValue(contact, column);

				return (
					<EditableCell
						key={column.id}
						value={value}
						type={column.type}
						required={column.isMandatory}
						min={column.key === 'score' ? 0 : undefined}
						max={column.key === 'score' ? 5 : undefined}
						displayValue={formatDisplayValue(column, value)}
						onSave={(rawValue) => onCellSave(contact, column, rawValue)}
					/>
				);
			})}

			<td className="contact-row-actions">
				<button
					type="button"
					className="contact-row-edit-btn"
					onClick={(e) => {
						e.stopPropagation();
						onEditClick(contact);
					}}
				>
					Edit
				</button>
			</td>
		</tr>
	);
}
