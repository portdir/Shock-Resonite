import { WebSocketServer } from "ws";
import * as process from "node:process";

// Types

type Shocker = {
  HubId: number,
  ShockerId: number,
  Name: string,
  IsV3: boolean,
}

type ShockerControlMessage = {
  AgentName: string,              // What shows up in the logs
  Operation: number,              // Device Operation, 0 = shock, 1 = vibrate, 2 = beep
  Duration: number,               // Duration in MS 16-15,000ms
  Intensity: number,              // Intensity 1-100
  MinimumDuration: number,
  MinimumIntensity: number,
  IntensityAsPercentage: boolean  // If the intensity should be treated as a percentage of the users max intensity
}

// Setup

const wsPortArgIndex = process.argv.indexOf("--port");
const apiKeyArgIndex = process.argv.indexOf("--api-key");

let wsPort= -1;
try {
  if (wsPortArgIndex !== -1) {
    wsPort = Number.parseInt(process.argv[wsPortArgIndex + 1]);
  } else if (!!process.env.WS_PORT) {
    wsPort = Number.parseInt(process.env.WS_PORT);
  }
} catch (error) {
  console.error(error);
} finally {
  if (wsPort < 0) {
    console.error("No port found. Using 3018.");
    wsPort = 3018;
  }
}

let apiKey = '';
try {
  if (apiKeyArgIndex !== -1) {
    apiKey = process.argv[apiKeyArgIndex + 1];
  } else if (!!process.env.API_KEY) {
    apiKey = process.env.API_KEY;
  }
} catch (error) {
  console.error(error);
} finally {
  if (!apiKey) {
  console.error("No API Key found. Quitting.");
    process.exit(1);
  }
}

// Create Web Socket
const wss = new WebSocketServer({ port: wsPort });

let shockers: Shocker[] = [];

// Get list of shockers
const getShockers = async () => {
  const res = await fetch("https://api.pishock.com/Shockers", {
    method: "GET",
    headers: {
      "X-PiShock-Api-Key": apiKey,
    }
  });

  if (!res.ok) {
    throw new Error(`Could not get shockers: ${res.status}`);
  }

  shockers = await res.json();
  console.log("Received shockers:", shockers);
}

const formatMessageForTransport = (input: string[]) => {
  return input.reduce((acc, cur) => acc + `${cur.length};${cur};`, "");
}

// Send list of shockers one at a time for easier template duplication
const sendShockers = async (ws: any) => {
  wss.clients.forEach(async (client) => {
    if (client.readyState === WebSocket.OPEN) {
      console.log('sending shockers');
      shockers.forEach(async (shocker) => {
        const formattedPacket = formatMessageForTransport([shocker.ShockerId.toString(), shocker.Name]);
        client.send(formattedPacket, (err) => { console.log(err)});
      });
    }
  });
}

const controlShocker = async (id: number, body: ShockerControlMessage) => {
  console.log("Controlling shocker:", id, body);
  const res = await fetch(`https://api.pishock.com/Shockers/OperateById/${id}`, {
    method: "POST",
    headers: {
      "X-PiShock-Api-Key": apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Could not control shocker: ${res.status} ${res.statusText}`);
  } else {
    console.log(res.status);
  }
}

const parseWSMessage = async (ws: any, data: any) => {
  let stringData = data.toString();
  console.log('received from ws:', stringData);

  const values = [];
  while (stringData.length > 0) {
    const separatorIndex = stringData.indexOf(";");
    const sectionLength = Number.parseInt(stringData.slice(0, separatorIndex));
    const sectionEndIndex = separatorIndex + 1 + sectionLength;
    const section = stringData.substring(separatorIndex + 1, sectionEndIndex);
    stringData = stringData.substring(sectionEndIndex + 1);
    values.push(section);
  }

  const messageType = values[0];

  if (messageType === 'refresh') {
    await getShockers();
    await sendShockers(ws);
  } else if (messageType === 'control') {
    const [_, id, agentName, operation, duration, intensity, intensityAsPercentage] = values;

    const body: ShockerControlMessage = {
      AgentName: agentName,
      Operation: parseInt(operation),
      Duration: parseInt(duration),
      Intensity: parseInt(intensity),
      MinimumDuration: parseInt(duration),
      MinimumIntensity: parseInt(intensity),
      IntensityAsPercentage: intensityAsPercentage === "true"
    }

    await controlShocker(id, body);
  }
}

await getShockers();

wss.on("connection", async (client) => {
  console.log("Client connected");
  client.on("error", (err) => {
    console.error(err);
  });

  client.on('message', async function message(data: any) {
    await parseWSMessage(client, data);
  });
});
