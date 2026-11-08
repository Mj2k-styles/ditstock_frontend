import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import Login from '../pages/Login'
import * as authApi from '../api/auth'

vi.mock('../api/auth')

function setup() {
  localStorage.clear()
  render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'a@b.sn')
  await userEvent.type(screen.getByLabelText(/mot de passe/i), 'secret')
  await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))
}

describe('Login', () => {
  it('affiche une erreur si les identifiants sont refusés', async () => {
    authApi.login.mockRejectedValue({ response: { status: 401 } })
    setup()
    await fillAndSubmit()
    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrect/i)
  })

  it('stocke les jetons après une connexion réussie', async () => {
    authApi.login.mockResolvedValue({
      access_token: 'a',
      refresh_token: 'r',
      user: { id: 1, full_name: 'Awa', role: 'admin' },
    })
    setup()
    await fillAndSubmit()
    await vi.waitFor(() => expect(localStorage.getItem('access_token')).toBe('a'))
  })
})
