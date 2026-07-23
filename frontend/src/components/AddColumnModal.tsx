import { useState } from 'react';
import type { ColumnType } from '../types/column';
import './AddColumnModal.css';

interface AddColumnModalProps {
	onSubmit: (data: { label: string; type: ColumnType }) => Promise<void>;
	onClose: () => void;
}

const TYPE_OPTIONS: { value: ColumnType; label: string }[] = [
	{ value: 'text', label: 'Text' },
	{ value: 'number', label: 'Number' },
	{ value: 'date', label: 'Date' },
	{ value: 'phone', label: 'Phone number' },
];

export default function AddColumnModal({ onSubmit, onClose }: AddColumnModalProps) {
	const [label, setLabel] = useState('');
	const [type, setType] = useState<ColumnType>('text');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setError(null);

		if (!label.trim()) {
			setError('Column name is required.');
			return;
		}

		setSubmitting(true);
		try {
			await onSubmit({ label: label.trim(), type });
			onClose();
		} catch (err) {
			setError((err as Error).message);
			setSubmitting(false);
		}
	}

	return (
		<div className="add-column-overlay" onClick={onClose}>
			<div className="add-column-modal" onClick={(e) => e.stopPropagation()}>
				<h2>Add column</h2>

				<form onSubmit={handleSubmit}>
					<label>
						Column name
						<input
							type="text"
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder="e.g. LinkedIn"
							autoFocus
							required
						/>
					</label>

					<label>
						Type
						<select value={type} onChange={(e) => setType(e.target.value as ColumnType)}>
							{TYPE_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>

					{error && <p className="add-column-error">{error}</p>}

					<div className="add-column-actions">
						<button type="button" onClick={onClose} disabled={submitting}>
							Cancel
						</button>
						<button type="submit" disabled={submitting}>
							{submitting ? 'Adding...' : 'Add column'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
