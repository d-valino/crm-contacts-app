import type { ColumnDefinition, ColumnType } from '../types/column';

const API_URL = 'http://localhost:3000';

export async function fetchColumns(): Promise<ColumnDefinition[]> {
	const response = await fetch(`${API_URL}/columns`);
	if (!response.ok) {
		throw new Error('Failed to fetch columns');
	}
	return response.json();
}

export async function createColumn(data: { label: string; type: ColumnType }): Promise<ColumnDefinition> {
	const response = await fetch(`${API_URL}/columns`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Failed to create column');
	}
	return response.json();
}

export async function updateColumn(
	id: string,
	data: Partial<{ label: string; type: ColumnType }>,
): Promise<ColumnDefinition> {
	const response = await fetch(`${API_URL}/columns/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error('Failed to update column');
	}
	return response.json();
}

export async function deleteColumn(id: string): Promise<void> {
	const response = await fetch(`${API_URL}/columns/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		const body = await response.json().catch(() => null);
		throw new Error(body?.message || 'Failed to delete column');
	}
}

export async function reorderColumns(orderedIds: string[]): Promise<ColumnDefinition[]> {
	const response = await fetch(`${API_URL}/columns/reorder`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ orderedIds }),
	});
	if (!response.ok) {
		throw new Error('Failed to reorder columns');
	}
	return response.json();
}
