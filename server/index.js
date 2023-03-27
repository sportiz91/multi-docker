const keys = require("./keys");

//Express App Setup:
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const redis = require("redis");

const app = express();
app.use(cors());
app.use(bodyParser.json());

//Postgres Client Setup:
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});

pgClient.on("connect", (client) => {
  client
    .query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch((err) => console.error(err));
});

//Redis Client Setup:
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});

const redisPublisher = redisClient.duplicate();

//Express Route Handlers:
app.get("/", (req, res) => {
  res.send("Hi");
});

app.get("/values/all", async (req, res) => {
  const values = await pgClient.query("SELECT * FROM values");

  res.send(values.rows);
});

app.get("/values/current", async (req, res) => {
  redisClient.hgetall("values", (err, values) => {
    res.send(values);
  });
});

app.post("/values", async (req, res) => {
  const index = req.body.value;

  if (parseInt(index) > 40) {
    return res.status(422).send("Index too high");
  }

  redisClient.hset("values", index, "Nothing yet!");

  redisPublisher.publish("insert", index);

  pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);

  res.send({ working: true });
});

app.listen("5000", () => {
  console.log("listening on port 5000.");
});

/*
107. Connecting to Postgres
Este file tendrá toda la lógica necesaria para conectarnos a Redis, conectanos a pg.
El Express Server será el broker information entre ambas bases de datos y también estará sirviendo a la React App como API.

La express App será la encargada de recibir HTTPs requests y dar responses.

CORS = Cross Origin Resource Sharing. Básicamente este módulo nos dejará realizar requests de un dominio (la React App)
a un dominio completamente diferente o puerto diferente, en este caso (Express API).

bodyParser -> parsea incoming requests de la React App y convierte el cuerpo de las posts requests en un JSON value para que la Express
API trabaje con.

Postgres Client Setup será la parte de la App encargada de comunicarse con la pg database.

Una cosa importante: cada vez que nos conectemos a un PG database, la primera vez que lo hagamos deberemos crear una Tabla
que contedrá todos nuestros valores En nuestro caso, vamos a crear una tabla que va a guardar los valores de los índices vistos
Para la Fibo sequence.

Q: Can you explain me in detail the CORS module for NodeJS?
A:
CORS stands for Cross-Origin Resource Sharing. It is a mechanism that allows a web page 
to make AJAX requests to a different domain than the one that served the web page.
CORS is a security feature built into web browsers that helps prevent malicious scripts from accessing resources on a different domain.
Without CORS, web pages would only be able to make AJAX requests to the same domain that served the page.
The CORS module for NodeJS provides a middleware function that can be used to enable CORS on a NodeJS server.
The middleware function adds the necessary headers to the response to allow the browser to make requests 
to the server from a different domain.
Here's an example of how to use the CORS middleware in NodeJS:
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());

// Define your API routes here

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
In this example, the cors middleware is added to the Express app using the app.use() method. 
This will enable CORS for all routes on the server.
The cors middleware function can take options as an argument to configure how CORS should be handled. Here's an example:
app.use(cors({
  origin: 'http://example.com',
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true
}));
In this example, we're setting the origin option to http://example.com, which means that 
only requests coming from http://example.com will be allowed.
We're also specifying that the server should allow GET and POST requests, and that the 
Content-Type and Authorization headers should be allowed.
Finally, we're setting the credentials option to true, which means that the server will 
allow cookies to be sent in cross-origin requests.

Q: What are the headers that the CORS module adds to the response to 
allow the browser to make requests to the server from a different domain? Can you show me examples?
A:
The CORS module adds several headers to the response to indicate to the browser that the server allows cross-origin requests.
The headers added are:
Access-Control-Allow-Origin: This header indicates the domains that are allowed to make requests to the server.
If the server allows any domain to make requests, the header value will be "*". For example, to allow requests from a specific domain:
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: This header indicates the HTTP methods that are allowed to be used in the cross-origin request. 
For example, to allow GET and POST methods:
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: This header indicates the HTTP headers that are allowed to be used in the cross-origin request. 
For example, to allow "Content-Type" header:
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Credentials: This header indicates whether the cross-origin request can include user credentials
(such as cookies, authorization headers, or TLS client certificates). For example, to allow user credentials:
Access-Control-Allow-Credentials: true
Here's an example of how these headers can be added to a Node.js response object using the CORS module:
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: 'https://example.com',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.get('/data', (req, res) => {
  // send data
});
In this example, the cors middleware is added to the app 
with the configuration options to allow requests from https://example.com, allow only GET and POST methods, 
allow only Content-Type header, and allow user credentials.

Q: And if we do app.use(cors()) from which domains are we allowing requests?
If you use app.use(cors()) without any additional configuration, it will allow requests from any domain.
This is equivalent to setting the Access-Control-Allow-Origin header to *, 
which means any origin is allowed to access the server's resources. 
In a production environment, it is recommended to specify the allowed origins explicitly rather than allowing all origins.
This can be achieved by passing an options object to the cors() function with a origin property that specifies 
the allowed origins as an array of strings.
For example, to allow requests only from example.com and example.net, you can use the following code:
const corsOptions = {
  origin: ['http://example.com', 'http://example.net']
};

app.use(cors(corsOptions));

Q: Can you explain me in detail the pg library in an express server?
A:
The pg library is a Node.js library that provides a way to interact with PostgreSQL databases. 
It allows you to connect to a PostgreSQL database and execute queries against it.
To use pg in an Express server, you first need to install it using npm install pg
Once installed, you can create a new client by calling the pg.Client() constructor and passing 
in the connection details as an object. For example:
const { Client } = require('pg');

const client = new Client({
  user: 'dbuser',
  host: 'database.server.com',
  database: 'mydb',
  password: 'secretpassword',
  port: 5432,
});
Once you have created the client, you can connect to the database by calling client.connect()
Once connected, you can execute queries by calling the client.query() method and passing in a SQL string. For example:
client.query('SELECT * FROM users', (err, res) => {
  if (err) throw err;
  console.log(res.rows);
  client.end();
});
In this example, the query() method is executed with a SELECT statement that retrieves all rows from the users table.
The result of the query is returned in the res object, which contains an array of rows returned by the query.
The client.end() method is called to close the database connection.
There are also many other features available in the pg library, including prepared statements, connection pooling, and transactions.

Q: Can you explain me the Pool constructor of the pg library? Which is the difference with the Client constructor we've just seen?
A:
The Pool constructor in the pg library provides a connection pool manager for PostgreSQL databases,
which allows for efficient use and reuse of database connections.
With the Pool constructor, a pool of connections to the database is created and managed by the pg library.
The pool maintains a set of idle connections, which are ready to be used as soon as a query is executed.
When a query is executed, the pg library automatically checks out an idle connection from the pool, uses it to execute the query
and then returns the connection back to the pool.
The main difference between the Pool constructor and the Client constructor is that the Pool manages a pool of connections
while the Client manages a single connection.
The Pool is typically used in web applications where multiple requests 
may be processed simultaneously and therefore require multiple connections to the database.
Here's an example of how to create a Pool object in Node.js:
const { Pool } = require('pg');

const pool = new Pool({
  user: 'your_user',
  host: 'your_database_host',
  database: 'your_database',
  password: 'your_password',
  port: 5432, // the default port for PostgreSQL
});
The Pool constructor takes an options object that contains various configuration options, including:
user: the PostgreSQL username to use for the connection
host: the hostname of the PostgreSQL server
database: the name of the PostgreSQL database to connect to
password: the password for the PostgreSQL user
port: the port number of the PostgreSQL server (default is 5432)
Once you've created a Pool object, you can use it to query the database by calling its query method, 
which takes an SQL query string as its argument.
The query method returns a promise that resolves with a QueryResult object, which contains the rows returned by the query.
Here's an example of how to use the Pool to execute a simple query:
pool.query('SELECT * FROM mytable')
  .then(result => {
    console.log(result.rows);
  })
  .catch(error => {
    console.error(error);
  });
In this example, the query method is used to execute a SELECT statement on a table named mytable
The results of the query are then logged to the console. If an error occurs during the query, it is caught and logged to the console.

Q: Can you explain me in detail the concept of USER in a postgre sql database?
A:
In PostgreSQL, a user is a role that has login privileges to a database cluster.
A user can own objects such as tables, indexes, and views within a database
Each user in a PostgreSQL database has a unique name and can be granted different levels of privileges and permissions.
When a new user is created in a PostgreSQL database, the user is initially not granted any privileges.
In order to grant privileges to the user, the database administrator can assign the user to a role
which is a named collection of privileges that can be granted to a user or group of users.
Users can also be given different permissions within a database, such as the ability to create, modify, 
or delete objects within the database.
The level of permissions granted to a user can be controlled through the use of SQL commands or through a graphical user interface.
One important thing to note is that in PostgreSQL, users and roles are effectively the same thing, and the terms are 
often used interchangeably.

Q: I have the following code:
const { Pool } = require("pg");
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});

pgClient.on("connect", (client) => {
  client
    .query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch((err) => console.error(err));
});

Can you explain me the .on method in detail?

A:
The .on method is a way to register event listeners on the pgClient instance.
In this case, the connect event is being listened to, which is emitted by the pgClient instance 
when a new client is connected to the database pool.
When the connect event is emitted, the provided callback function is executed and passed the client object as its argument.
The client object is a single connection instance from the connection pool that can be used to interact with the database.
In the provided code, the callback function executes a SQL query to create a new table called "values" 
in the database if it doesn't already exist.
If the query fails, the error is logged to the console using console.error.

Q: Can you explain me in detail the following SQL query: "CREATE TABLE IF NOT EXISTS values (number INT)" ?
A:
This SQL query creates a table named "values" with a single column named "number" with a data type of INT (integer)
The "IF NOT EXISTS" clause is used to check whether a table with the name "values" already exists in the database.
If it does not exist, then the table is created. If it does exist, then the query simply does nothing and moves on.
So, this query is commonly used to ensure that a table exists in a database before attempting to insert or retrieve data from it,
as it provides a way to handle the case where the table does not exist yet.

Q: Can you explain me in detail the CREATE TABLE statement of SQL ? What are their arguments? Can you show me example code?
A:
Sure! The CREATE TABLE statement in SQL is used to create a new table in a database. The basic syntax for the statement is as follows:
CREATE TABLE table_name (
  column1 datatype constraints,
  column2 datatype constraints,
  column3 datatype constraints,
  ...
);
table_name is the name you want to give to the new table.
column1, column2, column3, etc. are the names of the columns in the table.
datatype is the data type for the column, such as INT, VARCHAR, DATE, etc.
constraints are optional rules that you can set for each column, such as NOT NULL, UNIQUE, PRIMARY KEY, etc.
Here's an example of a CREATE TABLE statement:
CREATE TABLE customers (
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE,
  age INT
);
This statement creates a new table called customers with four columns: id, name, email, and age
The id column is set as the primary key, the name column is set to NOT NULL so it cannot be left blank, and the 
email column is set as UNIQUE so that no two customers can have the same email address.
In the context of the code you provided, the SQL statement CREATE TABLE IF NOT EXISTS values (number INT) 
creates a table called values with a single column called number of type INT
The IF NOT EXISTS clause makes sure that the table is only created if it doesn't already exist in the database.

Q: What are the events a pool client can listen in pg library?
A:
In the pg library for Node.js, a pool client created using Pool constructor can listen to the following events:
connect: This event is emitted when a new client is acquired from the pool and is connected to the PostgreSQL server.
acquire: This event is emitted when a client is acquired from the pool.
error: This event is emitted when an error occurs with a client in the pool.
remove: This event is emitted when a client is removed from the pool.
These events can be listened to using the on method of the pool client object. For example:
const { Pool } = require('pg');

const pool = new Pool({ pool configuration });

pool.on('connect', (client) => {
    console.log('Client connected to PostgreSQL server');
  });
  
  pool.on('error', (err, client) => {
    console.error('Error occurred with a client in the pool', err);
  });
  
108. More Express API Setup
/values/all route se utilizará para queriar nuestra pg instance y retornar todos los diferentes valores que se submitieron a postgres.
Entonces la route básicamente nos retorna todos los valores que alguna vez se submitieron a pg.
Vamos a capear a un máximo de 40 el índice
redisClient.hset("values", index, "Nothing yet!"); -> ponemos nothing yet dado que el worker, eventualmente va a venir al hash
Y va a reemplazar el "Nothing yet!" por el valor calculado.
Luego de eso, tendremos que hacer el envío de la señal al worker.
Además, vamos a mirar al postgres Client y vamos a agregar el nuevo índice que se acaba de submitir.
Recordemos que la pg database es la encargada de almacenar el record permanente de todos los diferentes índices que se submitieron
En la app.

Q: Can you explain me in detail the redisClient.hgetall method? Can you provide me an explanation of every argument of the method?
A:
The redisClient.hgetall() method is used to retrieve all the fields and their corresponding values from a Redis hash. 
Here is an explanation of each argument:
key: This is the name of the hash from which you want to retrieve the fields and values.
callback: This is a function that will be called when the method completes. The callback function 
takes two arguments: err and result. err
will be an error object if an error occurs, otherwise it will be null. result will be an object containing 
all the fields and values of the hash.
Here is an example of using redisClient.hgetall():
redisClient.hgetall("myhash", function(err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log(result);
  }
});
In this example, the method is used to retrieve all the fields and values from the Redis hash named myhash
When the method completes, the callback function is called. If an error occurred, err will be an error object. Otherwise, 
result will be an object containing all the fields and values of the hash.

Q: Can you explain me in detail the 422 status code from an HTTP request?
A:
The HTTP status code 422, also known as "Unprocessable Entity", 
is used to indicate that the server was unable to process the request because the request entity (i.e., the data submitted 
with the request) is semantically incorrect, incomplete, or inconsistent with the server's expectations.
This status code is typically used when the server is able to understand the request but cannot process it due to invalid data,
missing required fields, or other issues with the submitted data.
The 422 status code is part of the 4xx series of HTTP status codes, which indicate that the client's request was unsuccessful 
due to an error on the client's part.
However, unlike other 4xx codes such as 400 (Bad Request) or 404 (Not Found), which indicate problems with the request itself 
or the requested resource
a 422 status code specifically indicates that the problem lies with the submitted data.
In summary, the 422 status code is used to indicate that the server was unable to process the request due to invalid 
or incomplete data submitted with the request.

Q: Can you explain me in detail the following line of code? pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);
A:
This line of code is using the query() method of the pgClient object to insert data into a PostgreSQL database.
The query() method takes a SQL string as its first argument and an array of parameter values as its second argument.
In this case, the SQL string is INSERT INTO values(number) VALUES($1) which is a PostgreSQL command to insert a row into a 
table named "values" with a column named "number"
The $1 is a placeholder that will be replaced with the first value in the array of parameters.
The array of parameters, in this case, is [index] which contains a single value that will be used to replace the 
So overall, this line of code is inserting a value of index into a table named "values" in the PostgreSQL 
database connected to by the pgClient object.$1 placeholder in the SQL string.

Q: Can you explain me in detail the INSERT INTO instruction in SQL? Can you show me examples to better understand?
A:
The INSERT INTO statement is used to insert new rows into a table in a SQL database. It has the following syntax:
INSERT INTO table_name (column1, column2, column3, ...)
VALUES (value1, value2, value3, ...);
Here, table_name is the name of the table that you want to insert data into. If you want to specify 
the columns you're inserting data into, you can list them in parentheses after the table name.
If you omit the column list, you must provide a value for every column in the table.
value1, value2, value3, etc. are the actual values that you want to insert into the table. 
You can specify them in a comma-separated list within parentheses, and the number of values you specify must match the 
number of columns you're inserting into.
For example, suppose we have a users table with the columns id, name, and age. We can insert a new row into the table like this:
INSERT INTO users (name, age)
VALUES ('John Doe', 30);
This will insert a new row with the name 'John Doe' and age 30 into the users table.
In the Node.js code you provided, pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);, 
pgClient is an instance of the Pool class from the pg library. 
query is a method on this instance that sends a SQL query to the PostgreSQL server. Here, the SQL query 
is an INSERT INTO statement that inserts a new row into a table named 
values with a single column named number.
The actual value to be inserted into the number column is passed as a parameter to the query in an array, 
with the value being $1 (the first parameter passed to the query).

Q: And why VALUES($1), [index]? Is to avoid some injection attacks? Explain me in detail please
A:
Yes, the use of prepared statements with parameterized queries, as shown in the code VALUES($1) and [index], 
helps to prevent SQL injection attacks.
SQL injection attacks occur when a malicious user inputs SQL code into an application's input fields
and that code is then executed on the application's database server
This can lead to a variety of security issues, such as unauthorized data access or manipulation.
Parameterized queries help prevent SQL injection attacks by separating the SQL code from the user input.
Instead of inserting the user input directly into the SQL code, parameterized queries use placeholders 
in the SQL code and then pass the user input as a separate parameter.
The database server then treats the user input as data, not code, effectively neutralizing any malicious SQL code 
that may have been injected.
In the code pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);, the $1 placeholder in the SQL 
code corresponds to the first element of the array [index],
which is passed as a separate parameter to the query.
By using this parameterized approach, the application is protected against SQL injection attacks that might 
try to manipulate the value of index to execute arbitrary SQL code.



*/
