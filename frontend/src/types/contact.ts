export interface Contact {
	id: string;
	name: string;
	enterprise: string | null;
	phone: string;
	date: string;
	score: number;
	customFields: Record<string, string | number | null>;
}
