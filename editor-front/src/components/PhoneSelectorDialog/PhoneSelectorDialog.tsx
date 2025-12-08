import { useState } from 'react'
import {
	Dialog,
	DialogTitle,
	DialogContent,
	Grid,
	List,
	ListItemButton,
	ListItemText,
	Typography,
} from '@mui/material'
import type { Brand, Model } from '../../types/phone'

type Props = {
	open: boolean
	onClose: () => void
	brands: Brand[]
    onSelect: (model: Model) => void
}

export default function PhoneSelectorDialog({
	open,
	onClose,
	brands,
	onSelect,
}: Props) {
	const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth='lg'>
			<DialogTitle>Выберите бренд и модель</DialogTitle>
			<DialogContent dividers>
				<Grid container spacing={2}>
					{/* Бренды */}
					<div>
						<List dense>
							{brands.map(brand => (
								<ListItemButton
									key={brand.id}
									selected={selectedBrand?.id === brand.id}
									onClick={() => setSelectedBrand(brand)}
								>
									<ListItemText primary={brand.label} />
								</ListItemButton>
							))}
						</List>
					</div>

					{/* Модели */}
					<div>
						{selectedBrand ? (
							<List dense>
								{selectedBrand.models.map(m => (
									<ListItemButton
										key={m.id}
										onClick={() => {
											onSelect(m)
											onClose()
										}}
									>
										<ListItemText primary={m.name} />
									</ListItemButton>
								))}
							</List>
						) : (
							<Typography color='text.secondary'>
								Выберите бренд слева
							</Typography>
						)}
					</div>
				</Grid>
			</DialogContent>
		</Dialog>
	)
}
