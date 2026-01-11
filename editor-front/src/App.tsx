import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import EditorPage from './pages/EditorPage'
import CartPage from './pages/CartPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminPage from './pages/AdminPage'
import { RequireAuth } from './components/RequireAuth'
import CheckoutPage from './pages/CheckoutPage'

function App() {
	return (
		<Routes>
			<Route element={<MainLayout />}>
				<Route index element={<Home />} />
				<Route path='home' element={<Navigate to='/' replace />} />
				<Route path='editor' element={<EditorPage />} />
				<Route path='*' element={<NotFound />} />
				<Route path="/cart" element={<CartPage />} />
				<Route path="/admin/login" element={<AdminLoginPage />} />
				<Route
					path="/admin"
					element={
						<RequireAuth>
						<AdminPage />
						</RequireAuth>
					}
				/>
				<Route path="/checkout" element={<CheckoutPage />} />
			</Route>
		</Routes>
	)
}
export default App
