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

	queryParams.set('page', String(params.page));
	queryParams.set('limit', String(params.limit));
	queryParams.set('sortField', params.sortField ?? 'createdAt');
	queryParams.set('direction', params.direction ?? 'ASC');

	if (params.search) {
		queryParams.set('search', params.search);
		queryParams.set('searchField', params.searchField ?? '');
	};
	if (params.minScore !== undefined) queryParams.set('minScore', String(params.minScore));
	if (params.maxScore !== undefined) queryParams.set('maxScore', String(params.maxScore));

	const response = await fetch(`${API_URL}/contacts?${queryParams.toString()}`);

	if (!response.ok) {
		throw new Error('Failed to fetch contacts');
	}

	return response.json();
}
