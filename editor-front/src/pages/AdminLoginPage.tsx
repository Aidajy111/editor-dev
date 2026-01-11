import { useState } from 'react'
import { Alert, Button, Container, Stack, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.setToken)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const data = await login({ email, password })
      setToken(data.token)
      navigate('/admin', { replace: true })
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Ошибка входа'
      setError(String(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Вход администратора
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Введите e-mail и пароль, выданные разработчиком.
      </Typography>

      <form onSubmit={onSubmit}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            fullWidth
          />

          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            fullWidth
          />

          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Входим...' : 'Войти'}
          </Button>
        </Stack>
      </form>
    </Container>
  )
}
