import postgres from 'npm:postgres'

const sql = postgres(Deno.env.get('DATABASE_URL')!, {
  ssl: false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
})

export default sql
