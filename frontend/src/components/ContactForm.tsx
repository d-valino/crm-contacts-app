import { useState } from 'react';
import type { Contact, ContactFormPayload } from '../types/contact';
import type { ColumnDefinition, ColumnType } from '../types/column';
import './ContactForm.css';

interface ContactFormProps {
	mode: 'create' | 'edit';
	columns: ColumnDefinition[];
	initialContact?: Contact;
	onSubmit: (data: ContactFormPayload) => Promise<void>;
	onDelete?: () => Promise<void>;
	onClose: () => void;
}

function normalizeFrenchLocalNumber(raw: string): string {
	const digits = raw.replace(/\D/g, '');
	return digits.startsWith('0') ? digits.slice(1) : digits;
}

function isValidFrenchLocalNumber(local: string): boolean {
	return /^[1-9]\d{8}$/.test(local);
}

function getInitialValue(column: ColumnDefinition, initialContact?: Contact): string {
	const raw = column.isCore
		? (initialContact as unknown as Record<string, unknown> | undefined)?.[column.key]
		: initialContact?.customFields?.[column.key];

	if (raw === null || raw === undefined) return '';

	if (column.type === 'phone') return String(raw).replace(/^\+33/, '');
	if (column.type === 'date') return String(raw).slice(0, 10);
	return String(raw);
}

function buildInitialValues(columns: ColumnDefinition[], initialContact?: Contact): Record<string, string> {
	const values: Record<string, string> = {};
	for (const column of columns) {
		values[column.key] = getInitialValue(column, initialContact);
	}
	return values;
}

function formatValue(raw: string, type: ColumnType): string | number {
	if (type === 'phone') return `+33${raw}`;
	if (type === 'number') return Number(raw);
	return raw;
}

export default function ContactForm({
	mode,
	columns,
	initialContact,
	onSubmit,
	onDelete,
	onClose,
}: ContactFormProps) {
	const [values, setValues] = useState<Record<string, string>>(() => buildInitialValues(columns, initialContact));
	const [submitting, setSubmitting] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function setValue(key: string, value: string) {
		setValues((prev) => ({ ...prev, [key]: value }));
	}

	function validate(): string | null {
		for (const column of columns) {
			const raw = (values[column.key] ?? '').trim();

			if (column.isMandatory && raw === '') {
				return `${column.label} is required.`;
			}

			if (column.type === 'phone' && raw !== '' && !isValidFrenchLocalNumber(raw)) {
				return `${column.label} must be a valid French phone number (e.g. 6 12 34 56 78).`;
			}
		}
		return null;
	}

	function buildPayload(): ContactFormPayload {
		const payload: ContactFormPayload = {};
		const customFields: Record<string, string | number | null> = {};

		for (const column of columns) {
			const raw = (values[column.key] ?? '').trim();

			if (column.isCore) {
				// blank + optional → omit the key so the server default / existing value is kept
				if (raw === '') continue;
				payload[column.key] = formatValue(raw, column.type);
			} else {
				customFields[column.key] = raw === '' ? null : formatValue(raw, column.type);
			}
		}

		payload.customFields = customFields;
		return payload;
	}

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setError(null);

		const validationError = validate();
		if (validationError) {
			setError(validationError);
			return;
		}

		setSubmitting(true);
		try {
			await onSubmit(buildPayload());
			onClose();
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setSubmitting(false);
		}
	}

	async function handleDelete() {
		if (!onDelete) return;
		setError(null);
		setDeleting(true);
		try {
			await onDelete();
			onClose();
		} catch (err) {
			setError((err as Error).message);
			setDeleting(false);
		}
	}

	return (
		<div className="contact-form-overlay" onClick={onClose}>
			<div className="contact-form-modal" onClick={(e) => e.stopPropagation()}>
				<h2>{mode === 'create' ? 'Add contact' : 'Edit contact'}</h2>

				<form onSubmit={handleSubmit}>
					{columns.map((column) => (
						<label key={column.id}>
							{column.label}

							{column.type === 'phone' ? (
								<div className="phone-input">
									<span className="phone-prefix">+33</span>
									<input
										type="tel"
										value={values[column.key] ?? ''}
										onChange={(e) => setValue(column.key, normalizeFrenchLocalNumber(e.target.value))}
										placeholder="6 12 34 56 78"
										maxLength={9}
										required={column.isMandatory}
									/>
								</div>
							) : column.type === 'date' ? (
								<input
									type="date"
									value={values[column.key] ?? ''}
									onChange={(e) => setValue(column.key, e.target.value)}
									required={column.isMandatory}
								/>
							) : column.type === 'number' ? (
								<input
									type="number"
									min={column.key === 'score' ? 0 : undefined}
									max={column.key === 'score' ? 5 : undefined}
									value={values[column.key] ?? ''}
									onChange={(e) => setValue(column.key, e.target.value)}
									required={column.isMandatory}
								/>
							) : (
								<input
									type="text"
									value={values[column.key] ?? ''}
									onChange={(e) => setValue(column.key, e.target.value)}
									required={column.isMandatory}
								/>
							)}
						</label>
					))}

					{error && <p className="contact-form-error">{error}</p>}

					<div className="contact-form-actions">
						{mode === 'edit' && onDelete && (
							<button
								type="button"
								className="contact-form-delete-btn"
								onClick={handleDelete}
								disabled={deleting || submitting}
							>
								{deleting ? 'Deleting...' : 'Delete'}
							</button>
						)}

						<div className="contact-form-actions-right">
							<button type="button" onClick={onClose} disabled={submitting || deleting}>
								Cancel
							</button>
							<button type="submit" disabled={submitting || deleting}>
								{submitting ? 'Saving...' : 'Save'}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
