import ContactsTable from './components/ContactsTable';
import { useContacts } from './hooks/useContacts';
import './App.css';

function App() {

	const contacts = useContacts();

	if (contacts.loading) {
		return <p>Loading contacts...</p>;
	}

	if (contacts.error) {
		return <p>Error: {contacts.error}</p>;
	}

	return (
		<div className="app">
			<h1>Contacts</h1>

			<ContactsTable
				{...contacts}
			/>
		</div>
	);
}

export default App;
