import type { Contact } from '../types/contact';
import './ContactRow.css';

interface ContactRowProps {
	contact: Contact;
	onClick: (contact: Contact) => void;
}

function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString();
}

export default function ContactRow({ contact, onClick }: ContactRowProps) {
	return (
		<tr className="contact-row" onClick={() => onClick(contact)}>
			<td>{contact.name}</td>
			<td>{contact.enterprise ?? '—'}</td>
			<td>{contact.phone}</td>
			<td>{formatDate(contact.date)}</td>
			<td>{contact.score}</td>
		</tr>
	);
}
