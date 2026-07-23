import { useState } from 'react';
import ContactsTable from './components/ContactsTable';
import { useContacts } from './hooks/useContacts';
import type { Contact } from './types/contact';
import './App.css';
import ContactForm from './components/ContactForm';

function App() {

	const contacts = useContacts();
	const [formOpen, setFormOpen] = useState(false);
	const [editingContact, setEditingContact] = useState<Contact | null>(null);

	if (contacts.loading) {
		return <p>Loading contacts...</p>;
	}

	if (contacts.error) {
		return <p>Error: {contacts.error}</p>;
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
				onRowClick={openEditForm}
			/>
			{formOpen && (
				<ContactForm
					mode={editingContact ? 'edit' : 'create'}
					initialContact={editingContact ?? undefined}
					onSubmit={(data) =>
						editingContact
						? contacts.editContact(editingContact.id, data)
						: contacts.addContact(data)
					}
					onDelete={
						editingContact ? () => contacts.removeContact(editingContact.id) : undefined
					}
					onClose={closeForm}
				/>
			)}
		</div>
	);
}

export default App;
