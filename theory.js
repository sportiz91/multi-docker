/*
147. Adding Container Definitions to DockerRun
Cuando le pusimos el nombre a los servicios dentro del docker-compose.yml, ese nombre actúa como hostname que puede ser utilizado
Para acceder a cualquier otro container que haya sido creado con el docker-compose.

148. More Container Definitions
La essential flag nos dice que el container no es esencial.
Si marcamos el container como essential true, y el container en cuestión crashea por algún motivo, el grupo de containers se cerrará
Al mismo tiempo.
El único contaidner essential que tendremos será el nginx server. Si el nginx server crashea, significa que nadie en nuestra App
Podrá acceder a ninguno de los servicios en nuestra App. Entonces, lo ideal sería que marcáramos ese servicio como essential ->
Si crashea, no podríamos acceder a ningún otro de los servicios.
Una cosa, alguno de los containers en el grupo de containers definidos en Dockerrun.aws.json, deberá ser marcado como essential.

149. Forming Container Links
Port mappings lo que quiere decir es abrir un puerto en el host, donde estarán hosteados todos nuestros containers, y lo mapearemos al
Puerto 80 adentro del container. Es decir, estas líneas:
            "portMappings": [
                {
                    "hostPort": 80,
                    "containerPort": 80,
                }
            ]
Qué significa el links?
Adentro de nuestro Docker Compose, nos podemos comunicar entre containers con el hostname. Entonces, cuando API container se tiene
Que conectar a Redis Container, simplemente decimos "conectame a Redis Container".
Cada vez que API hace una request a un container con el nombre de Redis, automáticamente se routeará al Redis Service.
Sin embargo, cuando estamos deployando los container a EBS, tendremos que hacer un explicit mapping entre los diferentes containers.
Entonces, cuando decimos que "client" y "server" están conectados, le estoy avisando a EBS (ECS) que los client y server containers
Se pueden comunicar entre ellos.


*/