import { useEffect, useRef, useState } from 'react';
import './SearchBar.css';

interface SearchBarProps {
	search: string;
	setSearch: (value: string) => void;
	searchField: string;
	setSearchField: (field: string) => void;
}

const SEARCH_FIELDS = [
	{ value: 'name', label: 'Name' },
	{ value: 'enterprise', label: 'Enterprise' },
];

const DEBOUNCE_MS = 400;

export default function SearchBar({ search, setSearch, searchField, setSearchField }: SearchBarProps) {
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
				placeholder={`Search by ${searchField}...`}
				value={draft}
				onChange={(event) => handleChange(event.target.value)}
				onKeyDown={handleKeyDown}
			/>

			<div className="search-bar-toggle">
				{SEARCH_FIELDS.map((field) => (
					<button
						key={field.value}
						type="button"
						className={
							field.value === searchField
								? 'search-bar-toggle-btn active'
								: 'search-bar-toggle-btn'
						}
						onClick={() => setSearchField(field.value)}
					>
						{field.label}
					</button>
				))}
			</div>
		</div>
	);
}
