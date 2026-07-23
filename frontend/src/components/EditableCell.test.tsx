import '@testing-library/jest-dom/vitest';
import type { ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditableCell from './EditableCell';

function renderCell(overrides: Partial<ComponentProps<typeof EditableCell>> = {}) {
	const onSave = vi.fn().mockResolvedValue(undefined);
	render(
		<table>
			<tbody>
				<tr>
					<EditableCell value="Jane" type="text" displayValue="Jane" onSave={onSave} {...overrides} />
				</tr>
			</tbody>
		</table>,
	);
	return { onSave };
}

describe('EditableCell', () => {
	it('shows the display value until clicked', () => {
		renderCell();

		expect(screen.getByText('Jane')).toBeInTheDocument();
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
	});

	it('enters edit mode on click and commits the new value on blur', async () => {
		const { onSave } = renderCell();

		fireEvent.click(screen.getByText('Jane'));
		const input = screen.getByRole('textbox') as HTMLInputElement;
		expect(input.value).toBe('Jane');

		fireEvent.change(input, { target: { value: 'John' } });
		fireEvent.blur(input);

		await waitFor(() => expect(onSave).toHaveBeenCalledWith('John'));
	});

	it('commits on Enter', async () => {
		const { onSave } = renderCell();

		fireEvent.click(screen.getByText('Jane'));
		const input = screen.getByRole('textbox');
		fireEvent.change(input, { target: { value: 'John' } });
		fireEvent.keyDown(input, { key: 'Enter' });

		await waitFor(() => expect(onSave).toHaveBeenCalledWith('John'));
	});

	it('cancels on Escape without saving, restoring the display value', () => {
		const { onSave } = renderCell();

		fireEvent.click(screen.getByText('Jane'));
		const input = screen.getByRole('textbox');
		fireEvent.change(input, { target: { value: 'John' } });
		fireEvent.keyDown(input, { key: 'Escape' });

		expect(onSave).not.toHaveBeenCalled();
		expect(screen.getByText('Jane')).toBeInTheDocument();
	});

	it('blocks saving a required field left blank', async () => {
		const { onSave } = renderCell({ required: true });

		fireEvent.click(screen.getByText('Jane'));
		const input = screen.getByRole('textbox');
		fireEvent.change(input, { target: { value: '' } });
		fireEvent.blur(input);

		expect(await screen.findByText('Required')).toBeInTheDocument();
		expect(onSave).not.toHaveBeenCalled();
	});

	it('does not call onSave when the value is unchanged', () => {
		const { onSave } = renderCell();

		fireEvent.click(screen.getByText('Jane'));
		fireEvent.blur(screen.getByRole('textbox'));

		expect(onSave).not.toHaveBeenCalled();
	});

	it('surfaces a save error inline instead of exiting edit mode', async () => {
		const onSave = vi.fn().mockRejectedValue(new Error('Score must be between 0 and 5.'));
		render(
			<table>
				<tbody>
					<tr>
						<EditableCell value={3} type="number" min={0} max={5} displayValue="3" onSave={onSave} />
					</tr>
				</tbody>
			</table>,
		);

		fireEvent.click(screen.getByText('3'));
		const input = screen.getByRole('spinbutton');
		fireEvent.change(input, { target: { value: '8' } });
		fireEvent.blur(input);

		expect(await screen.findByText('Score must be between 0 and 5.')).toBeInTheDocument();
		// still in edit mode — the input is still there, not the plain display cell
		expect(screen.getByRole('spinbutton')).toBeInTheDocument();
	});

	it('only applies min/max bounds when explicitly given (e.g. the score column), not to every number field', () => {
		renderCell({ value: 42, type: 'number', displayValue: '42' }); // no min/max passed — e.g. a custom "Years" column

		fireEvent.click(screen.getByText('42'));
		const input = screen.getByRole('spinbutton') as HTMLInputElement;

		expect(input.min).toBe('');
		expect(input.max).toBe('');
	});

	it('applies min/max bounds when given (the score column)', () => {
		renderCell({ value: 3, type: 'number', min: 0, max: 5, displayValue: '3' });

		fireEvent.click(screen.getByText('3'));
		const input = screen.getByRole('spinbutton') as HTMLInputElement;

		expect(input.min).toBe('0');
		expect(input.max).toBe('5');
	});
});
