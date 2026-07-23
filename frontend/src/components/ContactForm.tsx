import { useState } from 'react';
import type { Contact } from '../types/contact';
import './ContactForm.css';

interface ContactFormProps {
	mode: 'create' | 'edit';
	initialContact?: Contact;
	onSubmit: (data: {
		name: string;
		phone: string;
		enterprise?: string;
		date?: string;
		score?: number;
	}) => Promise<void>;
	onDelete?: () => Promise<void>;
	onClose: () => void;
}

export default function ContactForm({
	mode,
	initialContact,
	onSubmit,
	onDelete,
	onClose,
}: ContactFormProps) {
	const [name, setName] = useState(initialContact?.name ?? '');
	const [phone, setPhone] = useState(initialContact?.phone ?? '');
	const [enterprise, setEnterprise] = useState(initialContact?.enterprise ?? '');
	const [score, setScore] = useState(initialContact?.score?.toString() ?? '0');
	const [date, setDate] = useState( initialContact?.date ? initialContact.date.slice(0, 10) : '' );
	const [submitting, setSubmitting] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setError(null);

		if (!name.trim() || !phone.trim()) {
			setError('Name and phone are required.');
			return;
		}

		setSubmitting(true);
		try {
			await onSubmit({
				name: name.trim(),
				phone: phone.trim(),
				enterprise: enterprise.trim() || undefined,
				date: date || undefined,
				score: score === '' ? undefined : Number(score),
			});
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
					<label>
						Name
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</label>

					<label>
						Phone
						<input
							type="text"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							required
						/>
					</label>

					<label>
						Enterprise
						<input
							type="text"
							value={enterprise}
							onChange={(e) => setEnterprise(e.target.value)}
						/>
					</label>

					<label>
						Date
						<input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
						/>
					</label>

					<label>
						Score
						<input
							type="number"
							min={0}
							max={5}
							value={score}
							onChange={(e) => setScore(e.target.value)}
						/>
					</label>

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
