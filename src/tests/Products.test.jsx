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
  warehouses: { list: vi.fn(() => Promise.resolve({ items: [{ id: 3, name: 'Entrepôt A' }] })) },
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

  it("crée le produit puis enregistre le stock initial comme une ENTRÉE", async () => {
    await openForm()
    await userEvent.selectOptions(await screen.findByLabelText(/entrepôt du stock initial/i), '3')
    await userEvent.type(screen.getByLabelText(/quantité initiale/i), '25')
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))

    // Les champs de stock ne sont pas envoyés à /products/ (le schéma Marshmallow les refuserait)
    expect(products.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ initial_quantity: expect.anything() }),
    )
    expect(movements.create).toHaveBeenCalledWith({
      type: 'ENTREE',
      product_id: 42,
      warehouse_id: 3,
      quantity: 25,
      reason: null,
      reference: 'Stock initial',
    })
  })

  it("n'enregistre aucun mouvement quand la quantité est vide", async () => {
    await openForm()
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
    expect(products.create).toHaveBeenCalled()
    expect(movements.create).not.toHaveBeenCalled()
  })

  it("refuse une quantité sans entrepôt, sans créer le produit", async () => {
    await openForm()
    await userEvent.type(screen.getByLabelText(/quantité initiale/i), '10')
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
    expect(await screen.findByText(/choisissez un entrepôt/i)).toBeInTheDocument()
    expect(products.create).not.toHaveBeenCalled()
  })
})
