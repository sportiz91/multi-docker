const keys = require("./keys");
const redis = require("redis");

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});

const sub = redisClient.duplicate();

const fib = (index) => {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
};

sub.on("message", (channel, message) => {
  redisClient.hset("values", message, fib(parseInt(message)));
});

sub.subscribe("insert");

/*
104. Worker Process Setup
Keys tendrá todas las variables que necesitamos para conectarnos a nuestro Redis Server.
La retry_strategy me dice que siempre que perdamos conexión al Redis server, intentemos conectarnos nuevamente.
una vez cada 1 segundo

La solución que elegimos para el Fibo es recursiva y es lenta. Y eso justamente ilustra porque necesitaríamos un Worker separado
Del NodeJS Express Server.

El sub duplicate viene de "subscripción" y básicamente va a escuchar cada vez que hay un nuevo dato en el Redis Server.

El sub.on nos dice que, cada vez que tengamos un nuevo valor que aparece en Redis, vamos a calcular el Fibonacci number 
Y luego insertaremos eso en un hash (hset) llamado values (primer paráemtro de la función). El índice será el mensaje recibido.
Y luego vamos a guardar el valor de fibonacci que calculamos recién.

Q: I'm using redis library for NodeJS. Can you explain me in detail the following code?
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});

What is retry_strategy?

A:
The redis.createClient() function takes an object as its argument, with the following properties:
host: the hostname of the Redis server.
port: the port on which the Redis server is listening.
retry_strategy: an optional function that specifies how the client should handle connection retries.
The retry_strategy property allows you to define a function that will be called every time the 
client loses its connection to the Redis server and attempts to reconnect.
This function is passed an options object with two properties: error 
(the error that caused the disconnection) and attempt (the number of attempts that have been made to reconnect).
In this code snippet, the retry_strategy function simply returns a fixed delay of 1000ms (1 second) between each reconnection attempt.
This means that if the connection to the Redis server is lost, the client will attempt to reconnect 
every second until the connection is reestablished.
You can customize the retry_strategy function to define your own logic for handling connection retries, 
such as exponential backoff or logging errors.

Q: What is exponential backoff? Can you explain me in detail?
A:
Exponential backoff is a technique used in computing to progressively increase the waiting time between retries of failed operations.
The waiting time increases exponentially after each failed attempt, typically with a multiplier of 2. This approach 
helps to avoid overwhelming the system with too many retry attempts and to improve the chances of success on subsequent attempts.
For example, let's say an application is trying to connect to a remote server, but the connection is unstable, 
resulting in connection failures.
With exponential backoff, the application will first try to reconnect after a short time delay, such as a few seconds.
If the reconnection attempt fails, the application will wait for a longer period, such as several seconds, before trying again.
If this attempt also fails, the application will wait for an even longer time, and so on.
The waiting times will increase exponentially after each failure, which reduces the overall number of 
retry attempts and helps to improve the chances of success on subsequent attempts.
Exponential backoff can be implemented in many programming languages and is widely used in cloud computing, 
such as in AWS services like Lambda and SQS.

Q: Continuing with the above code I provided, we have: const sub = redisClient.duplicate();

sub.on("message", (channel, message) => {
  redisClient.hset("values", message, fib(parseInt(message)));
});

sub.subscribe("insert");

Can you explain the code in detail?

A:
const sub = redisClient.duplicate();
In this line, the duplicate() method is called on the redisClient 
object to create a new connection to Redis that will be used for subscribing to a specific Redis channel.
sub.on("message", (channel, message) => {
  redisClient.hset("values", message, fib(parseInt(message)));
});

Here, the on() method is called on the sub object to listen for messages on the "insert" channel.
When a message is received, the callback function is called with the channel and message as arguments.
In this case, the message is expected to be a number, which is parsed to an integer using parseInt(). Then the fib() 
function is called on this integer to calculate the Fibonacci number for that value.
Finally, the result is stored in Redis using the hset() method, which sets the hash field of the 
"values" key to the Fibonacci number for the message.
sub.subscribe("insert");
Finally, the subscribe() method is called on the sub object to subscribe to the "insert" 
channel in Redis. This means that any messages published on this channel will be received and processed by the 
callback function defined earlier.
In summary, this code creates a new Redis client connection for subscribing to a 
specific channel, listens for messages on that channel, calculates the Fibonacci number for each 
message received, and stores the result in Redis.

Q: What is a channel in Redis? Can you explain me in detail?
A:
In Redis, a channel is a named messaging 
communication mechanism that enables Pub/Sub (Publish/Subscribe) messaging between multiple clients.
Pub/Sub is a messaging pattern where clients communicate with each other through a message broker, in this case Redis.
A channel can be seen as a logical mailbox, where messages can be sent and received by subscribers 
that are interested in that specific channel.
Redis clients can publish messages to a channel, and other clients can subscribe to that channel to 
receive the messages that are published to it.
For example, if you have multiple clients running on different machines, you can use Redis to send 
messages between them by publishing messages to a specific channel.
Any client that is subscribed to that channel will receive the messages. 
Channels can also be used for broadcasting messages to multiple subscribers at once.
To use channels in Redis, you can use the PUBSUB command, which allows you to publish messages to a 
specific channel or subscribe to a channel to receive messages.
When a message is published to a channel, Redis sends the message to all clients that are subscribed to that channel.

Q: Can you explain the redisClient.subscribe and redisClient.on methods? Can you explain me the arguments that the methods takes?
redisClient.subscribe(channel, [callback]): This method subscribes the client to the specified channel or channels.
The channel argument is the name of the channel to subscribe to, and it can be a single string or an array 
of strings for multiple channels.
The optional callback argument is a function that will be called when the subscription is confirmed by Redis.
Example usage:
redisClient.subscribe('my-channel', (err, count) => {
  if (err) {
    console.error('Error subscribing to channel:', err);
  } else {
    console.log(`Subscribed to ${count} channels`);
  }
});
redisClient.on(event, listener): This method adds a listener function to the client for the specified event.
The event argument is the name of the event, such as 'connect', 'error', or 'message'.
The listener argument is the function to be called when the event occurs.
Example usage:
redisClient.on('connect', () => {
  console.log('Connected to Redis server');
});

redisClient.on('error', (err) => {
  console.error('Error connecting to Redis server:', err);
});

redisClient.on('message', (channel, message) => {
  console.log(`Received message on channel ${channel}: ${message}`);
});
In the context of subscribing to a channel and receiving messages, the 'message' event is emitted when a message 
is received on a subscribed channel.
The listener function should take two arguments: the name of the channel (channel), and the message data (message).

Q: What is a hash in Redis? Can you explain me in detail?
A:
In Redis, a hash is a collection of key-value pairs, where the keys and values are strings. 
Redis stores the hash data structure as a single key with multiple fields, each containing a value.
Hashes in Redis are similar to objects in JavaScript or dictionaries in Python.
Hashes are useful in Redis for storing and retrieving data related to a single entity. For example,
if you were building an application to store information about users, you might use a Redis hash to store 
all the information related to a single user
such as their name, email, and password. You could use the user's ID as the key for the hash, 
and each field within the hash would store a different piece of information about the user.
Redis provides several commands for working with hashes, including:
HSET key field value: sets the value of a field in a hash.
HGET key field: retrieves the value of a field in a hash.
HDEL key field [field ...]: deletes one or more fields from a hash.
HGETALL key: retrieves all the fields and values from a hash.
Overall, Redis hashes provide a flexible and efficient way to store and retrieve structured data in Redis.

105. Express API Setup



*/
