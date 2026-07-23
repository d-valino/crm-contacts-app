export interface Contact {
	id: string;
	name: string;
	enterprise: string | null;
	phone: string;
	date: string;
	score: number;
	customFields: Record<string, string | number | null>;
}

export interface ContactFormPayload {
	[key: string]: string | number | null | Record<string, string | number | null> | undefined;
	customFields?: Record<string, string | number | null>;
}
