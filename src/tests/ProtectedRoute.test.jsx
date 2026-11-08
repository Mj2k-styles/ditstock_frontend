import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../auth/AuthContext'
import ProtectedRoute from '../auth/ProtectedRoute'

function renderWith(user, roles) {
  const value = { user, hasRole: (...r) => !!user && r.includes(user.role) }
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/secret']}>
        <Routes>
          <Route path="/login" element={<p>Page de connexion</p>} />
          <Route path="/acces-refuse" element={<p>Accès refusé</p>} />
          <Route element={<ProtectedRoute roles={roles} />}>
            <Route path="/secret" element={<p>Contenu secret</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('ProtectedRoute', () => {
  it('redirige vers /login si non connecté', () => {
    renderWith(null)
    expect(screen.getByText('Page de connexion')).toBeInTheDocument()
  })
  it('refuse un rôle non autorisé', () => {
    renderWith({ role: 'magasinier' }, ['admin'])
    expect(screen.getByText('Accès refusé')).toBeInTheDocument()
  })
  it('autorise un rôle autorisé', () => {
    renderWith({ role: 'admin' }, ['admin'])
    expect(screen.getByText('Contenu secret')).toBeInTheDocument()
  })
})
