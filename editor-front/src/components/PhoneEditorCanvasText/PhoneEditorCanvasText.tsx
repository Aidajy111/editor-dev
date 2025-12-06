import { useEffect, useRef, useState } from 'react'
import {
	Stage,
	Layer,
	Image as KImage,
	Group,
	Text as KText,
	Transformer,
	Rect,
} from 'react-konva'

// хук загрузки изображения (если нужен фон телефона)
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

type Props = {
	phoneSrc?: string // например "/mobile/iphone.png"
}

export default function PhoneEditorCanvasText({ phoneSrc }: Props) {
	const STAGE_W = 420
	const STAGE_H = 820

	const stageRef = useRef<any>(null)
	const groupRef = useRef<any>(null)
	const trRef = useRef<any>(null)

	const phone = useImage(phoneSrc)

	const [textState, setTextState] = useState({
		x: 80,
		y: 160,
		rotation: 0,
		width: 240, // макс. ширина (для переноса строк)
		fontSize: 28,
		fontFamily: 'Roboto',
		fill: '#111', // цвет текста
		align: 'center' as 'left' | 'center' | 'right',
		text: 'Перетаскивай меня ✨',
		selected: true,
	})

	// подключаем Transformer к группе
	useEffect(() => {
		if (trRef.current && groupRef.current && textState.selected) {
			trRef.current.nodes([groupRef.current])
			trRef.current.getLayer()?.batchDraw()
		}
	}, [textState.selected])

	// ограничение перемещения внутри сцены
	const clampToStage = (x: number, y: number, w: number, h: number) => ({
		x: Math.min(Math.max(0, x), STAGE_W - w),
		y: Math.min(Math.max(0, y), STAGE_H - h),
	})

	return (
		<Stage ref={stageRef} width={STAGE_W} height={STAGE_H}>
			<Layer>
				{/* фон телефона (необязательно) */}
				{phone && (
					<KImage
						image={phone}
						width={STAGE_W}
						height={STAGE_H}
						listening={false}
					/>
				)}

				{/* Группа: подсветка+текст. Двигаем/вращаем всю группу */}
				<Group
					ref={groupRef}
					x={textState.x}
					y={textState.y}
					rotation={textState.rotation}
					draggable
					onClick={() => setTextState(p => ({ ...p, selected: true }))}
					onDragMove={e => {
						// ширину/высоту берём из текущего текста (пригодится для клампа)
						const node = groupRef.current
						const w = node.width()
						const h = node.height()
						const { x, y } = clampToStage(e.target.x(), e.target.y(), w, h)
						e.target.position({ x, y })
						setTextState(p => ({ ...p, x, y }))
					}}
					onTransformEnd={() => {
						// переносим scale в fontSize/width + фиксируем rotation/pos
						const node = groupRef.current
						const scaleX = node.scaleX()
						const scaleY = node.scaleY()

						// сбрасываем scale на 1
						node.scaleX(1)
						node.scaleY(1)

						const nextWidth = Math.max(60, textState.width * scaleX)
						const nextFont = Math.max(8, textState.fontSize * scaleY)

						// позиция с клампом
						const w = node.width() * scaleX // приблизительно, до сброса
						const h = node.height() * scaleY
						const pos = clampToStage(node.x(), node.y(), w, h)
						node.position(pos)

						setTextState(p => ({
							...p,
							x: pos.x,
							y: pos.y,
							width: nextWidth,
							fontSize: nextFont,
							rotation: node.rotation(),
						}))
					}}
				>
					{/* Подсветка области текста (по желанию) */}
					<Rect
						width={textState.width}
						height={undefined as unknown as number} // пусть подстраивается по тексту; можно убрать
						listening={false}
						fill='transparent'
					/>

					{/* Сам текст */}
					<KText
						text={textState.text}
						width={textState.width}
						fontSize={textState.fontSize}
						fontFamily={textState.fontFamily}
						fill={textState.fill}
						align={textState.align}
						padding={8}
						listening={false} // клики ловит группа
						// параметры переноса:
						wrap='word'
						ellipsis={false}
					/>
				</Group>

				{textState.selected && (
					<Transformer
						ref={trRef}
						rotateEnabled
						enabledAnchors={[
							'top-left',
							'top-right',
							'bottom-left',
							'bottom-right',
							'middle-right',
							'middle-left',
						]}
						anchorSize={8}
						boundBoxFunc={(oldBox, newBox) => {
							// запретим слишком маленький бокс
							if (newBox.width < 60 || newBox.height < 24) return oldBox
							return newBox
						}}
					/>
				)}
			</Layer>
		</Stage>
	)
}
