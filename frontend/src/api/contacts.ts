import type { Contact } from '../types/contact';

const API_URL = 'http://localhost:3000';

interface FetchContactsResponse {
	contacts: Contact[];
	hasMore: boolean;
	total: number;
}

interface FetchContactsParams {
	page?: number;
	limit?: number;

	search?: string;
	searchField?: string;

	minScore?: number;
	maxScore?: number;

	sortField?: string;
	direction?: 'ASC' | 'DESC';
}

export async function fetchContacts(params: FetchContactsParams = {}): Promise<FetchContactsResponse> {
	const queryParams = new URLSearchParams();

	if (params.page !== undefined) {
		queryParams.append('page', String(params.page));
	}

	if (params.limit !== undefined) {
		queryParams.append('limit', String(params.limit));
	}

	if (params.search) {
		queryParams.append('search', params.search);
	}

	if (params.minScore !== undefined) {
		queryParams.append('minScore', String(params.minScore));
	}

	if (params.maxScore !== undefined) {
		queryParams.append('maxScore', String(params.maxScore));
	}

	if (params.sortField) {
		queryParams.append('sortField', params.sortField);
	}

	if (params.searchField) {
		queryParams.append('searchField', params.searchField);
	}

	if (params.direction) {
		queryParams.append('direction', params.direction);
	}

	const response = await fetch(`${API_URL}/contacts?${queryParams.toString()}`);

	if (!response.ok) {
		throw new Error('Failed to fetch contacts');
	}

	return response.json();
}
