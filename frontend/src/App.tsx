import { useState } from 'react';
import { useContacts } from './hooks/useContacts';
import { useColumns } from './hooks/useColumns';
import ContactsTable from './components/ContactsTable';
import ContactForm from './components/ContactForm';
import type { Contact } from './types/contact';
import './App.css';

function App() {
	const contacts = useContacts();
	const {
		columns,
		loading: columnsLoading,
		error: columnsError,
		addColumn,
		renameColumn,
		changeColumnType,
		removeColumn,
		reorderColumns
	} = useColumns();

	const [formOpen, setFormOpen] = useState(false);
	const [editingContact, setEditingContact] = useState<Contact | null>(null);

	if (contacts.loading || columnsLoading) {
		return <p>Loading contacts...</p>;
	}

	if (contacts.error) {
		return <p>Error: {contacts.error}</p>;
	}

	if (columnsError) {
		return <p>Error: {columnsError}</p>;
	}

	function openCreateForm() {
		setEditingContact(null);
		setFormOpen(true);
	}

	function openEditForm(contact: Contact) {
		setEditingContact(contact);
		setFormOpen(true);
	}

	function closeForm() {
		setFormOpen(false);
		setEditingContact(null);
	}

	return (
		<div className="app">
			<div className="app-header">
				<h1>Contacts</h1>
				<button type="button" className="add-contact-btn" onClick={openCreateForm}>
					+ Add contact
				</button>
			</div>

			<ContactsTable
				{...contacts}
				columns={columns}
				onRowClick={openEditForm}
				onCellSave={contacts.updateCell}
				onAddColumn={addColumn}
				onRenameColumn={renameColumn}
				onChangeColumnType={changeColumnType}
				onDeleteColumn={removeColumn}
				onReorderColumns={reorderColumns}
			/>

			{formOpen && (
				<ContactForm
					mode={editingContact ? 'edit' : 'create'}
					initialContact={editingContact ?? undefined}
					onSubmit={(data) =>
						editingContact ? contacts.editContact(editingContact.id, data) : contacts.addContact(data)
					}
					onDelete={editingContact ? () => contacts.removeContact(editingContact.id) : undefined}
					onClose={closeForm}
				/>
			)}
		</div>
	);
}

export default App;
