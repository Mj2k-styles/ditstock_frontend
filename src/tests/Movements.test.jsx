import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import Movements from '../pages/Movements'
import { NOT_AVAILABLE_MESSAGE } from '../utils/format'

// Flask répond 404 « The requested URL was not found » : le module mouvements n'existe pas encore
const missing = { response: { status: 404, data: { message: 'The requested URL was not found on the server.' } } }

vi.mock('../api/resources', () => ({
  movements: { list: vi.fn(() => Promise.reject(missing)), create: vi.fn() },
  products: { list: vi.fn(() => Promise.resolve({ items: [], total: 0, page: 1, pages: 1 })) },
  categories: { list: vi.fn(() => Promise.resolve({ items: [] })) },
  suppliers: { list: vi.fn(() => Promise.resolve({ items: [] })) },
  warehouses: { list: vi.fn(() => Promise.resolve({ items: [] })) },
}))

describe('Movements', () => {
  it("affiche un avertissement et pas de formulaire quand l'API n'existe pas", async () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, full_name: 'Awa', role: 'admin' }))
    render(
      <MemoryRouter>
        <AuthProvider>
          <Movements />
        </AuthProvider>
      </MemoryRouter>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(/module « mouvements »/i)
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(NOT_AVAILABLE_MESSAGE).toMatch(/pas encore disponible/i)
  })
})
