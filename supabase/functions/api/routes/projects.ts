import { Hono } from 'npm:hono'
import { authMiddleware } from '../middleware/auth.ts'
import { createProject } from '../use-cases/project/create-project.ts'
import { getAllProjects, getProjectById } from '../use-cases/project/get-project.ts'
import { updateProject } from '../use-cases/project/update-project.ts'
import { deleteProject } from '../use-cases/project/delete-project.ts'
import { addProjectService } from '../use-cases/project/add-project-service.ts'
import { updateProjectService } from '../use-cases/project/update-project-service.ts'
import { removeProjectService } from '../use-cases/project/remove-project-service.ts'
import { HttpError } from '../errors.ts'
import { validateBody } from '../validation/validate.ts'
import {
  createProjectSchema,
  updateProjectSchema,
  addProjectServiceSchema,
  updateProjectServiceSchema,
} from '../validation/schemas.ts'

const projects = new Hono()
projects.use('*', authMiddleware)

projects.get('/', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100)
  const offset = Number(c.req.query('offset') ?? 0)
  const status = c.req.query('status')
  const customer_id = c.req.query('customer_id')
  const result = await getAllProjects({ limit, offset, status, customer_id })
  return c.json(result)
})

projects.post('/', async (c) => {
  const body = await c.req.json()
  const dto = validateBody(createProjectSchema, body)
  try {
    const project = await createProject(dto)
    return c.json(project, 201)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

projects.get('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const project = await getProjectById(id)
    return c.json(project)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

projects.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const dto = validateBody(updateProjectSchema, body)
  try {
    const project = await updateProject(id, dto)
    return c.json(project)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

projects.delete('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await deleteProject(id)
    return c.body(null, 204)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

projects.post('/:id/services', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const dto = validateBody(addProjectServiceSchema, body)
  try {
    const service = await addProjectService(id, dto)
    return c.json(service, 201)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

// project-services endpoints (mounted at /projects for simplicity, matches tasks spec)
const projectServices = new Hono()
projectServices.use('*', authMiddleware)

projectServices.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const dto = validateBody(updateProjectServiceSchema, body)
  try {
    const service = await updateProjectService(id, dto)
    return c.json(service)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

projectServices.delete('/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await removeProjectService(id)
    return c.body(null, 204)
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status)
    throw err
  }
})

export const projectRoutes = projects
export const projectServiceRoutes = projectServices
