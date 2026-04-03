import { LocalStorageToken } from '../storage/local-storage-token'
import { createAxiosInstance } from '../http/axios-instance'
import { AuthHttpRepository } from '../http/auth.http-repository'
import { UserHttpRepository } from '../http/user.http-repository'
import { ServiceHttpRepository } from '../http/service.http-repository'
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case'
import { RegisterUseCase } from '../../application/use-cases/auth/register.use-case'
import { LogoutUseCase } from '../../application/use-cases/auth/logout.use-case'
import { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case'
import { GetUsersUseCase } from '../../application/use-cases/user/get-users.use-case'
import { CreateUserUseCase } from '../../application/use-cases/user/create-user.use-case'
import { UpdateUserUseCase } from '../../application/use-cases/user/update-user.use-case'
import { DeleteUserUseCase } from '../../application/use-cases/user/delete-user.use-case'
import { GetServicesUseCase } from '../../application/use-cases/service/get-services.use-case'
import { CreateServiceUseCase } from '../../application/use-cases/service/create-service.use-case'
import { UpdateServiceUseCase } from '../../application/use-cases/service/update-service.use-case'
import { DeleteServiceUseCase } from '../../application/use-cases/service/delete-service.use-case'

const tokenStorage = new LocalStorageToken()

const authRepoRef: { repo: AuthHttpRepository | null } = { repo: null }

const http = createAxiosInstance(tokenStorage, () => {
  const refreshUseCase = new RefreshTokenUseCase(authRepoRef.repo!, tokenStorage)
  return refreshUseCase.execute()
})

authRepoRef.repo = new AuthHttpRepository(http)
const authRepo = authRepoRef.repo
const userRepo = new UserHttpRepository(http)
const serviceRepo = new ServiceHttpRepository(http)

export const container = {
  tokenStorage,

  auth: {
    login: new LoginUseCase(authRepo, tokenStorage),
    register: new RegisterUseCase(authRepo, tokenStorage),
    logout: new LogoutUseCase(authRepo, tokenStorage),
    refresh: new RefreshTokenUseCase(authRepo, tokenStorage),
  },

  user: new GetUsersUseCase(userRepo),
  createUser: new CreateUserUseCase(userRepo),
  updateUser: new UpdateUserUseCase(userRepo),
  deleteUser: new DeleteUserUseCase(userRepo),

  service: new GetServicesUseCase(serviceRepo),
  createService: new CreateServiceUseCase(serviceRepo),
  updateService: new UpdateServiceUseCase(serviceRepo),
  deleteService: new DeleteServiceUseCase(serviceRepo),
}
