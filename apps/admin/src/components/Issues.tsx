import { Button, Input, Modal } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import { Loading } from '@xernerx/feedback';

export default function Issues() {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);

	const [modalOpen, setModalOpen] = useState(false);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [product, setProduct] = useState('');

	const [products, setProducts] = useState<string[]>([]);

	const fetchData = () => {
		fetch(getEnvUrl('https://api.xernerx.com/secure/core/issues'), { credentials: 'include' })
			.then((res) => res.json())
			.then((d) => {
				setData(d.data || []);
				setLoading(false);
			});

		fetch(getEnvUrl('https://api.xernerx.com/info/roadmap/products'))
			.then((res) => res.json())
			.then((d) => setProducts(d.data || []));
	};

	useEffect(() => {
		fetchData();
	}, [getEnvUrl]);

	const logBug = async () => {
		if (!title || !description || !product) return toast({ type: 'error', title: 'Error', description: 'Fill all fields' });
		try {
			await fetch(getEnvUrl('https://api.xernerx.com/secure/core/issues'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ title, description, productId: product, status: 'open' }),
			});
			toast({ type: 'success', title: 'Logged', description: 'Bug logged successfully.' });
			setModalOpen(false);
			setTitle('');
			setDescription('');
			setProduct('');
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: 'Error', description: err.message });
		}
	};

	const markResolved = async (id: string) => {
		try {
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/issues/${id}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ status: 'resolved' }),
			});
			toast({ type: 'success', title: 'Resolved', description: 'Issue marked as resolved.' });
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: 'Error', description: err.message });
		}
	};

	const markAcknowledged = async (id: string) => {
		try {
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/issues/${id}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ acknowledged: true }),
			});
			toast({ type: 'success', title: t('admin.dashboard.issues.verified'), description: 'Issue verified.' });
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: 'Error', description: err.message });
		}
	};

	const deleteIssue = async (id: string) => {
		try {
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/issues/${id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			toast({ type: 'success', title: 'Deleted', description: 'Issue removed.' });
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: 'Error', description: err.message });
		}
	};

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">{t('admin.dashboard.issues.title')}</h2>
				<Button onClick={() => setModalOpen(true)}>{t('admin.dashboard.issues.logBug')}</Button>
			</div>

			<Modal open={modalOpen} onOpenChange={setModalOpen} title={t('admin.dashboard.issues.modalTitle')}>
				<div className="flex flex-col gap-4 pt-4">
					<Input placeholder={t('admin.dashboard.issues.titlePlaceholder')} value={title} onChange={(e) => setTitle(e.target.value)} />
					<Input
						variant="textarea"
						rows={4}
						placeholder={t('admin.dashboard.issues.descPlaceholder')}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
					<Input placeholder={t('admin.dashboard.issues.productPlaceholder')} list="product-tags" value={product} onChange={(e) => setProduct(e.target.value)} />
					<datalist id="product-tags">
						{products.map((p) => (
							<option key={p} value={p} />
						))}
					</datalist>
					<div className="flex justify-end mt-4">
						<Button onClick={logBug}>{t('admin.dashboard.issues.save')}</Button>
					</div>
				</div>
			</Modal>

			<div className="flex flex-col gap-2">
				{data.map((item: any) => (
					<div key={item.id} className="flex justify-between items-center p-4 rounded-xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm">
						<div>
							<div className="font-bold flex items-center gap-2">
								<span className={item.status === 'resolved' ? 'text-green-500' : 'text-red-500'}>●</span>
								{item.title}
							</div>
							<div className="text-sm text-(--text-muted) mt-1">{item.description}</div>
							<div className="flex items-center gap-2 mt-2">
								<div className="text-xs bg-(--accent)/10 text-(--accent) w-fit px-2 py-1 rounded border border-(--accent)/20">{item.productId}</div>
								{item.acknowledged === false && (
									<span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20 font-medium">
										{t('admin.dashboard.issues.submitted')}
									</span>
								)}
							</div>
						</div>
						<div className="flex items-center gap-2">
							{item.acknowledged === false && <Button onClick={() => markAcknowledged(item.id)}>{t('admin.dashboard.issues.verify')}</Button>}
							{item.status === 'open' && <Button onClick={() => markResolved(item.id)}>{t('admin.dashboard.issues.resolved')}</Button>}
							<Button onClick={() => deleteIssue(item.id)}>{t('common.buttons.delete')}</Button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
