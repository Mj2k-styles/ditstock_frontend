import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import Pagination from '../components/Pagination'

describe('Pagination', () => {
  it('passe à la page suivante', async () => {
    const onChange = vi.fn()
    render(<Pagination page={1} pages={3} total={25} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /suivant/i }))
    expect(onChange).toHaveBeenCalledWith(2)
    expect(screen.getByRole('button', { name: /précédent/i })).toBeDisabled()
  })
})
