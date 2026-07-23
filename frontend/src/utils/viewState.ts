export interface PersistedViewState {
	sortField: string;
	direction: 'ASC' | 'DESC';
	search: string;
	scoreRange: { min?: number; max?: number };
}

const STORAGE_KEY = 'crm-contacts-view-state';

export function loadViewState(): Partial<PersistedViewState> {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		// corrupted value, private browsing, storage disabled, etc. — fall back to defaults
		return {};
	}
}

export function saveViewState(state: PersistedViewState): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// storage full / unavailable — not worth surfacing to the user, just skip persisting
	}
}
