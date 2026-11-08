import CrudPage from '../components/CrudPage'
import { suppliers } from '../api/resources'
import { useAuth } from '../hooks/useAuth'
import { ROLES } from '../utils/constants'

export default function Suppliers() {
  const { hasRole } = useAuth()
  const canWrite = hasRole(ROLES.ADMIN, ROLES.GESTIONNAIRE)
  return (
    <CrudPage
      title="Fournisseurs"
      singular="un fournisseur"
      api={suppliers}
      canWrite={canWrite}
      columns={[
        { key: 'name', label: 'Nom' },
        { key: 'phone', label: 'Téléphone' },
        { key: 'email', label: 'E-mail' },
      ]}
      fields={[
        { name: 'name', label: 'Nom', required: true },
        { name: 'phone', label: 'Téléphone', type: 'tel' },
        { name: 'email', label: 'E-mail', type: 'email' },
        { name: 'address', label: 'Adresse', type: 'textarea' },
      ]}
    />
  )
}
