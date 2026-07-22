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

export default function SearchBar({
	search,
	setSearch,
	searchField,
	setSearchField,
}: SearchBarProps) {
	return (
		<div className="search-bar">
			<input
				type="text"
				className="search-bar-input"
				placeholder={`Search by ${searchField}...`}
				value={search}
				onChange={(event) => setSearch(event.target.value)}
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
