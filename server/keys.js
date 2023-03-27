module.exports = {
  redisHost: process.env.REDIS_HOST,
  redisPort: process.env.REDIS_PORT,
  pgUser: process.env.PGUSER,
  pgHost: process.env.PGHOST,
  pgDatabase: process.env.PGDATABASE,
  pgPassword: process.env.PGPASSWORD,
  pgPort: process.env.PGPORT,
};

/*
105. Express API Setup
Keys tendrá las llaves importantes para correr nuestro Server.
pgDatabase -> nombre de la base de datos adentro de pg a la cual nos conectaremos. 
pgPassword -> password de la base de datos.
*/
