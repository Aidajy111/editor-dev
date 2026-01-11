import { AppBar, Toolbar, Typography, Button, Badge } from '@mui/material'
import { NavLink } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { Link as RouterLink } from 'react-router-dom'

function Header() {
	const count = useCartStore((s) => s.items.length)
	return (
		<AppBar position='static' sx={{ marginBottom: '30px' }}>
			<Toolbar>
				<Typography variant='h6' sx={{ flexGrow: 1 }}>
					CASE PLACE
				</Typography>
				<Button color="inherit" component={RouterLink} to="/admin">
					Админ
				</Button>
				<Button component={NavLink} to='/' color='inherit'>
					Главная
				</Button>
				<Button component={NavLink} to='/editor' color='inherit'>
					Создать свой чехол
				</Button>
				<Button color="inherit" component={RouterLink} to="/cart">
					Корзина {count > 0 ? `(${count})` : ''}
				</Button>
			</Toolbar>
		</AppBar>
	)
}

export default Header
