import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import type { ColumnDefinition, ColumnType } from '../types/column';
import './ColumnHeaderMenu.css';

interface ScoreRange {
	min?: number;
	max?: number;
}

interface ColumnHeaderMenuProps {
	columnDef: ColumnDefinition;
	sortField: string;
	direction: 'ASC' | 'DESC';
	setSorting: (column: string, dir?: 'ASC' | 'DESC') => void;
	scoreRange?: ScoreRange;
	setScoreRange?: (range: ScoreRange) => void;
	onRename: (id: string, label: string) => Promise<void>;
	onChangeType: (id: string, type: ColumnType) => Promise<void>;
	onDelete: (id: string) => Promise<void>;
}

const TYPE_OPTIONS: { value: ColumnType; label: string }[] = [
	{ value: 'text', label: 'Text' },
	{ value: 'number', label: 'Number' },
	{ value: 'date', label: 'Date' },
	{ value: 'phone', label: 'Phone number' },
];

function clampScore(value: string): string {
	if (value === '') return '';

	const num = Number(value);
	if (Number.isNaN(num)) return '';

	const clamped = Math.min(5, Math.max(0, num));
	return String(clamped);
}

export default function ColumnHeaderMenu({
	columnDef,
	sortField,
	direction,
	setSorting,
	scoreRange,
	setScoreRange,
	onRename,
	onChangeType,
	onDelete,
}: ColumnHeaderMenuProps) {
	const column = columnDef.key;
	const label = columnDef.label;
	const sortable = columnDef.isCore;

	const [open, setOpen] = useState(false);
	const [position, setPosition] = useState({ top: 0, left: 0 });

	const [minDraft, setMinDraft] = useState(scoreRange?.min?.toString() ?? '');
	const [maxDraft, setMaxDraft] = useState(scoreRange?.max?.toString() ?? '');

	const [renaming, setRenaming] = useState(false);
	const [renameDraft, setRenameDraft] = useState(label);
	const [manageBusy, setManageBusy] = useState(false);
	const [manageError, setManageError] = useState<string | null>(null);
	const [confirmingDelete, setConfirmingDelete] = useState(false);

	const buttonRef = useRef<HTMLButtonElement | null>(null);
	const dropdownRef = useRef<HTMLDivElement | null>(null);

	useOnClickOutside(dropdownRef, () => setOpen(false));

	const isActiveSort = sortField === column;
	const isScoreColumn = column === 'score' && setScoreRange;

	useEffect(() => {
		if (open) {
			setMinDraft(scoreRange?.min?.toString() ?? '');
			setMaxDraft(scoreRange?.max?.toString() ?? '');
			setRenaming(false);
			setRenameDraft(label);
			setManageError(null);
			setConfirmingDelete(false);
		}
	}, [open, scoreRange?.min, scoreRange?.max, label]);

	useEffect(() => {
		if (!open) return;

		function handleScroll() {
			setOpen(false);
		}

		const scrollContainer = document.querySelector('.contacts-scroll-container');
		scrollContainer?.addEventListener('scroll', handleScroll);

		return () => scrollContainer?.removeEventListener('scroll', handleScroll);
	}, [open]);

	function handleSort(dir: 'ASC' | 'DESC') {
		setSorting(column, dir);
		setOpen(false);
	}

	function handleApplyRange() {
		setScoreRange?.({
			min: minDraft === '' ? undefined : Number(minDraft),
			max: maxDraft === '' ? undefined : Number(maxDraft),
		});
		setOpen(false);
	}

	function handleToggle() {
		if (!open && buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			setPosition({ top: rect.bottom + 6, left: rect.left });
		}
		setOpen((prev) => !prev);
	}

	async function handleSaveRename() {
		const trimmed = renameDraft.trim();
		if (!trimmed) {
			setManageError('Column name is required.');
			return;
		}
		if (trimmed === label) {
			setRenaming(false);
			return;
		}

		setManageBusy(true);
		setManageError(null);
		try {
			await onRename(columnDef.id, trimmed);
			setRenaming(false);
		} catch (err) {
			setManageError((err as Error).message);
		} finally {
			setManageBusy(false);
		}
	}

	async function handleChangeType(nextType: ColumnType) {
		setManageBusy(true);
		setManageError(null);
		try {
			await onChangeType(columnDef.id, nextType);
		} catch (err) {
			setManageError((err as Error).message);
		} finally {
			setManageBusy(false);
		}
	}

	async function handleDelete() {
		if (!confirmingDelete) {
			setConfirmingDelete(true);
			return;
		}

		setManageBusy(true);
		setManageError(null);
		try {
			await onDelete(columnDef.id);
			setOpen(false);
		} catch (err) {
			setManageError((err as Error).message);
			setConfirmingDelete(false);
		} finally {
			setManageBusy(false);
		}
	}

	return (
		<div className="column-header-menu">
			<button
				ref={buttonRef}
				type="button"
				className="column-header-btn"
				onClick={handleToggle}
			>
				{label}
				{isActiveSort && (direction === 'ASC' ? ' ↑' : ' ↓')}
			</button>

			{open &&
				createPortal(
					<div ref={dropdownRef} className="column-header-dropdown" style={{ top: position.top, left: position.left }}>
						{sortable && (
							<>
								<button
									type="button"
									className={isActiveSort && direction === 'ASC' ? 'column-header-option active' : 'column-header-option'}
									onClick={() => handleSort('ASC')}
								>
									Sort ascending
								</button>
								<button
									type="button"
									className={isActiveSort && direction === 'DESC' ? 'column-header-option active' : 'column-header-option'}
									onClick={() => handleSort('DESC')}
								>
									Sort descending
								</button>
							</>
						)}

						{isScoreColumn && (
							<>
								{sortable && <div className="column-header-divider" />}
								<div className="column-header-range">
									<label>
										Min
										<input
											type="number"
											min={0}
											max={5}
											value={minDraft}
											onChange={(e) => setMinDraft(clampScore(e.target.value))}
										/>
									</label>
									<label>
										Max
										<input
											type="number"
											min={0}
											max={5}
											value={maxDraft}
											onChange={(e) => setMaxDraft(clampScore(e.target.value))}
										/>
									</label>
								</div>
								<button type="button" className="column-header-apply-btn" onClick={handleApplyRange}>
									Apply
								</button>
							</>
						)}

						<div className="column-header-divider" />

						{!renaming && (
							<button
								type="button"
								className="column-header-option"
								onClick={() => setRenaming(true)}
							>
								Rename column
							</button>
						)}

						{renaming && (
							<div className="column-header-rename">
								<input
									type="text"
									value={renameDraft}
									autoFocus
									disabled={manageBusy}
									onChange={(e) => setRenameDraft(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											handleSaveRename();
										} else if (e.key === 'Escape') {
											setRenaming(false);
											setRenameDraft(label);
										}
									}}
								/>
								<div className="column-header-rename-actions">
									<button type="button" onClick={() => setRenaming(false)} disabled={manageBusy}>
										Cancel
									</button>
									<button type="button" onClick={handleSaveRename} disabled={manageBusy}>
										Save
									</button>
								</div>
							</div>
						)}

						{!columnDef.isCore && (
							<label className="column-header-type-select">
								Type
								<select
									value={columnDef.type}
									disabled={manageBusy}
									onChange={(e) => handleChangeType(e.target.value as ColumnType)}
								>
									{TYPE_OPTIONS.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</label>
						)}

						{!columnDef.isMandatory && (
							<button
								type="button"
								className="column-header-option column-header-delete"
								onClick={handleDelete}
								disabled={manageBusy}
							>
								{confirmingDelete ? 'Click again to confirm' : 'Delete column'}
							</button>
						)}

						{manageError && <p className="column-header-manage-error">{manageError}</p>}
					</div>,
					document.body,
				)}
		</div>
	);
}
