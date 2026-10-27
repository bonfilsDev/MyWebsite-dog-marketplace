import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ScrollToTop } from './components/ScrollToTop'
import { Home } from './pages/Home'
import { Browse } from './pages/Browse'
import { DogDetail } from './pages/DogDetail'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { SellerDashboard } from './pages/SellerDashboard'
import { ListingFormPage } from './pages/ListingFormPage'
import { AdminDashboard } from './pages/AdminDashboard'
import { NotFound } from './pages/NotFound'

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dogs" element={<Browse />} />
          <Route path="dogs/:id" element={<DogDetail />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          <Route
            path="dashboard"
            element={
              <ProtectedRoute roles={['seller', 'admin']}>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/listings/new"
            element={
              <ProtectedRoute roles={['seller', 'admin']}>
                <ListingFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/listings/:id/edit"
            element={
              <ProtectedRoute roles={['seller', 'admin']}>
                <ListingFormPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/listings/:id/edit"
            element={
              <ProtectedRoute roles={['admin']}>
                <ListingFormPage adminMode />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}
