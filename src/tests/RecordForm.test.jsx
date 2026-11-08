import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import RecordForm from '../components/RecordForm'

const fields = [
  { name: 'name', label: 'Nom', required: true },
  { name: 'phone', label: 'Téléphone' },
  { name: 'email', label: 'E-mail', type: 'email' },
  { name: 'address', label: 'Adresse', type: 'textarea' },
]

describe('RecordForm', () => {
  it('envoie null (et non "") pour les champs optionnels vides', async () => {
    // Le backend refuse email="" (validation Marshmallow) mais accepte email=null
    const onSubmit = vi.fn().mockResolvedValue()
    render(<RecordForm title="Fournisseur" fields={fields} onSubmit={onSubmit} onClose={() => {}} />)
    await userEvent.type(screen.getByLabelText('Nom'), 'Dakar Fournitures')
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Dakar Fournitures',
      phone: null,
      email: null,
      address: null,
    })
  })

  it('conserve les valeurs saisies', async () => {
    const onSubmit = vi.fn().mockResolvedValue()
    render(<RecordForm title="Fournisseur" fields={fields} onSubmit={onSubmit} onClose={() => {}} />)
    await userEvent.type(screen.getByLabelText('Nom'), 'F1')
    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.sn')
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'F1', email: 'a@b.sn', phone: null }))
  })

  it("n'envoie pas un mot de passe vide lors d'une modification (omitIfEmpty)", async () => {
    const onSubmit = vi.fn().mockResolvedValue()
    const f = [
      { name: 'full_name', label: 'Nom complet', required: true },
      { name: 'password', label: 'Mot de passe', type: 'password', requiredOnNew: true, omitIfEmpty: true },
    ]
    render(<RecordForm title="Utilisateur" fields={f} initial={{ id: 2, full_name: 'Awa' }} onSubmit={onSubmit} onClose={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
    expect(onSubmit).toHaveBeenCalledWith({ full_name: 'Awa' })
  })
})
