import { Button, Card, CardContent, Typography, Stack } from '@mui/material'
import { useCartStore } from '../store/cartStore'
import { useEffect, useState } from 'react'
import { getAsset } from '../storage/assetsDb'
import { useNavigate } from 'react-router-dom'

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const clear = useCartStore((s) => s.clear)
  const navigate = useNavigate()

  return (
    <div style={{ padding: 16 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Корзина</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={clear} disabled={items.length === 0}>
            Очистить
          </Button>
          <Button
            variant="contained"
            disabled={items.length === 0}
            onClick={() => navigate('/checkout')}
          >
            Оформить заказ
          </Button>
        </Stack>
      </Stack>

      {items.length === 0 ? (
        <Typography color="text.secondary">Корзина пустая</Typography>
      ) : (
        <Stack spacing={2}>
          {items.map((item) => (
            <Card key={item.id} variant="outlined">
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <CartPreview assetId={item.previewAssetId} />
                  <div style={{ flex: 1 }}>
                    <Typography variant="h6">{item.model.name}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      Элементов: {item.elements.length}
                    </Typography>
                  </div>
                  <Button color="error" onClick={() => removeItem(item.id)}>
                    Удалить
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </div>
  )
}

export function CartPreview({ assetId }: { assetId: string }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    let active = true
    let objectUrl = ''

    ;(async () => {
      const asset = await getAsset(assetId)
      if (!asset) return
      objectUrl = URL.createObjectURL(asset.blob)
      if (active) setUrl(objectUrl)
    })()

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [assetId])

  return <img src={url || '/fallback-icon.png'} style={{ width: 120, height: 'auto' }} />
}