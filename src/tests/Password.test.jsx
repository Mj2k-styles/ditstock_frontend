import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { changePassword, forgotPassword, resetPassword } from '../api/auth'
import { AuthProvider } from '../auth/AuthProvider'
import Account from '../pages/Account'
import ForgotPassword from '../pages/ForgotPassword'
import Login from '../pages/Login'
import ResetPassword from '../pages/ResetPassword'

vi.mock('../api/auth', () => ({
  login: vi.fn(),
  forgotPassword: vi.fn(() => Promise.resolve({ message: 'Si un compte actif correspond, un lien a été envoyé.' })),
  resetPassword: vi.fn(() => Promise.resolve({ message: 'Mot de passe modifié : vous pouvez vous connecter.' })),
  changePassword: vi.fn(() => Promise.resolve({ message: 'Mot de passe modifié avec succès' })),
}))

function renderAt(path, element, routePath = path.split('?')[0]) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path={routePath} element={element} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Mot de passe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('la page de connexion mène à « mot de passe oublié »', async () => {
    renderAt('/login', <Login />)
    await userEvent.click(screen.getByRole('link', { name: /mot de passe oublié/i }))
    expect(await screen.findByRole('heading', { name: /mot de passe oublié/i })).toBeInTheDocument()
  })

  it("demande un lien et affiche la réponse de l'API", async () => {
    renderAt('/mot-de-passe-oublie', <ForgotPassword />)
    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'awa@test.sn')
    await userEvent.click(screen.getByRole('button', { name: /envoyer le lien/i }))
    expect(forgotPassword).toHaveBeenCalledWith('awa@test.sn')
    expect(await screen.findByText(/un lien a été envoyé/i)).toBeInTheDocument()
  })

  it('réinitialise avec le jeton du lien', async () => {
    renderAt('/reinitialiser-mot-de-passe?token=abc.def', <ResetPassword />)
    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), 'NouveauSecret42')
    await userEvent.type(screen.getByLabelText(/confirmer/i), 'NouveauSecret42')
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
    expect(resetPassword).toHaveBeenCalledWith('abc.def', 'NouveauSecret42')
    expect(await screen.findByText(/vous pouvez vous connecter/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /se connecter/i })).toBeInTheDocument()
  })

  it('refuse deux mots de passe différents sans appeler l’API', async () => {
    renderAt('/reinitialiser-mot-de-passe?token=abc.def', <ResetPassword />)
    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), 'NouveauSecret42')
    await userEvent.type(screen.getByLabelText(/confirmer/i), 'AutreSecret42')
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
    expect(resetPassword).not.toHaveBeenCalled()
    expect(screen.getByText(/pas identiques/i)).toBeInTheDocument()
  })

  it('signale un lien sans jeton', () => {
    renderAt('/reinitialiser-mot-de-passe', <ResetPassword />)
    expect(screen.getByText(/lien incomplet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled()
  })

  it('affiche une erreur de l’API (lien expiré)', async () => {
    resetPassword.mockRejectedValueOnce({ response: { status: 400, data: { message: 'Lien invalide ou expiré' } } })
    renderAt('/reinitialiser-mot-de-passe?token=vieux', <ResetPassword />)
    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), 'NouveauSecret42')
    await userEvent.type(screen.getByLabelText(/confirmer/i), 'NouveauSecret42')
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
    expect(await screen.findByText(/lien invalide ou expiré/i)).toBeInTheDocument()
  })

  it("change le mot de passe depuis « Mon compte »", async () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, full_name: 'Awa', email: 'awa@test.sn', role: 'magasinier' }))
    renderAt('/mon-compte', <Account />)
    expect(screen.getByText('awa@test.sn')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/mot de passe actuel/i), 'Ancien123')
    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), 'NouveauSecret42')
    await userEvent.type(screen.getByLabelText(/confirmer/i), 'NouveauSecret42')
    await userEvent.click(screen.getByRole('button', { name: /changer le mot de passe/i }))
    expect(changePassword).toHaveBeenCalledWith('Ancien123', 'NouveauSecret42')
    expect(await screen.findByText(/modifié avec succès/i)).toBeInTheDocument()
  })
})
