import type { ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from './ContactForm';
import type { ColumnDefinition } from '../types/column';
import type { Contact } from '../types/contact';

const NAME_COLUMN: ColumnDefinition = {
	id: 'col-name', key: 'name', label: 'Name', type: 'text', order: 0, isCore: true, isMandatory: true,
};
const PHONE_COLUMN: ColumnDefinition = {
	id: 'col-phone', key: 'phone', label: 'Phone', type: 'phone', order: 1, isCore: true, isMandatory: true,
};
const ENTERPRISE_COLUMN: ColumnDefinition = {
	id: 'col-enterprise', key: 'enterprise', label: 'Enterprise', type: 'text', order: 2, isCore: true, isMandatory: false,
};
const LINKEDIN_COLUMN: ColumnDefinition = {
	id: 'col-linkedin', key: 'custom_123', label: 'LinkedIn', type: 'text', order: 3, isCore: false, isMandatory: false,
};

function renderForm(columns: ColumnDefinition[], overrides: Partial<ComponentProps<typeof ContactForm>> = {}) {
	const onSubmit = vi.fn().mockResolvedValue(undefined);
	const onClose = vi.fn();
	render(<ContactForm mode="create" columns={columns} onSubmit={onSubmit} onClose={onClose} {...overrides} />);
	return { onSubmit, onClose };
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
	await user.type(screen.getByLabelText('Name'), 'Jane Doe');
	await user.type(screen.getByLabelText(/^Phone/), '612345678');
}

describe('ContactForm', () => {
	it('omits a deleted column (e.g. Enterprise) from the form', () => {
		renderForm([NAME_COLUMN, PHONE_COLUMN]);

		expect(screen.getByLabelText('Name')).toBeInTheDocument();
		expect(screen.getByLabelText(/^Phone/)).toBeInTheDocument();
		expect(screen.queryByLabelText('Enterprise')).not.toBeInTheDocument();
	});

	it('renders a newly added custom column', () => {
		renderForm([NAME_COLUMN, PHONE_COLUMN, LINKEDIN_COLUMN]);

		expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
	});

	it('blocks submit when a mandatory field is blank', async () => {
		const user = userEvent.setup();
		const { onSubmit } = renderForm([NAME_COLUMN, PHONE_COLUMN, ENTERPRISE_COLUMN]);

		await user.type(screen.getByLabelText(/^Phone/), '612345678');
		await user.type(screen.getByLabelText('Name'), ' ');
		await user.click(screen.getByRole('button', { name: 'Save' }));

		expect(await screen.findByText('Name is required.')).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('allows an optional field (Enterprise) to stay blank', async () => {
		const user = userEvent.setup();
		const { onSubmit } = renderForm([NAME_COLUMN, PHONE_COLUMN, ENTERPRISE_COLUMN]);

		await fillRequiredFields(user);
		await user.click(screen.getByRole('button', { name: 'Save' }));

		await waitFor(() => expect(onSubmit).toHaveBeenCalled());
		expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('enterprise');
	});

	it('formats the phone as +33XXXXXXXXX and sends core fields at the top level', async () => {
		const user = userEvent.setup();
		const { onSubmit } = renderForm([NAME_COLUMN, PHONE_COLUMN]);

		await fillRequiredFields(user);
		await user.click(screen.getByRole('button', { name: 'Save' }));

		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jane Doe', phone: '+33612345678' })),
		);
	});

	it('rejects an invalid French phone number', async () => {
		const user = userEvent.setup();
		const { onSubmit } = renderForm([NAME_COLUMN, PHONE_COLUMN]);

		await user.type(screen.getByLabelText('Name'), 'Jane Doe');
		await user.type(screen.getByLabelText(/^Phone/), '12');
		await user.click(screen.getByRole('button', { name: 'Save' }));

		expect(await screen.findByText(/valid French phone number/)).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('puts custom column values under customFields, keyed by the column key', async () => {
		const user = userEvent.setup();
		const { onSubmit } = renderForm([NAME_COLUMN, PHONE_COLUMN, LINKEDIN_COLUMN]);

		await fillRequiredFields(user);
		await user.type(screen.getByLabelText('LinkedIn'), 'linkedin.com/in/jane');
		await user.click(screen.getByRole('button', { name: 'Save' }));

		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					customFields: expect.objectContaining({ custom_123: 'linkedin.com/in/jane' }),
				}),
			),
		);
	});

	it('pre-fills from initialContact using only the currently-present columns', () => {
		const initialContact: Contact = {
			id: 'c1',
			name: 'Jane Doe',
			enterprise: 'Acme', // column no longer present — must not crash, must not render
			phone: '+33612345678',
			date: '2024-01-01',
			score: 3,
			customFields: {},
		};

		renderForm([NAME_COLUMN, PHONE_COLUMN], { mode: 'edit', initialContact });

		expect(screen.getByLabelText('Name')).toHaveValue('Jane Doe');
		expect(screen.getByLabelText(/^Phone/)).toHaveValue('612345678');
		expect(screen.queryByLabelText('Enterprise')).not.toBeInTheDocument();
	});

	it('does not show a Delete button in create mode', () => {
		renderForm([NAME_COLUMN, PHONE_COLUMN], { mode: 'create' });
		expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
	});

	it('shows a Delete button in edit mode when onDelete is provided', () => {
		renderForm([NAME_COLUMN, PHONE_COLUMN], { mode: 'edit', onDelete: vi.fn() });
		expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
	});
});
