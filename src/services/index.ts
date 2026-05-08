import { getRepositories } from '@/repositories/factory'
import { createAppService } from '@/services/appService'

export const appService = createAppService(getRepositories())

