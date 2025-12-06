import { Image as KImage } from 'react-konva'
import useImage from 'use-image'

type Props = {
	id: number
	src: string
	x: number
	y: number
	width: number
	height: number
	rotation: number
	draggable?: boolean
	onClick?: () => void
	onDragEnd?: (pos: { x: number; y: number }) => void
}

export default function ImageElement(props: Props) {
	const [img] = useImage(props.src, 'anonymous')

	if (!img) return null
	return (
		<KImage
			id={String(props.id)}
			image={img}
			x={props.x}
			y={props.y}
			width={props.width}
			height={props.height}
			rotation={props.rotation}
			draggable={props.draggable}
			onClick={props.onClick}
			onDragEnd={e => props.onDragEnd?.({ x: e.target.x(), y: e.target.y() })}
		/>
	)
}
