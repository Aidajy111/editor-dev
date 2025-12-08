import { useState } from 'react'
import { Button } from '@mui/material'
import Editor from '../components/editor/Editor'
import PhoneSelectorDialog from '../components/PhoneSelectorDialog/PhoneSelectorDialog'
import type { Brand, Model } from '../types/phone'

// -------- data
const BRANDS: Brand[] = [
	{
		id: 1,
		label: 'Apple',
		models: [
			{
				id: 1,
				name: 'iPhone 11',
				image: '/mobile/iphone11/iphone11.png',
				camera: '/mobile/iphone11/iphone11_camera.png',
				edges: '/mobile/iphone11/edges.svg',
			},
			{
				id: 2,
				name: 'iPhone 12',
				image: '/mobile/iphone11/iphone12.png',
				camera: '/mobile/iphone11/iphone11_camera.png',
				edges: '/mobile/iphone11/edges.svg',
			},
		],
	},
	{
		id: 2,
		label: 'Android',
		models: [
			{
				id: 3,
				name: 'Samsung Galaxy S21',
				image: '/mobile/iphone11/s21.png',
				camera: '/mobile/iphone11/iphone11_camera.png',
				edges: '/mobile/iphone11/edges.svg',
			},
			{
				id: 4,
				name: 'Xiaomi Mi 11',
				image: '/mobile/iphone11/mi11.png',
				camera: '/mobile/iphone11/iphone11_camera.png',
				edges: '/mobile/iphone11/edges.svg',
			},
		],
	},
]

function EditorPage() {
	const [open, setOpen] = useState(false)
	const [selectedModel, setSelectedModel] = useState<Model | null>(null)

	return (
		<div>
			<h1>Редактор</h1>

			<Button variant='outlined' onClick={() => setOpen(true)}>
				Выбрать телефон
			</Button>

			<PhoneSelectorDialog
				open={open}
				onClose={() => setOpen(false)}
				brands={BRANDS}
				onSelect={m => setSelectedModel(m)}
			/>

			{selectedModel ? (
				<Editor model={selectedModel} />
			) : (
				<p style={{ marginTop: 20, color: '#666' }}>
					Пожалуйста, выберите модель телефона
				</p>
			)}
		</div>
	)
}

export default EditorPage
