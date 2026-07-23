import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import './ColumnHeaderMenu.css';

interface ScoreRange {
	min?: number;
	max?: number;
}

interface ColumnHeaderMenuProps {
	column: string;
	label: string;
	sortable?: boolean;
	sortField: string;
	direction: 'ASC' | 'DESC';
	setSorting: (column: string, dir?: 'ASC' | 'DESC') => void;
	scoreRange?: ScoreRange;
	setScoreRange?: (range: ScoreRange) => void;
}

function clampScore(value: string): string {
	if (value === '') return '';

	const num = Number(value);
	if (Number.isNaN(num)) return '';

	const clamped = Math.min(5, Math.max(0, num));
	return String(clamped);
}

export default function ColumnHeaderMenu({
	column,
	label,
	sortable = true,
	sortField,
	direction,
	setSorting,
	scoreRange,
	setScoreRange,
}: ColumnHeaderMenuProps) {
	const [open, setOpen] = useState(false);
	const [position, setPosition] = useState({ top: 0, left: 0 });

	const [minDraft, setMinDraft] = useState(scoreRange?.min?.toString() ?? '');
	const [maxDraft, setMaxDraft] = useState(scoreRange?.max?.toString() ?? '');

	const buttonRef = useRef<HTMLButtonElement | null>(null);
	const dropdownRef = useRef<HTMLDivElement | null>(null);

	useOnClickOutside(dropdownRef, () => setOpen(false));

	const isActiveSort = sortField === column;
	const isScoreColumn = column === 'score' && setScoreRange;

	useEffect(() => {
		if (open) {
			setMinDraft(scoreRange?.min?.toString() ?? '');
			setMaxDraft(scoreRange?.max?.toString() ?? '');
		}
	}, [open, scoreRange?.min, scoreRange?.max]);

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

	const hasAnyOptions = sortable || isScoreColumn;

	return (
		<div className="column-header-menu">
			<button
				ref={buttonRef}
				type="button"
				className="column-header-btn"
				onClick={hasAnyOptions ? handleToggle : undefined}
				style={{ cursor: hasAnyOptions ? 'pointer' : 'default' }}
			>
				{label}
				{isActiveSort && (direction === 'ASC' ? ' ↑' : ' ↓')}
			</button>

			{open &&
				hasAnyOptions &&
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
								{/* ...unchanged score range UI */}
							</>
						)}
					</div>,
					document.body,
				)}
		</div>
	);
}
