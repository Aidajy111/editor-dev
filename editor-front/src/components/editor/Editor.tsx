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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill'
import FlipIcon from '@mui/icons-material/Flip'
import Rotate90DegreesCwIcon from '@mui/icons-material/Rotate90DegreesCw'
import { Stage, Layer, Image as KImage, Text as KText, Transformer, Rect } from 'react-konva'
import styles from './Editor.module.scss'
import { putAsset, getAsset } from '../../storage/assetsDb'

const FONTS = [
  'Arial',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Courier New',
  'Brush Script MT',
  'Comic Sans MS',
  'Impact',
  'Lucida Console',
  'Palatino',
  'Garamond',
  'Bookman',
  'Helvetica'
]

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

function usePreloadAssets(assetIds: string[]) {
  const [images, setImages] = useState<Record<string, HTMLImageElement | undefined>>({})

  useEffect(() => {
    let cancelled = false
    const urlsToRevoke: string[] = []

    async function run() {
      for (const id of assetIds) {
        if (!id) continue
        if (images[id]) continue

        const asset = await getAsset(id)
        if (!asset) continue

        const objectUrl = URL.createObjectURL(asset.blob)
        urlsToRevoke.push(objectUrl)

        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = objectUrl

        await new Promise<void>((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
        })

        if (cancelled) return

        setImages((prev) => (prev[id] ? prev : { ...prev, [id]: img }))
      }
    }

    run()

    return () => {
      cancelled = true
      for (const u of urlsToRevoke) URL.revokeObjectURL(u)
    }
  }, [assetIds.join('|')])

  return images
}

function useAssetUrl(assetId?: string) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    let active = true
    let objectUrl = ''

    async function run() {
      if (!assetId) return
      const asset = await getAsset(assetId)
      if (!asset) return
      objectUrl = URL.createObjectURL(asset.blob)
      if (active) setUrl(objectUrl)
    }

    run()

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [assetId])

  return url
}

export type TextEl = {
  id: number
  type: 'text'
  x: number
  y: number
  text: string
  fontSize: number
  fontFamily: string
  fill: string
  rotation: number
}

export type ImageEl = {
  id: number
  type: 'image'
  x: number
  y: number
  assetId: string
  width: number
  height: number
  rotation: number
  cornerRadius: number
  flipX: boolean
  flipY: boolean
}

export type CanvasElement = TextEl | ImageEl

type EditorProps = {
  model: {
    id: number
    name: string
    image: string
    camera: string
    edges: string
  }
  onAddToCart?: (payload: {
    model: EditorProps['model']
    elements: CanvasElement[]
    bgColor: string
    bgEnabled: boolean
    previewAssetId: string
  }) => void
}

function LayerThumb({ assetId }: { assetId: string }) {
  const url = useAssetUrl(assetId)
  return (
    <img
      src={url || '/fallback-icon.png'}
      alt="thumb"
      className={styles.LayerThumb}
      onError={(e) => {
        ;(e.currentTarget as HTMLImageElement).src = '/fallback-icon.png'
      }}
    />
  )
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}

export default function Editor({ model, onAddToCart }: EditorProps) {
  const STAGE_W = 420
  const STAGE_H = 820

  const stageRef = useRef<any>(null)
  const trRef = useRef<any>(null)

  const phoneImage = useImage(model?.image)
  const phoneCamera = useImage(model?.camera)
  const phoneEdges = useImage(model?.edges)

  const [elements, setElements] = useState<CanvasElement[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [bgEnabled, setBgEnabled] = useState(false)

  const handleAddText = () => {
    const id = Date.now()
    const newText: TextEl = {
      id,
      type: 'text',
      x: 100,
      y: 200,
      text: 'Новый текст',
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#000000',
      rotation: 0,
    }
    setElements((p) => [...p, newText])
    setSelectedId(id)
  }

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const file = input.files?.[0]
    if (!file) return
    input.value = ''

    const assetId = crypto.randomUUID()

    await putAsset({
      id: assetId,
      blob: file,
      mime: file.type || 'image/png',
      createdAt: Date.now(),
    })

    const tempUrl = URL.createObjectURL(file)
    const img = new Image()
    img.src = tempUrl

    img.onload = () => {
      const elId = Date.now()
      const maxWidth = 200
      const aspectRatio = img.width / img.height
      const newWidth = img.width > maxWidth ? maxWidth : img.width
      const newHeight = newWidth / aspectRatio

      const newEl: ImageEl = {
        id: elId,
        type: 'image',
        x: 50,
        y: 50,
        assetId,
        width: newWidth,
        height: newHeight,
        rotation: 0,
        cornerRadius: 0,
        flipX: false,
        flipY: false,
      }

      setElements((p) => [...p, newEl])
      setSelectedId(elId)
      URL.revokeObjectURL(tempUrl)
    }

    img.onerror = () => {
      URL.revokeObjectURL(tempUrl)
    }
  }

  const updateElementById = (id: number | null, updates: Partial<CanvasElement>) => {
    if (id === null) return
    setElements((prev) =>
      prev.map((el) => (el.id === id ? ({ ...el, ...updates } as CanvasElement) : el))
    )
  }

  const removeEl = (id: number) => {
    setElements((prev) => prev.filter((e) => e.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const moveUp = (id: number) => {
    setElements((prev) => {
      const i = prev.findIndex((e) => e.id === id)
      if (i < 0 || i === prev.length - 1) return prev
      const arr = prev.slice()
      ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
      return arr
    })
  }

  const moveDown = (id: number) => {
    setElements((prev) => {
      const i = prev.findIndex((e) => e.id === id)
      if (i <= 0) return prev
      const arr = prev.slice()
      ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
      return arr
    })
  }

  const selectedElement = elements.find((el) => el.id === selectedId) || null

  const assetIds = useMemo(() => {
    return elements
      .filter((e) => e.type === 'image')
      .map((e) => (e as ImageEl).assetId)
  }, [elements])

  const imagesMap = usePreloadAssets(assetIds)

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

  const makePreview = () => {
    if (!stageRef.current) return ''
    return stageRef.current.toDataURL({
      pixelRatio: 0.6,
      mimeType: 'image/jpeg',
      quality: 0.7,
    })
  }

  const handleAddToCart = async () => {
    const previewDataUrl = makePreview()
    if (!previewDataUrl) return

    const previewBlob = await dataUrlToBlob(previewDataUrl)
    const previewAssetId = crypto.randomUUID()

    await putAsset({
      id: previewAssetId,
      blob: previewBlob,
      mime: 'image/jpeg',
      createdAt: Date.now(),
    })

    onAddToCart?.({
      model,
      elements,
      bgColor,
      bgEnabled,
      previewAssetId,
    })
  }

  const handleFlipChange = (flipType: 'flipX' | 'flipY') => {
    if (!selectedElement || selectedElement.type !== 'image') return
    const currentFlip = (selectedElement as ImageEl)[flipType]
    updateElementById(selectedId, { [flipType]: !currentFlip })
  }

  const applyQuickRotation = (degrees: number) => {
    updateElementById(selectedId, { rotation: degrees })
  }

  return (
    <div className={styles.editorWrapper}>
      <div className={styles.editorMainBlock}>
        {/* Слои */}
        <div className={styles.layersBlock}>
          <div className={styles.buttonsWrapper}>
            <div className={styles.toolbar}>
              <Button variant="outlined" onClick={handleAddText}>
                + Текст
              </Button>

              <Button variant="outlined" component="label">
                + Изображение
                <input type="file" accept="image/*" hidden onChange={handleAddImage} />
              </Button>
            </div>
            <Button variant="contained" onClick={handleAddToCart} disabled={!model || elements.length === 0}>
              Добавить в корзину
            </Button>
          </div>

          {elements.length > 0 ? (
            <div className={styles.layersWrapper}>
              <Typography variant="h6" sx={{ mb: 1 }}>
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
                {[...elements].reverse().map((el) => {
                  const isSelected = selectedId === el.id
                  const title = el.type === 'text' ? (el as TextEl).text : 'Изображение'

                  return (
                    <ListItemButton
                      key={el.id}
                      selected={isSelected}
                      onClick={() => setSelectedId(el.id)}
                      sx={{ py: 0.5 }}
                    >
                      <div className={styles.LayerIcon}>
                        {isImageEl(el) ? (
                          <LayerThumb assetId={el.assetId} />
                        ) : (
                          <span className={styles.TextIcon}>T</span>
                        )}
                      </div>

                      <ListItemText primary={title} secondary={el.type} />

                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          title="Вверх (поверх)"
                          onClick={(ev) => {
                            ev.stopPropagation()
                            moveUp(el.id)
                          }}
                        >
                          <ArrowUpwardIcon fontSize="inherit" />
                        </IconButton>

                        <IconButton
                          size="small"
                          title="Вниз (под)"
                          onClick={(ev) => {
                            ev.stopPropagation()
                            moveDown(el.id)
                          }}
                        >
                          <ArrowDownwardIcon fontSize="inherit" />
                        </IconButton>

                        <IconButton
                          size="small"
                          color="error"
                          title="Удалить"
                          onClick={(ev) => {
                            ev.stopPropagation()
                            removeEl(el.id)
                          }}
                        >
                          <DeleteOutlineIcon fontSize="inherit" />
                        </IconButton>
                      </Stack>
                    </ListItemButton>
                  )
                })}
              </List>
            </div>
          ) : (
            <div style={{ margin: '10px 0 0 0' }}>Загрузите картинку или текст</div>
          )}
        </div>

        {/* Рабочая область */}
        <div className={styles.workspace}>
          <div className={styles.canvasWrapper} style={{ flex: '0 0 auto' }}>
            <Stage
              width={STAGE_W}
              height={STAGE_H}
              ref={stageRef}
              onMouseDown={(e) => {
                const isStage = e.target === e.target.getStage()
                if (isStage) setSelectedId(null)
              }}
            >
              {/* Слой 1: телефон */}
              <Layer listening={false}>
                {phoneImage && <KImage image={phoneImage} width={STAGE_W} height={STAGE_H} />}
              </Layer>

              {/* Слой 2: фон (если включен) */}
              <Layer listening={false}>
                <Rect
                  x={0}
                  y={0}
                  width={STAGE_W}
                  height={STAGE_H}
                  fill={bgEnabled ? bgColor : 'transparent'}
                  listening={false}
                />
              </Layer>

              {/* Слой 3: пользовательский контент */}
              <Layer>
                {elements.map((el) => {
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
                        fontFamily={t.fontFamily}
                        fill={t.fill}
                        rotation={t.rotation}
                        draggable
                        onClick={() => setSelectedId(t.id)}
                        onTap={() => setSelectedId(t.id)}
                        onDragEnd={(e) =>
                          updateElementById(t.id, { x: e.target.x(), y: e.target.y() })
                        }
                        onTransformEnd={(e) => {
                          const node = e.target
                          const scaleX = node.scaleX() ?? 1
                          const newFontSize = Math.max(8, Math.round(t.fontSize * scaleX))

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

                  const im = el as ImageEl
                  const imgEl = imagesMap[im.assetId]

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
                      cornerRadius={im.cornerRadius}
                      draggable
                      onClick={() => setSelectedId(im.id)}
                      onTap={() => setSelectedId(im.id)}
                      onDragEnd={(e) =>
                        updateElementById(im.id, { x: e.target.x(), y: e.target.y() })
                      }
                      onTransformEnd={(e) => {
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

              {/* Слой 4: оверлеи (камера, края) */}
              <Layer listening={false}>
                {phoneCamera && <KImage image={phoneCamera} width={STAGE_W} height={STAGE_H} />}
                {phoneEdges && <KImage image={phoneEdges} width={STAGE_W} height={STAGE_H} />}
              </Layer>
            </Stage>
          </div>
        </div>

        {/* Правая колонка: свойства (всегда активна) */}
        <div className={styles.propertiesPanel}>
          {!selectedElement ? (
            // Панель когда ничего не выбрано - только фон
            <div className={styles.featuresBlock}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormatColorFillIcon /> Фон телефона
              </Typography>

              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Button
                  variant={bgEnabled ? "contained" : "outlined"}
                  onClick={() => setBgEnabled(!bgEnabled)}
                  startIcon={<FormatColorFillIcon />}
                >
                  {bgEnabled ? 'Скрыть фон' : 'Показать фон'}
                </Button>
              </Stack>

              {bgEnabled && (
                <>
                  <Typography sx={{ mb: 1 }}>Цвет фона</Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ width: 120 }}
                    />
                    <Button size="small" onClick={() => setBgColor('#ffffff')}>
                      Белый
                    </Button>
                    <Button size="small" onClick={() => setBgColor('#000000')}>
                      Чёрный
                    </Button>
                  </Stack>
                </>
              )}
            </div>
          ) : selectedElement.type === 'text' ? (
            // Панель для текста
            <div className={styles.featuresBlock}>
              <Typography variant="h6">Настройки текста</Typography>

              <TextField
                label="Текст"
                fullWidth
                value={(selectedElement as TextEl).text}
                onChange={(e) => updateElementById(selectedElement.id, { text: e.target.value })}
                sx={{ mb: 2, mt: 1 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Шрифт</InputLabel>
                <Select
                  value={(selectedElement as TextEl).fontFamily}
                  label="Шрифт"
                  onChange={(e) => {
                    updateElementById(selectedElement.id, { 
                      fontFamily: e.target.value as string 
                    })
                  }}
                >
                  {FONTS.map((font) => (
                    <MenuItem key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography>Размер шрифта</Typography>
              <Slider
                min={10}
                max={100}
                value={(selectedElement as TextEl).fontSize}
                onChange={(_, val) => updateElementById(selectedElement.id, { fontSize: val as number })}
                sx={{ mb: 2 }}
              />

              <Typography>Цвет текста</Typography>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <TextField
                  label="Цвет"
                  type="color"
                  value={(selectedElement as TextEl).fill}
                  onChange={(e) => updateElementById(selectedElement.id, { fill: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 120 }}
                />
                <Button size="small" onClick={() => updateElementById(selectedElement.id, { fill: '#000000' })}>
                  Чёрный
                </Button>
              </Stack>

              <Typography>Поворот</Typography>
              <Slider
                min={-180}
                max={180}
                value={(selectedElement as TextEl).rotation}
                onChange={(_, val) => updateElementById(selectedElement.id, { rotation: val as number })}
              />
            </div>
          ) : (
            // Панель для изображения
            <div className={styles.featuresBlock}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Настройки изображения
              </Typography>

              <Typography>Ширина</Typography>
              <Slider
                min={20}
                max={800}
                value={(selectedElement as ImageEl).width}
                onChange={(_, val) => updateElementById(selectedElement.id, { width: val as number })}
                sx={{ mb: 2 }}
              />

              <Typography>Высота</Typography>
              <Slider
                min={20}
                max={1200}
                value={(selectedElement as ImageEl).height}
                onChange={(_, val) => updateElementById(selectedElement.id, { height: val as number })}
                sx={{ mb: 2 }}
              />

              <Typography>Поворот</Typography>
              <Slider
                min={-180}
                max={180}
                value={(selectedElement as ImageEl).rotation}
                onChange={(_, val) => updateElementById(selectedElement.id, { rotation: val as number })}
                sx={{ mb: 2 }}
              />

              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button 
                  size="small" 
                  startIcon={<Rotate90DegreesCwIcon />}
                  onClick={() => applyQuickRotation(0)}
                  variant={(selectedElement as ImageEl).rotation === 0 ? "contained" : "outlined"}
                >
                  0°
                </Button>
                <Button 
                  size="small" 
                  startIcon={<Rotate90DegreesCwIcon />}
                  onClick={() => applyQuickRotation(90)}
                  variant={(selectedElement as ImageEl).rotation === 90 ? "contained" : "outlined"}
                >
                  90°
                </Button>
                <Button 
                  size="small" 
                  startIcon={<Rotate90DegreesCwIcon />}
                  onClick={() => applyQuickRotation(180)}
                  variant={(selectedElement as ImageEl).rotation === 180 ? "contained" : "outlined"}
                >
                  180°
                </Button>
                <Button 
                  size="small" 
                  startIcon={<Rotate90DegreesCwIcon />}
                  onClick={() => applyQuickRotation(270)}
                  variant={(selectedElement as ImageEl).rotation === 270 ? "contained" : "outlined"}
                >
                  270°
                </Button>
              </Stack>

              <Typography sx={{ mb: 1 }}>Отражение</Typography>
              <ToggleButtonGroup
                value={[
                  (selectedElement as ImageEl).flipX ? 'flipX' : '',
                  (selectedElement as ImageEl).flipY ? 'flipY' : '',
                ].filter(Boolean)}
                onChange={(_, values) => {
                  updateElementById(selectedId, { 
                    flipX: values.includes('flipX'),
                    flipY: values.includes('flipY')
                  })
                }}
                sx={{ mb: 2 }}
              >
                <ToggleButton value="flipX" title="Отразить по горизонтали">
                  <FlipIcon />
                </ToggleButton>
                <ToggleButton value="flipY" title="Отразить по вертикали">
                  <FlipIcon style={{ transform: 'rotate(90deg)' }} />
                </ToggleButton>
              </ToggleButtonGroup>

              <Typography>Скругление углов</Typography>
              <Slider
                min={0}
                max={50}
                value={(selectedElement as ImageEl).cornerRadius}
                onChange={(_, val) => updateElementById(selectedElement.id, { 
                  cornerRadius: val as number 
                })}
                sx={{ mb: 1 }}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}px`}
              />
              <Stack direction="row" spacing={1}>
                <Button 
                  size="small" 
                  onClick={() => updateElementById(selectedElement.id, { cornerRadius: 0 })}
                  variant={(selectedElement as ImageEl).cornerRadius === 0 ? "contained" : "outlined"}
                >
                  Острые
                </Button>
                <Button 
                  size="small" 
                  onClick={() => updateElementById(selectedElement.id, { cornerRadius: 10 })}
                  variant={(selectedElement as ImageEl).cornerRadius === 10 ? "contained" : "outlined"}
                >
                  Средние
                </Button>
                <Button 
                  size="small" 
                  onClick={() => updateElementById(selectedElement.id, { cornerRadius: 25 })}
                  variant={(selectedElement as ImageEl).cornerRadius === 25 ? "contained" : "outlined"}
                >
                  Круглые
                </Button>
              </Stack>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}