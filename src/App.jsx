import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
import Forbidden from './pages/Forbidden'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Suppliers from './pages/Suppliers'
import Warehouses from './pages/Warehouses'
import Movements from './pages/Movements'
import Alerts from './pages/Alerts'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Audit from './pages/Audit'
import Account from './pages/Account'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { ROLES } from './utils/constants'

const { ADMIN, GESTIONNAIRE } = ROLES

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
      <Route path="/reinitialiser-mot-de-passe" element={<ResetPassword />} />

      {/* Tout ce qui suit exige d'être connecté */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="produits" element={<Products />} />
          <Route path="entrepots" element={<Warehouses />} />
          <Route path="mouvements" element={<Movements />} />
          <Route path="alertes" element={<Alerts />} />
          <Route path="mon-compte" element={<Account />} />
          <Route path="acces-refuse" element={<Forbidden />} />

          <Route element={<ProtectedRoute roles={[ADMIN, GESTIONNAIRE]} />}>
            <Route path="categories" element={<Categories />} />
            <Route path="fournisseurs" element={<Suppliers />} />
            <Route path="rapports" element={<Reports />} />
          </Route>

          <Route element={<ProtectedRoute roles={[ADMIN]} />}>
            <Route path="utilisateurs" element={<Users />} />
            <Route path="audit" element={<Audit />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Forbidden />} />
    </Routes>
  )
}
