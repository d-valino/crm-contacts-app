import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('does not call setSearch until the debounce delay has passed', () => {
		const setSearch = vi.fn();
		render(<SearchBar search="" setSearch={setSearch} />);

		fireEvent.change(screen.getByPlaceholderText('Search by name...'), { target: { value: 'Jane' } });

		expect(setSearch).not.toHaveBeenCalled();

		vi.advanceTimersByTime(399);
		expect(setSearch).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		expect(setSearch).toHaveBeenCalledWith('Jane');
		expect(setSearch).toHaveBeenCalledTimes(1);
	});

	it('resets the debounce timer on every keystroke rather than firing once per change', () => {
		const setSearch = vi.fn();
		render(<SearchBar search="" setSearch={setSearch} />);
		const input = screen.getByPlaceholderText('Search by name...');

		fireEvent.change(input, { target: { value: 'J' } });
		vi.advanceTimersByTime(300);
		fireEvent.change(input, { target: { value: 'Ja' } }); // resets the 400ms window

		vi.advanceTimersByTime(300);
		expect(setSearch).not.toHaveBeenCalled();

		vi.advanceTimersByTime(100);
		expect(setSearch).toHaveBeenCalledWith('Ja');
		expect(setSearch).toHaveBeenCalledTimes(1);
	});

	it('bypasses the debounce and searches immediately on Enter', () => {
		const setSearch = vi.fn();
		render(<SearchBar search="" setSearch={setSearch} />);
		const input = screen.getByPlaceholderText('Search by name...');

		fireEvent.change(input, { target: { value: 'Jane' } });
		fireEvent.keyDown(input, { key: 'Enter' });

		expect(setSearch).toHaveBeenCalledWith('Jane');
	});

	it('reflects an externally-changed search value', () => {
		const { rerender } = render(
			<SearchBar search="" setSearch={vi.fn()} />
		);

		expect(
			(screen.getByPlaceholderText('Search by name...') as HTMLInputElement).value
		).toBe('');

		rerender(
			<SearchBar search="restored" setSearch={vi.fn()} />
		);

		const input = screen.getByPlaceholderText(
			'Search by name...'
		) as HTMLInputElement;

		expect(input.value).toBe('restored');
	});
});
