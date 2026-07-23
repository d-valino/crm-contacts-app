import type { Contact } from '../types/contact';
import './ContactRow.css';

interface ContactRowProps {
	contact: Contact;
	onClick: (contact: Contact) => void;
}

function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString();
}

function formatFrenchPhone(phone: string): string {
	const local = phone.replace('+33', '0');
	return local.replace(/(\d)(?=(\d{2})+(?!\d))/g, '$1 ');
}

export default function ContactRow({ contact, onClick }: ContactRowProps) {
	return (
		<tr className="contact-row" onClick={() => onClick(contact)}>
			<td>{contact.name}</td>
			<td>{contact.enterprise ?? '—'}</td>
			<td>{formatFrenchPhone(contact.phone)}</td>
			<td>{formatDate(contact.date)}</td>
			<td>{contact.score}</td>
		</tr>
	);
}
