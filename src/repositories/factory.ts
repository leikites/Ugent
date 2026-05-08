import type { Repositories } from '@/repositories/interfaces'
import { mockRepositories } from '@/repositories/mock'

const MODE = (import.meta.env.VITE_DATA_SOURCE as string | undefined) ?? 'mock'

export function getRepositories(): Repositories {
  if (MODE === 'mock') return mockRepositories
  return mockRepositories
}

