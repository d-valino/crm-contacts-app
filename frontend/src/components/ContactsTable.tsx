import { useEffect, useRef, useState } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import type { Contact } from '../types/contact';
import type { ColumnDefinition, ColumnType } from '../types/column';
import ContactRow from './ContactRow';
import SortableColumnHeader from './SortableColumnHeader';
import SearchBar from './SearchBar';
import AddColumnModal from './AddColumnModal';
import './ContactsTable.css';

interface ContactsTableProps {
	contacts: Contact[];
	columns: ColumnDefinition[];
	loadMore: () => void;
	hasMore: boolean;
	loadingMore: boolean;
	sortField: string;
	direction: 'ASC' | 'DESC';
	setSorting: (column: string, dir?: 'ASC' | 'DESC') => void;
	search: string;
	setSearch: (value: string) => void;
	searchField: string;
	setSearchField: (field: string) => void;
	scoreRange: { min?: number; max?: number };
	setScoreRange: (range: { min?: number; max?: number }) => void;
	onRowClick: (contact: Contact) => void;
	onCellSave: (contact: Contact, column: ColumnDefinition, rawValue: string) => void;
	onAddColumn: (data: { label: string; type: ColumnType }) => Promise<void>;
	onRenameColumn: (id: string, label: string) => Promise<void>;
	onChangeColumnType: (id: string, type: ColumnType) => Promise<void>;
	onDeleteColumn: (id: string) => Promise<void>;
	onReorderColumns: (columns: ColumnDefinition[]) => Promise<void>;
}

export default function ContactsTable({
		contacts,
		columns,
		loadMore,
		hasMore,
		loadingMore,
		sortField,
		direction,
		setSorting,
		search,
		setSearch,
		searchField,
		setSearchField,
		scoreRange,
		setScoreRange,
		onRowClick,
		onCellSave,
		onAddColumn,
		onRenameColumn,
		onChangeColumnType,
		onDeleteColumn,
		onReorderColumns
	}: ContactsTableProps) {
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const sentinelRef = useRef<HTMLTableRowElement | null>(null);
	const [addColumnOpen, setAddColumnOpen] = useState(false);

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

	async function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = columns.findIndex((c) => c.id === active.id);
		const newIndex = columns.findIndex((c) => c.id === over.id);
		if (oldIndex === -1 || newIndex === -1) return;

		try {
			await onReorderColumns(arrayMove(columns, oldIndex, newIndex));
		} catch {
			// useColumns already reverted the optimistic order on failure
		}
	}

	useEffect(() => {
		if (!hasMore || loadingMore) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					loadMore();
				}
			},
			{ root: scrollContainerRef.current, threshold: 0.1 },
		);

		const sentinel = sentinelRef.current;
		if (sentinel) observer.observe(sentinel);

		return () => {
			if (sentinel) observer.unobserve(sentinel);
			observer.disconnect();
		};
	}, [hasMore, loadingMore, loadMore]);

	return (
		<div className="contacts-container">
			<div className="contacts-toolbar">
				<SearchBar
					search={search}
					setSearch={setSearch}
					searchField={searchField}
					setSearchField={setSearchField}
				/>
				<button type="button" className="add-column-btn" onClick={() => setAddColumnOpen(true)}>
					+ Add column
				</button>
			</div>

			{addColumnOpen && (
				<AddColumnModal onSubmit={onAddColumn} onClose={() => setAddColumnOpen(false)} />
			)}

			<div ref={scrollContainerRef} className="contacts-scroll-container">
				<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
					<table className="contacts-table">
						<thead>
							<tr>
								<SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
									{columns.map((column) => (
										<SortableColumnHeader
											key={column.id}
											columnDef={column}
											sortField={sortField}
											direction={direction}
											setSorting={setSorting}
											scoreRange={column.key === 'score' ? scoreRange : undefined}
											setScoreRange={column.key === 'score' ? setScoreRange : undefined}
											onRename={onRenameColumn}
											onChangeType={onChangeColumnType}
											onDelete={onDeleteColumn}
										/>
									))}
								</SortableContext>
								<th>Actions</th>
							</tr>
						</thead>

						<tbody>
						{contacts.map((contact) => (
							<ContactRow
							key={contact.id}
							contact={contact}
							columns={columns}
							onCellSave={onCellSave}
							onEditClick={onRowClick}
							/>
						))}

						{contacts.length === 0 && (
							<tr>
							<td colSpan={columns.length + 1}>No contacts found.</td>
							</tr>
						)}

						{hasMore && (
							<tr ref={sentinelRef} aria-hidden="true">
							<td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '1rem' }}>
								{loadingMore ? 'Loading more contacts...' : ''}
							</td>
							</tr>
						)}
						</tbody>
					</table>
				</DndContext>
			</div>
		</div>
	);
}
