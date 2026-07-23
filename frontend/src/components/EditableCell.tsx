import { useEffect, useRef, useState } from 'react';
import type { ColumnType } from '../types/column';
import './EditableCell.css';

interface EditableCellProps {
	value: unknown;
	type: ColumnType;
	required?: boolean;
	displayValue: string;
	onSave: (rawValue: string) => Promise<void>;
}

function toInputValue(value: unknown, type: ColumnType): string {
	if (value === null || value === undefined) return '';

	if (type === 'date') {
		return String(value).slice(0, 10);
	}

	return String(value);
}

export default function EditableCell({
	value,
	type,
	required = false,
	displayValue,
	onSave,
}: EditableCellProps) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(toInputValue(value, type));
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (editing) {
			setDraft(toInputValue(value, type));
			setError(null);
			// focus after the input actually mounts
			requestAnimationFrame(() => inputRef.current?.focus());
		}
	}, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

	function startEditing(event: React.MouseEvent) {
		event.stopPropagation();
		setEditing(true);
	}

	async function commit() {
		if (required && draft.trim() === '') {
			setError('Required');
			return;
		}

		// no change — just exit without a network call
		if (draft === toInputValue(value, type)) {
			setEditing(false);
			return;
		}

		setSaving(true);
		setError(null);

		try {
			await onSave(draft);
			setEditing(false);
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setSaving(false);
		}
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === 'Enter') {
			event.preventDefault();
			commit();
		} else if (event.key === 'Escape') {
			setDraft(toInputValue(value, type));
			setError(null);
			setEditing(false);
		}
	}

	if (!editing) {
		return (
			<td className="editable-cell" onClick={startEditing}>
				{displayValue}
			</td>
		);
	}

	return (
		<td className="editable-cell editing" onClick={(e) => e.stopPropagation()}>
			<input
				ref={inputRef}
				type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
				min={type === 'number' ? 0 : undefined}
				max={type === 'number' ? 5 : undefined}
				value={draft}
				disabled={saving}
				onChange={(e) => setDraft(e.target.value)}
				onBlur={commit}
				onKeyDown={handleKeyDown}
			/>
			{error && <span className="editable-cell-error">{error}</span>}
		</td>
	);
}
