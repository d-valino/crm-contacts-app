import type { Contact } from '../types/contact';
import './ContactRow.css';

interface ContactRowProps {
	contact: Contact;
}

function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString();
}

export default function ContactRow({ contact }: ContactRowProps) {
	return (
		<tr className="contact-row">
			<td>{contact.name}</td>
			<td>{contact.enterprise ?? '—'}</td>
			<td>{contact.phone}</td>
			<td>{formatDate(contact.date)}</td>
			<td>{contact.score}</td>
		</tr>
	);
}