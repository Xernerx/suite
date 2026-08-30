import { redirect } from 'next/navigation';

export default function APIIndex() {
	redirect('/api/v1');
}
