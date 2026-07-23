import { useEffect, useRef, useState } from 'react';
import './SearchBar.css';

interface SearchBarProps {
	search: string;
	setSearch: (value: string) => void;
}

const DEBOUNCE_MS = 400;

export default function SearchBar({ search, setSearch }: SearchBarProps) {
	const [draft, setDraft] = useState(search);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		setDraft(search);
	}, [search]);

	function handleChange(value: string) {
		setDraft(value);

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => {
			setSearch(value);
		}, DEBOUNCE_MS);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === 'Enter') {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			setSearch(draft);
		}
	}

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return (
		<div className="search-bar">
			<input
				type="text"
				className="search-bar-input"
				placeholder="Search by name..."
				value={draft}
				onChange={(event) => handleChange(event.target.value)}
				onKeyDown={handleKeyDown}
			/>
		</div>
	);
}
