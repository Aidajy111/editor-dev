import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { getAsset } from '../storage/assetsDb'
import { createOrderMultipart } from '../api/orders'
import type { CheckoutForm } from '../types/order'
import { CartPreview } from './CartPage' // если CartPreview экспортируется из CartPage
// лучше позже вынести CartPreview в отдельный компонент, но пока можно так

export default function CheckoutPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const clear = useCartStore((s) => s.clear)

  const [form, setForm] = useState<CheckoutForm>({
    name: '',
    email: '',
    phone: '',
    comment: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    if (items.length === 0) return false
    if (!form.name.trim()) return false
    if (!form.email.trim()) return false
    if (!form.phone.trim()) return false
    return true
  }, [items.length, form])

  const onChange =
    (key: keyof CheckoutForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
    }

  const onSubmit = async (e: React.FormEvent) => {
    const payload = {
    customer: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        comment: form.comment?.trim() || '',
    },
    items,
    }

    const fd = new FormData()

    // 1) JSON payload (без файлов)
    fd.append('payload', JSON.stringify(payload))

    // 2) Превьюшки
    for (const item of items) {
    const prev = await getAsset(item.previewAssetId)
    if (prev) {
        fd.append(
        'files',
        new File([prev.blob], `preview_${item.id}.jpg`, { type: prev.mime || 'image/jpeg' })
        )
    }

    // 3) Все картинки внутри элементов (уникальные assetId)
    const ids = Array.from(
        new Set(item.elements.filter((e: any) => e.type === 'image').map((e: any) => e.assetId))
    )

    for (const id of ids) {
        const a = await getAsset(id)
        if (!a) continue
        const ext = (a.mime || '').includes('png') ? 'png' : (a.mime || '').includes('webp') ? 'webp' : 'jpg'
        fd.append(
        'files',
        new File([a.blob], `asset_${id}.${ext}`, { type: a.mime || 'application/octet-stream' })
        )
    }
    }

    // отправка
    const resp = await createOrderMultipart(fd)
  }

  if (items.length === 0 && !success) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Оформление заказа
        </Typography>
        <Alert severity="info">
          Корзина пустая. Добавьте макет в корзину.
        </Alert>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/')}>
          Перейти в редактор
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Оформление заказа
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
        {/* Левая колонка: форма */}
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Контакты
            </Typography>

            <form onSubmit={onSubmit}>
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}

                <TextField
                  label="Имя"
                  value={form.name}
                  onChange={onChange('name')}
                  required
                  fullWidth
                />

                <TextField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={onChange('email')}
                  required
                  fullWidth
                />

                <TextField
                  label="Телефон"
                  value={form.phone}
                  onChange={onChange('phone')}
                  required
                  fullWidth
                />

                <TextField
                  label="Комментарий"
                  value={form.comment}
                  onChange={onChange('comment')}
                  fullWidth
                  multiline
                  minRows={3}
                />

                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" onClick={() => navigate('/cart')}>
                    Назад в корзину
                  </Button>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!canSubmit || loading}
                  >
                    {loading ? 'Отправляем...' : 'Отправить заказ'}
                  </Button>
                </Stack>
              </Stack>
            </form>
          </CardContent>
        </Card>

        {/* Правая колонка: итог */}
        <Card variant="outlined" sx={{ width: { xs: '100%', md: 360 } }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Ваш заказ ({items.length})
            </Typography>

            <Stack spacing={1.5}>
              {items.map((item) => (
                <Stack
                  key={item.id}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                >
                  <CartPreview assetId={item.previewAssetId} />
                  <div>
                    <Typography variant="subtitle2">{item.model.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Элементов: {item.elements.length}
                    </Typography>
                  </div>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  )
}
