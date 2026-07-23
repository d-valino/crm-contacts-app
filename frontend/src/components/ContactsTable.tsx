import { useEffect, useRef } from 'react';
import type { Contact } from '../types/contact';
import ContactRow from './ContactRow';
import SearchBar from './SearchBar';
import './ContactsTable.css';
import ColumnHeaderMenu from './ColumnHeaderMenu';

interface ContactsTableProps {
	contacts: Contact[];
	loadMore: () => void;

	hasMore: boolean;
	loadingMore: boolean;

	sortField: string;
	direction: 'ASC' | 'DESC';
	setSorting: (column: string) => void;

	search: string;
	setSearch: (value: string) => void;

	searchField: string;
	setSearchField: (field: string) => void;

	scoreRange: { min?: number; max?: number };
	setScoreRange: ( min?: number, max?: number ) => void;
}

export default function ContactsTable({
		contacts,
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
		setScoreRange
	}: ContactsTableProps) {
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const sentinelRef = useRef<HTMLTableRowElement | null>(null);

	useEffect(() => {
		if (!hasMore || loadingMore) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					loadMore();
				}
			},
			{
				root: scrollContainerRef.current,
				threshold: 0.1,
			},
		);


		const sentinel = sentinelRef.current;

		if (sentinel) {
			observer.observe(sentinel);
		}


		return () => {
			if (sentinel) {
				observer.unobserve(sentinel);
			}

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
			</div>

			<div
				ref={scrollContainerRef}
				className="contacts-scroll-container"
			>
				<table className="contacts-table">

					<thead>
						<tr>
							<th>
							<ColumnHeaderMenu
								column="name"
								label="Name"
								sortField={sortField}
								direction={direction}
								setSorting={setSorting}
							/>
							</th>

							<th>
							<ColumnHeaderMenu
								column="enterprise"
								label="Enterprise"
								sortField={sortField}
								direction={direction}
								setSorting={setSorting}
							/>
							</th>

							<th>Phone</th>

							<th>
							<ColumnHeaderMenu
								column="date"
								label="Date"
								sortField={sortField}
								direction={direction}
								setSorting={setSorting}
							/>
							</th>

							<th>
							<ColumnHeaderMenu
								column="score"
								label="Score"
								sortField={sortField}
								direction={direction}
								setSorting={setSorting}
								scoreRange={scoreRange}
								setScoreRange={setScoreRange}
							/>
							</th>
						</tr>
					</thead>


					<tbody>

						{contacts.map((contact) => (
							<ContactRow
								key={contact.id}
								contact={contact}
							/>
						))}


						{contacts.length === 0 && (
							<tr>
								<td colSpan={5}>
									No contacts found.
								</td>
							</tr>
						)}


						{hasMore && (
							<tr
								ref={sentinelRef}
								aria-hidden="true"
							>
								<td
									colSpan={5}
									style={{
										textAlign: 'center',
										padding: '1rem',
									}}
								>
									{
										loadingMore
											? 'Loading more contacts...'
											: ''
									}
								</td>
							</tr>
						)}

					</tbody>

				</table>
			</div>

		</div>
	);
}
