import { useCallback, useEffect, useState } from 'react';
import type { ColumnDefinition, ColumnType } from '../types/column';
import { createColumn, deleteColumn, fetchColumns, reorderColumns as reorderColumnsRequest, updateColumn } from '../api/columns';

export function useColumns() {
	const [columns, setColumns] = useState<ColumnDefinition[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const reload = useCallback(async () => {
		try {
			const data = await fetchColumns();
			setColumns(data);
		} catch (err) {
			setError((err as Error).message);
		}
	}, []);

	useEffect(() => {
		setLoading(true);
		reload().finally(() => setLoading(false));
	}, [reload]);

	async function addColumn(data: { label: string; type: ColumnType }) {
		const created = await createColumn(data);
		setColumns((prev) => [...prev, created]);
	}

	async function renameColumn(id: string, label: string) {
		const updated = await updateColumn(id, { label });
		setColumns((prev) => prev.map((c) => (c.id === id ? updated : c)));
	}

	async function changeColumnType(id: string, type: ColumnType) {
		const updated = await updateColumn(id, { type });
		setColumns((prev) => prev.map((c) => (c.id === id ? updated : c)));
	}

	async function removeColumn(id: string) {
		await deleteColumn(id);
		setColumns((prev) => prev.filter((c) => c.id !== id));
	}

	async function reorderColumns(nextColumns: ColumnDefinition[]) {
		const previous = columns;
		setColumns(nextColumns);

		try {
			const updated = await reorderColumnsRequest(nextColumns.map((c) => c.id));
			setColumns(updated);
		} catch (err) {
			setColumns(previous);
			throw err;
		}
	}

	return { columns, setColumns, loading, error, reload, addColumn, renameColumn, changeColumnType, removeColumn, reorderColumns };
}
