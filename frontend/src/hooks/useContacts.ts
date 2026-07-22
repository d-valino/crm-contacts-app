import { useCallback, useEffect, useState } from 'react';
import { fetchContacts } from '../api/contacts';
import type { Contact } from '../types/contact';

const PAGE_SIZE = 30;

interface UseContactsResult {
	contacts: Contact[];
	loading: boolean;
	loadingMore: boolean;
	error: string | null;
	hasMore: boolean;

	sortField: string;
	direction: 'ASC' | 'DESC';
	search: string;
	searchField: string;

	setSorting: (column: string) => void;
	setSearch: (value: string) => void;
	setSearchField: (value: string) => void;

	loadMore: () => void;
}

export function useContacts(): UseContactsResult {
	const [contacts, setContacts] = useState<Contact[]>([]);

	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);

	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);

	const [error, setError] = useState<string | null>(null);

	const [sortField, setSortField] = useState('createdAt');
	const [direction, setOrder] = useState<'ASC' | 'DESC'>('ASC');

	const [search, setSearch] = useState('');
	const [searchField, setSearchField] = useState('name');

	const [scoreRange, setScoreRange] = useState({
		min: undefined,
		max: undefined,
	});

	async function loadContacts(pageNumber: number, replace = false) {
		try {
			const res = await fetchContacts({
				page: pageNumber,
				limit: PAGE_SIZE,
				sortField,
				direction,
				search,
				searchField
			});

			setContacts((previous) =>
				replace
					? res.contacts
					: [...previous, ...res.contacts],
			);

			setHasMore(res.hasMore);
			setPage(pageNumber);

		} catch (err) {
			setError((err as Error).message);
		}
	}

	useEffect(() => {
		setLoading(true);

		loadContacts(0, true)
			.finally(() => setLoading(false));

	}, [sortField, direction, search, searchField]);


	const loadMore = useCallback(() => {
		if (loadingMore || !hasMore) return;

		setLoadingMore(true);

		loadContacts(page + 1)
			.finally(() => {
				setLoadingMore(false);
			});

	}, [
		page,
		hasMore,
		loadingMore,
		sortField,
		direction,
		search,
		searchField
	]);

	function setSorting(column: string) {

		if (column === sortField) {
			setOrder(
				direction === 'ASC'
					? 'DESC'
					: 'ASC'
			);
		} else {
			setSortField(column);
			setOrder('ASC');
		}
	}

	return {
		contacts,
		loading,
		loadingMore,
		error,
		hasMore,

		sortField,
		direction,
		search,
		searchField,

		setSorting,
		setSearch,
		setSearchField,

		loadMore,
	};
}
