import { AppBar, Toolbar, Typography, Button } from '@mui/material'
import { NavLink } from 'react-router-dom'

function Header() {
	return (
		<AppBar position='static' sx={{ marginBottom: '30px' }}>
			<Toolbar>
				<Typography variant='h6' sx={{ flexGrow: 1 }}>
					CASE PLACE
				</Typography>
				<Button component={NavLink} to='/' color='inherit'>
					Главная
				</Button>
				<Button component={NavLink} to='/editor' color='inherit'>
					Создать свой чехол
				</Button>
			</Toolbar>
		</AppBar>
	)
}

export default Header
