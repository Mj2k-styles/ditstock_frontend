import CrudPage from '../components/CrudPage'
import { Badge } from '../components/ui'
import { users } from '../api/resources'
import { useAuth } from '../hooks/useAuth'
import { ROLES, ROLE_LABELS } from '../utils/constants'

const roleOptions = Object.values(ROLES).map((r) => ({ value: r, label: ROLE_LABELS[r] }))

export default function Users() {
  const { user: me } = useAuth()
  return (
    <CrudPage
      title="Utilisateurs"
      singular="un utilisateur"
      api={users}
      canWrite
      // Le backend désactive le compte (il ne le supprime pas) et refuse de désactiver son propre compte
      deleteLabel="Désactiver"
      showDelete={(u) => u.is_active && u.id !== me?.id}
      columns={[
        { key: 'full_name', label: 'Nom' },
        { key: 'email', label: 'E-mail' },
        { key: 'role', label: 'Rôle', render: (u) => ROLE_LABELS[u.role] ?? u.role },
        {
          key: 'is_active',
          label: 'Statut',
          render: (u) => (u.is_active ? <Badge tone="ok">Actif</Badge> : <Badge>Désactivé</Badge>),
        },
      ]}
      fields={[
        { name: 'full_name', label: 'Nom complet', required: true },
        { name: 'email', label: 'E-mail', type: 'email', required: true },
        { name: 'role', label: 'Rôle', type: 'select', options: roleOptions, required: true },
        {
          name: 'password',
          label: 'Mot de passe',
          type: 'password',
          requiredOnNew: true,
          omitIfEmpty: true,
          help: '8 caractères minimum. Laisser vide pour ne pas le modifier.',
        },
        { name: 'is_active', label: 'Compte actif', type: 'checkbox' },
      ]}
    />
  )
}
