# IoT_production
## Project Structure
-Server
--Controllers
--DB (Database)
--Models
--Repositories
--Services
--Utils
-env

## Controllers
Responsible for incoming traffic, handling files, and authorization.
## DB
Responsible for creating a pool connection to the MySQL database cluster and executing MySQL commands (Object relational mapping).
## Models
Responsible for modeling known incoming and outgoing data structures, allowing control over what data is included in the application.
## Repositories
Responsible for querying necessary MySQL logic related to the application's functionality (Object relational mapping).
## Services
Responsible for additional logic necessary for the data to be well received by the repository and database.
## Utils
Responsible for additional refactored code dump called upon by the core system. 
## .env
Responsible for housing and distributing sensitive information throughout the application (hidden during runtime).





