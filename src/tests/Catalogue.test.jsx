import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { products, suppliers } from '../api/resources'
import { AuthProvider } from '../auth/AuthProvider'
import Products from '../pages/Products'
import Suppliers from '../pages/Suppliers'

vi.mock('../api/resources', () => ({
  products: {
    list: vi.fn(() =>
      Promise.resolve({
        items: [
          {
            id: 1, sku: 'VIS-1', name: 'Vis', unit: 'boîte', unit_price: '100', sale_price: '150',
            minimum_stock: 5, stock_total: 3, supplier_id: 7, category_id: null, image_url: null,
          },
        ],
        total: 1, page: 1, pages: 1,
      }),
    ),
    importCsv: vi.fn(() =>
      Promise.resolve({
        created: 2,
        skipped: [{ line: 3, sku: 'VIS-1', reason: 'SKU déjà existant' }],
        errors: [{ line: 4, sku: 'X', errors: { unit_price: ['Not a valid number.'] } }],
      }),
    ),
    create: vi.fn(), update: vi.fn(), remove: vi.fn(),
  },
  movements: { create: vi.fn() },
  categories: { list: vi.fn(() => Promise.resolve({ items: [] })) },
  suppliers: {
    list: vi.fn(() => Promise.resolve({ items: [{ id: 7, name: 'Sénégal Outils', contact: 'Awa' }], total: 1, page: 1, pages: 1 })),
    history: vi.fn(() =>
      Promise.resolve({
        items: [{
          id: 9, created_at: '2026-11-12T10:00:00', product_sku: 'VIS-1', product_name: 'Vis',
          warehouse_name: 'Central', quantity: 40, reference: 'BL-12',
        }],
        total: 1, page: 1, pages: 1,
      }),
    ),
    create: vi.fn(), update: vi.fn(), remove: vi.fn(),
  },
  warehouses: { list: vi.fn(() => Promise.resolve({ items: [{ id: 3, name: 'Central' }] })) },
}))

function renderPage(page, role = 'gestionnaire') {
  localStorage.setItem('user', JSON.stringify({ id: 1, full_name: 'Awa', role }))
  return render(
    <MemoryRouter>
      <AuthProvider>{page}</AuthProvider>
    </MemoryRouter>,
  )
}

describe('Produits', () => {
  beforeEach(() => vi.clearAllMocks())

  it('affiche prix de vente, fournisseur, unité et état du stock', async () => {
    renderPage(<Products />)
    const row = (await screen.findByText('VIS-1')).closest('tr')
    expect(within(row).getByText(/3 boîte/)).toBeInTheDocument()
    expect(within(row).getByText('Sous le seuil')).toBeInTheDocument()
    expect(await within(row).findByText('Sénégal Outils')).toBeInTheDocument()
  })

  it("envoie les filtres au serveur et revient à la page 1", async () => {
    renderPage(<Products />)
    await screen.findByText('VIS-1')
    await userEvent.selectOptions(screen.getByLabelText('État du stock'), 'rupture')
    expect(products.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, stock_state: 'rupture' }))
    await userEvent.selectOptions(await screen.findByLabelText('Fournisseur'), '7')
    expect(products.list).toHaveBeenLastCalledWith(expect.objectContaining({ supplier_id: 7, stock_state: 'rupture' }))
  })

  it("importe un CSV et affiche le rapport ligne par ligne", async () => {
    renderPage(<Products />)
    const file = new File(['sku;nom;prix_achat'], 'produits.csv', { type: 'text/csv' })
    await userEvent.upload(screen.getByLabelText('Fichier CSV de produits'), file)
    expect(products.importCsv).toHaveBeenCalledWith(file)
    const dialog = await screen.findByRole('dialog', { name: /résultat de l'import/i })
    expect(within(dialog).getByText('2')).toBeInTheDocument()
    expect(within(dialog).getByText(/SKU déjà existant/)).toBeInTheDocument()
    expect(within(dialog).getByText(/unit_price : Not a valid number/)).toBeInTheDocument()
  })

  it("cache l'import et la création au magasinier", async () => {
    renderPage(<Products />, 'magasinier')
    await screen.findByText('VIS-1')
    expect(screen.queryByRole('button', { name: /importer/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ajouter un produit/i })).not.toBeInTheDocument()
  })
})

describe('Fournisseurs', () => {
  it("affiche le contact et l'historique des approvisionnements", async () => {
    renderPage(<Suppliers />)
    expect(await screen.findByText('Awa')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Historique' }))
    const dialog = await screen.findByRole('dialog', { name: /approvisionnements — sénégal outils/i })
    expect(suppliers.history).toHaveBeenCalledWith(7, { page: 1, per_page: 10 })
    expect(await within(dialog).findByText('BL-12')).toBeInTheDocument()
    expect(within(dialog).getByText('VIS-1 — Vis')).toBeInTheDocument()
  })
})
