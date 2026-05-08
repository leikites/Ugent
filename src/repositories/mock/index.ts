import { dataClient } from '@/data/client'
import type { Repositories } from '@/repositories/interfaces'

export const mockRepositories: Repositories = {
  auth: dataClient.auth,
  workspaces: dataClient.workspaces,
  agents: dataClient.agents,
  skills: dataClient.skills,
  workflows: dataClient.workflows,
  execution: dataClient.execution,
  reviews: dataClient.reviews,
}

