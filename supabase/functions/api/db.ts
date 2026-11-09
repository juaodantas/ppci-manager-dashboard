// Use native Deno sockets; npm's Node socket APIs are incompatible with the local Edge Runtime.
import postgres from 'https://deno.land/x/postgresjs@v3.4.7/mod.js'

const sql = postgres(Deno.env.get('DATABASE_URL')!, {
  ssl: false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
})

export default sql
