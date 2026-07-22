export interface Contact {
	id: string;
	name: string;
	enterprise: string | null;
	phone: string;
	date: string; // ISO date string as returned by the API
	score: number;
}
