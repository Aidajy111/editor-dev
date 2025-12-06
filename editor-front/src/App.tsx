import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import EditorPage from './pages/EditorPage'

function App() {
	return (
		<Routes>
			<Route element={<MainLayout />}>
				<Route index element={<Home />} />
				<Route path='home' element={<Navigate to='/' replace />} />
				<Route path='editor' element={<EditorPage />} />
				<Route path='*' element={<NotFound />} />
			</Route>
		</Routes>
	)
}
export default App
