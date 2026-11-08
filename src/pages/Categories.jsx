import CrudPage from '../components/CrudPage'
import { categories } from '../api/resources'
import { useAuth } from '../hooks/useAuth'
import { ROLES } from '../utils/constants'

export default function Categories() {
  const { hasRole } = useAuth()
  const canWrite = hasRole(ROLES.ADMIN, ROLES.GESTIONNAIRE)
  return (
    <CrudPage
      title="Catégories"
      singular="une catégorie"
      api={categories}
      canWrite={canWrite}
      deleteLabel="Archiver"
      columns={[
        { key: 'name', label: 'Nom' },
        { key: 'description', label: 'Description' },
      ]}
      fields={[
        { name: 'name', label: 'Nom', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
    />
  )
}
