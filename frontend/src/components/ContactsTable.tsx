import { useEffect, useRef } from 'react';
import type { Contact } from '../types/contact';
import ContactRow from './ContactRow';
import './ContactsTable.css';

interface ContactsTableProps {
	contacts: Contact[];
	loadMore: () => void;

	hasMore: boolean;
	loadingMore: boolean;

	sortBy: string;
	order: 'ASC' | 'DESC';
	setSorting: (column: string) => void;

	search: string;
	setSearch: (value: string) => void;
}

export default function ContactsTable({
	contacts,
	loadMore,
	hasMore,
	loadingMore,
	sortBy,
	order,
	setSorting,
	search,
	setSearch,
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


	function renderSortIndicator(column: string) {
		if (sortBy !== column) return null;

		return order === 'ASC'
			? ' ↑'
			: ' ↓';
	}


	return (
		<div className="contacts-container">

			<div className="contacts-toolbar">
				<input
					type="text"
					placeholder="Search contacts..."
					value={search}
					onChange={(event) =>
						setSearch(event.target.value)
					}
				/>
			</div>


			<div
				ref={scrollContainerRef}
				className="contacts-scroll-container"
			>
				<table className="contacts-table">

					<thead>
						<tr>
							<th
								onClick={() => setSorting('name')}
							>
								Name
								{renderSortIndicator('name')}
							</th>

							<th
								onClick={() => setSorting('enterprise')}
							>
								Enterprise
								{renderSortIndicator('enterprise')}
							</th>

							<th>
								Phone
							</th>

							<th
								onClick={() => setSorting('date')}
							>
								Date
								{renderSortIndicator('date')}
							</th>

							<th
								onClick={() => setSorting('score')}
							>
								Score
								{renderSortIndicator('score')}
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
