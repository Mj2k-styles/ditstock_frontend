import client from './client'

export async function login(email, password) {
  const { data } = await client.post('/auth/login', { email, password })
  return data
}

// Mot de passe oublié : l'API répond toujours de la même façon (e-mail connu ou non)
export const forgotPassword = (email) =>
  client.post('/auth/forgot-password', { email }).then((r) => r.data)

// Nouveau mot de passe à partir du lien reçu par e-mail
export const resetPassword = (token, password) =>
  client.post('/auth/reset-password', { token, password }).then((r) => r.data)

// Changement par l'utilisateur connecté
export const changePassword = (currentPassword, newPassword) =>
  client
    .post('/auth/change-password', { current_password: currentPassword, new_password: newPassword })
    .then((r) => r.data)
