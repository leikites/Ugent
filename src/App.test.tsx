import { describe, expect, it } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders Ugent', () => {
    render(<App />)
    expect(screen.getByText('Ugent')).toBeInTheDocument()
  })
})
