import { useCallback, useEffect, useState } from 'react';
import type { ColumnDefinition } from '../types/column';
import { fetchColumns } from '../api/columns';

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

	return { columns, setColumns, loading, error, reload };
}
