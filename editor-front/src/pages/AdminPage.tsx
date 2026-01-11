import { Button, Container, Stack, Typography } from '@mui/material'
import { useAuthStore } from '../store/authStore'

export default function AdminPage() {
  const logout = useAuthStore((s) => s.logout)

  return (
    <Container sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Админка</Typography>
        <Button color="error" variant="outlined" onClick={logout}>
          Выйти
        </Button>
      </Stack>

      <Typography sx={{ mt: 2 }} color="text.secondary">
        Тут дальше будет управление брендами/моделями и просмотр заказов.
      </Typography>
    </Container>
  )
}
