import { useCallback, useEffect, useState } from 'react';
import { createContact, deleteContact, fetchContacts, updateContact } from '../api/contacts';
import type { Contact, ContactFormPayload } from '../types/contact';
import type { ColumnDefinition } from '../types/column';

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
	scoreRange: { min?: number; max?: number };

	setSorting: (column: string) => void;
	setSearch: (value: string) => void;
	setScoreRange: ( min?: number, max?: number ) => void;

	loadMore: () => void;
	addContact: (data: ContactFormPayload) => void;
	editContact: (id: string, data: ContactFormPayload) => void;
	removeContact: (id: string) => void;
	updateCell : (contact: Contact, column: ColumnDefinition, rawValue: string) => void;
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

	const [scoreRange, setScoreRange] = useState<{ min?: number; max?: number }>({
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
				minScore: scoreRange.min,
				maxScore: scoreRange.max
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
		loadContacts(0, true).finally(() => setLoading(false));
	}, [sortField, direction, search, scoreRange]);


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
		scoreRange
	]);

	function setSorting(column: string, dir?: 'ASC' | 'DESC') {
		if (dir) {
			setSortField(column);
			setOrder(dir);
			return;
		}

		if (column === sortField) {
			setOrder(direction === 'ASC' ? 'DESC' : 'ASC');
		} else {
			setSortField(column);
			setOrder('ASC');
		}
	}

	async function addContact(data: ContactFormPayload) {
		const newContact = await createContact(data);
		setContacts((prev) => [newContact, ...prev]);
	}

	async function editContact(id: string, data: ContactFormPayload) {
		const updated = await updateContact(id, data);
		setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
	}

	async function removeContact(id: string) {
		await deleteContact(id);
		setContacts((prev) => prev.filter((c) => c.id !== id));
	}

	async function updateCell(contact: Contact, column: ColumnDefinition, rawValue: string) {
		const parsedValue: string | number | null =
			rawValue === '' ? null : column.type === 'number' ? Number(rawValue) : rawValue;

		if (column.isCore) {
			const updated = await updateContact(contact.id, { [column.key]: parsedValue });
			setContacts((prev) => prev.map((c) => (c.id === contact.id ? updated : c)));
			return;
		}

		const nextCustomFields = { ...contact.customFields, [column.key]: parsedValue };
		const updated = await updateContact(contact.id, { customFields: nextCustomFields });
		setContacts((prev) => prev.map((c) => (c.id === contact.id ? updated : c)));
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
		scoreRange,

		setSorting,
		setSearch,
		setScoreRange,

		loadMore,

		addContact,
		editContact,
		removeContact,
		updateCell
	};
}
