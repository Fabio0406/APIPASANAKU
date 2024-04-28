import pkg from 'pg'

export const consul = new pkg.Pool({
    host: process.env.DB_HOST ||'viaduct.proxy.rlwy.net',
    user: process.env.DB_USER ||'postgres',
    password: process.env.DB_PASSWORD ||'TrixWIoUdTOJcquXumRwoXOovAdjIqRs',
    database: process.env.DB_DATABASE ||'railway',
    port: process.env.DB_PORT||'50392'
})