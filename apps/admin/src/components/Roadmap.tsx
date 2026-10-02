import { Button, Input, Modal, Selector } from '@xernerx/ui';
import { useDictionary, useEnvironment, useToast } from '@xernerx/providers';
import { useEffect, useState } from 'react';

import { Loading } from '@xernerx/feedback';

export default function Roadmap() {
	const { getEnvUrl } = useEnvironment();
	const { toast } = useToast();
	const { t } = useDictionary();
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);

	const [modalOpen, setModalOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [product, setProduct] = useState('');
	const [status, setStatus] = useState('idea');
	const [targetQuarter, setTargetQuarter] = useState('');

	const [products, setProducts] = useState<string[]>([]);

	const fetchData = () => {
		fetch(getEnvUrl('https://api.xernerx.com/secure/core/roadmap'), { credentials: 'include' })
			.then((res) => res.json())
			.then((d) => {
				setData(d.data || []);
				setLoading(false);
			})
			.catch((err) => {
				console.error(err);
				setLoading(false);
			});

		fetch(getEnvUrl('https://api.xernerx.com/info/roadmap/products'))
			.then((res) => res.json())
			.then((d) => setProducts(d.data || []));
	};

	useEffect(() => {
		fetchData();
	}, [getEnvUrl]);

	const openCreate = () => {
		setEditId(null);
		setTitle('');
		setDescription('');
		setProduct('');
		setStatus('idea');
		setTargetQuarter('');
		setModalOpen(true);
	};

	const openEdit = (item: any) => {
		setEditId(item.id);
		setTitle(item.title || '');
		setDescription(item.description || '');
		setProduct(item.productId || '');
		setStatus(item.status || 'idea');
		setTargetQuarter(item.targetQuarter || '');
		setModalOpen(true);
	};

	const saveItem = async () => {
		if (!title || !description || !product || !status) return toast({ type: 'error', title: 'Error', description: 'Fill required fields' });
		try {
			await fetch(getEnvUrl(editId ? `https://api.xernerx.com/secure/core/roadmap/${editId}` : 'https://api.xernerx.com/secure/core/roadmap'), {
				method: editId ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ title, description, productId: product, status, targetQuarter }),
			});
			toast({ type: 'success', title: editId ? 'Updated' : 'Created', description: `Roadmap item ${editId ? 'updated' : 'added'}.` });
			setModalOpen(false);
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: 'Error', description: err.message });
		}
	};

	const updateStatus = async (id: string, newStatus: string) => {
		try {
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/roadmap/${id}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ status: newStatus }),
			});
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: 'Error', description: err.message });
		}
	};

	const deleteItem = async (id: string) => {
		try {
			await fetch(getEnvUrl(`https://api.xernerx.com/secure/core/roadmap/${id}`), {
				method: 'DELETE',
				credentials: 'include',
			});
			toast({ type: 'success', title: 'Deleted', description: 'Item removed.' });
			fetchData();
		} catch (err: any) {
			toast({ type: 'error', title: 'Error', description: err.message });
		}
	};

	if (loading) return <Loading />;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">{t('admin.dashboard.roadmap.title')}</h2>
				<Button onClick={openCreate}>{t('admin.dashboard.roadmap.addItem')}</Button>
			</div>

			<Modal
				open={modalOpen}
				onOpenChange={setModalOpen}
				title={editId ? t('admin.dashboard.roadmap.modalTitle') : t('admin.dashboard.roadmap.modalTitle')}
			>
				<div className="flex flex-col gap-4 pt-4">
					<Input placeholder={t('admin.dashboard.roadmap.titlePlaceholder')} value={title} onChange={(e) => setTitle(e.target.value)} />
					<Input
						variant="textarea"
						rows={3}
						placeholder={t('admin.dashboard.roadmap.descPlaceholder')}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>

					<div className="flex gap-4">
						<div className="w-full">
							<Input
								placeholder={t('admin.dashboard.roadmap.productPlaceholder')}
								list="product-tags"
								value={product}
								onChange={(e) => setProduct(e.target.value)}
							/>
							<datalist id="product-tags">
								{products.map((p) => (
									<option key={p} value={p} />
								))}
							</datalist>
						</div>
						<Selector
							placeholder={t('admin.dashboard.roadmap.statusPlaceholder')}
							value={status}
							options={['idea', 'planned', 'active', 'released'].map((s) => ({ value: s, label: t(`info.roadmap.timeline.status.${s}`) }))}
							onChange={setStatus}
						/>
					</div>
					<Input placeholder={t('admin.dashboard.roadmap.quarterPlaceholder')} value={targetQuarter} onChange={(e) => setTargetQuarter(e.target.value)} />

					<div className="flex justify-end mt-4">
						<Button onClick={saveItem}>{t('admin.dashboard.roadmap.save')}</Button>
					</div>
				</div>
			</Modal>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				{['idea', 'planned', 'active', 'released'].map((colStatus) => (
					<div key={colStatus} className="flex flex-col gap-2 p-2 bg-(--foreground)/10 rounded-2xl">
						<h3 className="font-bold capitalize px-2">{t(`info.roadmap.timeline.status.${colStatus}`)}</h3>
						{data
							.filter((i: any) => i.status === colStatus)
							.map((item: any) => (
								<div key={item.id} className="p-4 rounded-xl bg-(--foreground)/30 backdrop-blur-md border border-(--border)/10 shadow-sm text-sm flex flex-col gap-2 group">
									<div className="font-bold">{item.title}</div>
									<div className="text-(--text-muted)">
										{item.productId} {item.targetQuarter ? `(${item.targetQuarter})` : ''}
									</div>

									<div className="flex flex-col gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
										<Selector
											value={item.status}
											options={['idea', 'planned', 'active', 'released'].map((s) => ({ value: s, label: `Move to ${s}` }))}
											onChange={(val) => updateStatus(item.id, val)}
										/>
										<div className="flex gap-2 w-full">
											<Button className="flex-1" onClick={() => openEdit(item)}>
												{t('common.edit')}
											</Button>
											<Button variant="danger" className="flex-1" onClick={() => deleteItem(item.id)}>
												{t('common.buttons.delete')}
											</Button>
										</div>
									</div>
								</div>
							))}
					</div>
				))}
			</div>
		</div>
	);
}
