import type { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ColumnDefinition, ColumnType } from '../types/column';
import ColumnHeaderMenu from './ColumnHeaderMenu';
import './SortableColumnHeader.css';

interface SortableColumnHeaderProps {
	columnDef: ColumnDefinition;
	sortField: string;
	direction: 'ASC' | 'DESC';
	setSorting: (column: string, dir?: 'ASC' | 'DESC') => void;
	scoreRange?: { min?: number; max?: number };
	setScoreRange?: (range: { min?: number; max?: number }) => void;
	onRename: (id: string, label: string) => Promise<void>;
	onChangeType: (id: string, type: ColumnType) => Promise<void>;
	onDelete: (id: string) => Promise<void>;
}

export default function SortableColumnHeader({ columnDef, ...menuProps }: SortableColumnHeaderProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: columnDef.id,
	});

	const style: CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<th ref={setNodeRef} style={style} className="sortable-column-header">
			<div className="column-header-cell">
				<button
					type="button"
					className="column-drag-handle"
					aria-label={`Reorder ${columnDef.label} column`}
					{...attributes}
					{...listeners}
				>
					⠿
				</button>
				<ColumnHeaderMenu columnDef={columnDef} {...menuProps} />
			</div>
		</th>
	);
}
