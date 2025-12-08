import { useEffect, useMemo, useRef, useState } from 'react'
import {
	Button,
	Typography,
	TextField,
	Slider,
	List,
	ListItemButton,
	ListItemText,
	IconButton,
	Stack,
} from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
	Stage,
	Layer,
	Image as KImage,
	Text as KText,
	Transformer,
} from 'react-konva'
import styles from './Editor.module.scss'

/** хук для фонового изображения телефона */
function useImage(url?: string) {
	const [img, setImg] = useState<HTMLImageElement | null>(null)
	useEffect(() => {
		if (!url) return
		const i = new Image()
		i.crossOrigin = 'anonymous'
		i.src = url
		i.onload = () => setImg(i)
	}, [url])
	return img
}

/** Предзагружает список src-ов и возвращает map src -> HTMLImageElement | undefined */
function usePreloadImages(srcs: string[]) {
	const [images, setImages] = useState<
		Record<string, HTMLImageElement | undefined>
	>({})
	const key = srcs.join('|')

	useEffect(() => {
		if (!key) return
		let mounted = true
		const list = srcs.filter(Boolean)
		list.forEach(src => {
			const img = new Image()
			img.crossOrigin = 'anonymous'
			img.src = src
			img.onload = () => {
				if (!mounted) return
				setImages(prev => (prev[src] ? prev : { ...prev, [src]: img }))
			}
		})
		return () => {
			mounted = false
		}
	}, [key])

	return images
}

/* ---------- типы ---------- */

type TextEl = {
	id: number
	type: 'text'
	x: number
	y: number
	text: string
	fontSize: number
	fill: string
	rotation: number
}

type ImageEl = {
	id: number
	type: 'image'
	x: number
	y: number
	src: string
	width: number
	height: number
	rotation: number
}

type CanvasElement = TextEl | ImageEl

type EditorProps = {
	model: {
		id: number
		name: string
		image: string
		camera: string
		edges: string
	}
}

/* ---------- компонент ---------- */
export default function Editor({ model }: EditorProps) {
	const STAGE_W = 420
	const STAGE_H = 820

	// оставил any для ref чтобы не возникало проблем с типами react-konva в разных версиях
	const stageRef = useRef<any>(null)
	const trRef = useRef<any>(null)

	const phoneImage = useImage(model?.image)
	const phoneCamera = useImage(model?.camera) // из public
	const phoneEdges = useImage(model?.edges) // из public (если svg — лучше png/ webp)

	const [elements, setElements] = useState<CanvasElement[]>([])
	const [selectedId, setSelectedId] = useState<number | null>(null)

	const handleAddText = () => {
		const id = Date.now()
		const newText: TextEl = {
			id,
			type: 'text',
			x: 100,
			y: 200,
			text: 'Новый текст',
			fontSize: 24,
			fill: '#000',
			rotation: 0,
		}
		setElements(p => [...p, newText])
		setSelectedId(id)
	}

	const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const reader = new FileReader()
		reader.onload = () => {
			const src = reader.result as string
			const img = new Image()
			img.src = src
			img.onload = () => {
				const id = Date.now()
				const newImg: ImageEl = {
					id,
					type: 'image',
					x: 50,
					y: 50,
					src,
					width: img.width > 200 ? 200 : img.width,
					height: img.height > 200 ? 200 : img.height,
					rotation: 0,
				}
				setElements(p => [...p, newImg])
				setSelectedId(id)
			}
		}
		reader.readAsDataURL(file)
		e.currentTarget.value = ''
	}

	const updateElementById = (
		id: number | null,
		updates: Partial<CanvasElement>
	) => {
		if (id === null) return
		setElements(prev =>
			prev.map(el =>
				el.id === id ? ({ ...el, ...updates } as CanvasElement) : el
			)
		)
	}

	const removeEl = (id: number) => {
		setElements(prev => prev.filter(e => e.id !== id))
		if (selectedId === id) setSelectedId(null)
	}

	// --- операции со слоями (Z-порядок) ---
	const moveUp = (id: number) => {
		setElements(prev => {
			const i = prev.findIndex(e => e.id === id)
			if (i < 0 || i === prev.length - 1) return prev
			const arr = prev.slice()
			;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
			return arr
		})
	}

	const moveDown = (id: number) => {
		setElements(prev => {
			const i = prev.findIndex(e => e.id === id)
			if (i <= 0) return prev
			const arr = prev.slice()
			;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
			return arr
		})
	}

	const selectedElement = elements.find(el => el.id === selectedId) || null

	// собираем src всех картинок (хуки вызываются один раз и не в цикле)
	const imageSrcs = useMemo(
		() => elements.filter(e => e.type === 'image').map((e: ImageEl) => e.src),
		[elements]
	)
	const imagesMap = usePreloadImages(imageSrcs)

	// Привязка трансформера к выбранному узлу
	useEffect(() => {
		const tr = trRef.current
		const stage = stageRef.current
		if (!tr || !stage) return

		if (selectedId !== null) {
			const node = stage.findOne(`#node-${selectedId}`)
			if (node) {
				tr.nodes([node])
				tr.getLayer()?.batchDraw()
			} else {
				tr.nodes([])
				tr.getLayer()?.batchDraw()
			}
		} else {
			tr.nodes([])
			tr.getLayer()?.batchDraw()
		}
	}, [selectedId, elements])

	function isImageEl(e: CanvasElement): e is ImageEl {
		return e.type === 'image'
	}

	return (
		<div className={styles.editorWrapper}>
			{/* Панель действий */}
			{/* <Button variant='contained' onClick={handleExport}>
					Экспорт PNG
				</Button> */}

			<div className={styles.editorMainBlock}>
				{/* Слои */}
				<div className={styles.layersBlock}>
					<div className={styles.buttonsWrapper}>
						<div className={styles.toolbar}>
							<Button variant='outlined' onClick={handleAddText}>
								+ Текст
							</Button>
							<Button variant='outlined' component='label'>
								+ Изображение
								<input
									type='file'
									accept='image/*'
									hidden
									onChange={handleAddImage}
								/>
							</Button>
						</div>
					</div>
					{elements.length > 0 ? (
						<div className={styles.layersWrapper}>
							<Typography variant='h6' sx={{ mb: 1 }}>
								Слои
							</Typography>
							<List
								dense
								sx={{
									border: '1px solid #eee',
									borderRadius: 1,
									maxHeight: 360,
									overflow: 'auto',
								}}
							>
								{/* Показ сверху-вниз как в отрисовке: верхние элементы — в конце массива.
											Хотим, чтобы ВЕРХНИЙ слой был СВЕРХУ списка — поэтому реверс. */}
								{[...elements].reverse().map(el => {
									const isSelected = selectedId === el.id
									const title = el.type === 'text' ? el.text : 'Изображение'

									return (
										<ListItemButton
											key={el.id}
											selected={isSelected}
											onClick={() => setSelectedId(el.id)}
											sx={{ py: 0.5 }}
										>
											<div className={styles.LayerIcon}>
												{isImageEl(el) ? (
													<img
														src={el.src} // <- загруженная картинка (dataURL/путь)
														alt='thumb'
														className={styles.LayerThumb}
														onError={e => {
															;(e.currentTarget as HTMLImageElement).src =
																'/fallback-icon.png'
														}}
													/>
												) : (
													<span className={styles.TextIcon}>T</span>
												)}
											</div>

											<ListItemText primary={title} secondary={el.type} />
											<Stack direction='row' spacing={0.5}>
												<IconButton
													size='small'
													title='Вверх (поверх)'
													onClick={ev => {
														ev.stopPropagation()
														moveUp(el.id)
													}}
												>
													<ArrowUpwardIcon fontSize='inherit' />
												</IconButton>
												<IconButton
													size='small'
													title='Вниз (под)'
													onClick={ev => {
														ev.stopPropagation()
														moveDown(el.id)
													}}
												>
													<ArrowDownwardIcon fontSize='inherit' />
												</IconButton>
												<IconButton
													size='small'
													color='error'
													title='Удалить'
													onClick={ev => {
														ev.stopPropagation()
														removeEl(el.id)
													}}
												>
													<DeleteOutlineIcon fontSize='inherit' />
												</IconButton>
											</Stack>
										</ListItemButton>
									)
								})}
							</List>
						</div>
					) : (
						<div style={{ margin: '10px 0 0 0' }}>
							Загрузите картинку или текст
						</div>
					)}
				</div>

				<div className={styles.workspace}>
					{/* Канвас */}
					<div className={styles.canvasWrapper} style={{ flex: '0 0 auto' }}>
						<Stage
							width={STAGE_W}
							height={STAGE_H}
							ref={stageRef}
							onMouseDown={e => {
								const isStage = e.target === e.target.getStage()
								if (isStage) setSelectedId(null)
							}}
						>
							{/* Слой 1: фон */}
							<Layer listening={false}>
								{phoneImage && (
									<KImage image={phoneImage} width={STAGE_W} height={STAGE_H} />
								)}
							</Layer>

							{/* Слой 2: пользовательский контент */}
							<Layer>
								{elements.map(el => {
									if (el.type === 'text') {
										const t = el as TextEl
										return (
											<KText
												key={t.id}
												id={`node-${t.id}`}
												text={t.text}
												x={t.x}
												y={t.y}
												fontSize={t.fontSize}
												fill={t.fill}
												rotation={t.rotation}
												draggable
												onClick={() => setSelectedId(t.id)}
												onTap={() => setSelectedId(t.id)}
												onDragEnd={e =>
													updateElementById(t.id, {
														x: e.target.x(),
														y: e.target.y(),
													})
												}
												onTransformEnd={e => {
													const node = e.target
													const scaleX = node.scaleX() ?? 1
													const newFontSize = Math.max(
														8,
														Math.round(t.fontSize * scaleX)
													)
													updateElementById(t.id, {
														x: node.x(),
														y: node.y(),
														rotation: node.rotation(),
														fontSize: newFontSize,
													})
													node.scaleX(1)
													node.scaleY(1)
												}}
											/>
										)
									}

									// image
									const im = el as ImageEl
									const imgEl = imagesMap[im.src] // HTMLImageElement | undefined
									return (
										<KImage
											key={im.id}
											id={`node-${im.id}`}
											image={imgEl ?? undefined}
											x={im.x}
											y={im.y}
											width={im.width}
											height={im.height}
											rotation={im.rotation}
											draggable
											onClick={() => setSelectedId(im.id)}
											onTap={() => setSelectedId(im.id)}
											onDragEnd={e =>
												updateElementById(im.id, {
													x: e.target.x(),
													y: e.target.y(),
												})
											}
											onTransformEnd={e => {
												const node = e.target
												const scaleX = node.scaleX() ?? 1
												const scaleY = node.scaleY() ?? 1
												const newW = Math.max(5, Math.round(im.width * scaleX))
												const newH = Math.max(5, Math.round(im.height * scaleY))
												updateElementById(im.id, {
													x: node.x(),
													y: node.y(),
													rotation: node.rotation(),
													width: newW,
													height: newH,
												})
												node.scaleX(1)
												node.scaleY(1)
											}}
										/>
									)
								})}

								<Transformer
									ref={trRef}
									rotateEnabled
									boundBoxFunc={(oldB, newB) => {
										if (newB.width < 30 || newB.height < 30) return oldB
										return newB
									}}
								/>
							</Layer>

							{/* Слой 3: оверлеи — всегда поверх, но клики не перехватывают */}
							<Layer listening={false}>
								{phoneCamera && (
									<KImage
										image={phoneCamera}
										width={STAGE_W}
										height={STAGE_H}
									/>
								)}
								{phoneEdges && (
									<KImage image={phoneEdges} width={STAGE_W} height={STAGE_H} />
								)}
							</Layer>
						</Stage>
					</div>
				</div>

				{/* Правая колонка: Слои + Свойства */}
				<div>
					{/* Панель свойств — ТЕКСТ */}
					{selectedElement && selectedElement.type === 'text' && (
						<div className={styles.featuresBlock}>
							<Typography variant='h6'>Редактировать текст</Typography>

							<TextField
								label='Текст'
								fullWidth
								value={(selectedElement as TextEl).text}
								onChange={e =>
									updateElementById(selectedElement.id, {
										text: e.target.value,
									})
								}
								sx={{ mb: 2 }}
							/>

							{/* НОВОЕ: выбор цвета */}
							<Stack
								direction='row'
								alignItems='center'
								spacing={2}
								sx={{ mb: 2 }}
							>
								<TextField
									label='Цвет'
									type='color'
									value={(selectedElement as TextEl).fill}
									onChange={e =>
										updateElementById(selectedElement.id, {
											fill: e.target.value,
										})
									}
									InputLabelProps={{ shrink: true }}
									sx={{ width: 120 }}
								/>
								<Button
									size='small'
									onClick={() =>
										updateElementById(selectedElement.id, { fill: '#000000' })
									}
								>
									Сброс
								</Button>
							</Stack>

							<Typography>Размер шрифта</Typography>
							<Slider
								min={10}
								max={100}
								value={(selectedElement as TextEl).fontSize}
								onChange={(_, val) =>
									updateElementById(selectedElement.id, {
										fontSize: val as number,
									})
								}
							/>

							<Typography>Поворот</Typography>
							<Slider
								min={-180}
								max={180}
								value={(selectedElement as TextEl).rotation}
								onChange={(_, val) =>
									updateElementById(selectedElement.id, {
										rotation: val as number,
									})
								}
							/>
						</div>
					)}

					{selectedElement && selectedElement.type === 'image' && (
						<div className={styles.featuresBlock}>
							<Typography variant='h6' sx={{ mb: 1 }}>
								Свойства: Картинка
							</Typography>
							<Typography>Ширина</Typography>
							<Slider
								min={20}
								max={800}
								value={(selectedElement as ImageEl).width}
								onChange={(_, val) =>
									updateElementById(selectedElement.id, {
										width: val as number,
									})
								}
							/>
							<Typography>Высота</Typography>
							<Slider
								min={20}
								max={1200}
								value={(selectedElement as ImageEl).height}
								onChange={(_, val) =>
									updateElementById(selectedElement.id, {
										height: val as number,
									})
								}
							/>
							<Typography>Поворот</Typography>
							<Slider
								min={-180}
								max={180}
								value={(selectedElement as ImageEl).rotation}
								onChange={(_, val) =>
									updateElementById(selectedElement.id, {
										rotation: val as number,
									})
								}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
