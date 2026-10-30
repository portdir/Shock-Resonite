# Shock-Resonite
Control PiShock devices from Resonite. *No AI was used in the making of this project.* Still in beta, Shock-Resonite-PI is a in-game controller for [pishock](https://pishock.com/)

## Getting Started
Install dependencies with `pnpm i`. Copy `.env.example` to `.env` and add your API key.

## Running - Host
Use `pnpm start` to run the app using your environment variables.

You can optionally pass in override arguments when running the application.
`--port <port>`
`--api-key <api key>`

## Running - In game
In the `pishock host/Variable(s)` there are some Variables that need to be changed for this to work.

In `SAFE` you can find.

1. `MAXinputs/Duration` - Range 1000-15000 - The max of how long a action can be. "this is in ms (15000ms = 15s)".
3. `MAXinputs/Intensity` - Range 1-100 - The max of the Intensity.
4. `MAXinputs/safecode` - Range 0-100 - The safe code is for stopping users without it from activating the pishock.

In `HOST` you can find.

1. `PiShock/Port` - Set this to the port you set in `.env`/`--port <port>`.
2. `PiShock/Host` - Keep this the same. if your not running [Shock-Resonite](https://github.com/portdir/Shock-Resonite) on your PC set it to the IP of the server in question.

## More Reading
Swagger API broke most other ones so here ya goo peps.

Also this keep the API key out of the game so its a bit safer for other things.
* [PiShock API Docs](https://pishock.helpscoutdocs.com/article/32-api)
* [PiShock Swagger Docs](https://api.pishock.com/swagger/index.html?urls.primaryName=v1)
* [Resonite Wiki WebSocket Documentation](https://wiki.resonite.com/WebSocket)
