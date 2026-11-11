import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { movements, products } from '../api/resources'
import Products from '../pages/Products'

vi.mock('../api/resources', () => ({
  products: {
    list: vi.fn(() => Promise.resolve({ items: [], total: 0, page: 1, pages: 1 })),
    create: vi.fn(() => Promise.resolve({ id: 42, sku: 'P-1', name: 'Clou' })),
    update: vi.fn(),
    remove: vi.fn(),
  },
  warehouseStocks: { list: vi.fn(() => Promise.resolve([])) },
  movements: { create: vi.fn(() => Promise.resolve({})) },
  categories: { list: vi.fn(() => Promise.resolve({ items: [] })) },
  suppliers: { list: vi.fn(() => Promise.resolve({ items: [] })) },
  warehouses: {
    list: vi.fn(() =>
      Promise.resolve({ items: [{ id: 3, name: 'Entrepôt A' }, { id: 4, name: 'Entrepôt B' }] }),
    ),
  },
}))

async function openForm() {
  localStorage.setItem('user', JSON.stringify({ id: 1, full_name: 'Awa', role: 'admin' }))
  render(
    <MemoryRouter>
      <AuthProvider>
        <Products />
      </AuthProvider>
    </MemoryRouter>,
  )
  await userEvent.click(await screen.findByRole('button', { name: /ajouter un produit/i }))
  await userEvent.type(screen.getByLabelText(/référence/i), 'P-1')
  await userEvent.type(screen.getByLabelText('Nom'), 'Clou')
  await userEvent.type(screen.getByLabelText(/prix unitaire/i), '10')
  await userEvent.type(screen.getByLabelText(/seuil minimal/i), '5')
}

describe('Products — stock initial', () => {
  beforeEach(() => vi.clearAllMocks())

  it('affiche une quantité par entrepôt', async () => {
    await openForm()
    expect(await screen.findByLabelText('Entrepôt A')).toBeInTheDocument()
    expect(screen.getByLabelText('Entrepôt B')).toBeInTheDocument()
  })

  it('crée le produit puis enregistre chaque quantité comme une ENTRÉE', async () => {
    await openForm()
    await userEvent.type(await screen.findByLabelText('Entrepôt A'), '25')
    await userEvent.type(screen.getByLabelText('Entrepôt B'), '8')
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))

    // Le stock initial n'est pas envoyé à /products/ (le schéma Marshmallow le refuserait)
    expect(products.create).toHaveBeenCalledTimes(1)
    expect(products.create.mock.calls[0][0]).not.toHaveProperty('initial_stock')
    expect(movements.create).toHaveBeenCalledTimes(2)
    expect(movements.create).toHaveBeenCalledWith({
      type: 'ENTREE',
      product_id: 42,
      warehouse_id: 3,
      quantity: 25,
      reason: null,
      reference: 'Stock initial',
    })
    expect(movements.create).toHaveBeenCalledWith(expect.objectContaining({ warehouse_id: 4, quantity: 8 }))
  })

  it("n'enregistre aucun mouvement quand aucune quantité n'est saisie", async () => {
    await openForm()
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
    expect(products.create).toHaveBeenCalled()
    expect(movements.create).not.toHaveBeenCalled()
  })

  it("signale l'échec d'une entrée sans recréer le produit", async () => {
    movements.create.mockRejectedValueOnce({ response: { status: 400, data: { message: 'Quantité invalide' } } })
    await openForm()
    await userEvent.type(await screen.findByLabelText('Entrepôt A'), '25')
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
    expect(await screen.findByText(/stock initial n'a pas été enregistré/i)).toBeInTheDocument()
    expect(products.create).toHaveBeenCalledTimes(1)
  })
})
