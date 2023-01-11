import type { Pixel, PixelColor, PixelPosition } from "./types";
import { CanvasApi } from "./canvas-api";
import { GraphQLServerApi } from "./graphql-server-api";

const LOCAL_GRAPHQL_SERVER_URI_BASE = "localhost:4000/graphql";

let selectedColor: PixelColor = "#FFFFFF";
const buttons: PixelColor[] = [
  "#000000",
  "#FFFFFF",
  "#CC254B",
  "#018BFF",
  "#327D60",
  "#FFDE63",
];

function setupButtons() {
  function selectColor(newColor: PixelColor) {
    selectedColor = newColor;
  }

  for (const buttonColor of buttons) {
    const buttonWrapper = document.querySelector(".buttons-wrap") as Element;
    const button = document.createElement("button");
    button.classList.add("button-class");
    buttonWrapper.appendChild(button);
    button.style.backgroundColor = buttonColor;

    button.onclick = () => {
      selectColor(buttonColor);
    };
  }
}

let wsUrl = `ws://${LOCAL_GRAPHQL_SERVER_URI_BASE}`;
let url = `http://${LOCAL_GRAPHQL_SERVER_URI_BASE}`;

if (process.env.NODE_ENV === "production") {
  wsUrl = "wss://team-graphql.uc.r.appspot.com/graphql";
  url = "/graphql";
}

console.log("Url:", url);
console.log("WS Url:", wsUrl);

const serverApi = new GraphQLServerApi({
  url,
  wsUrl,
});
const canvasApi = new CanvasApi("place", 10);

async function setupCanvas() {
  const canvasState = await serverApi.getCanvas();

  let x = 0;
  let y = 0;
  for (const pixelColor of canvasState) {
    canvasApi.drawPixel([x, y], pixelColor);
    y += 1;
    if (y === 30) {
      x += 1;
      y = 0;
    }
  }
}

let eventsBackflow: Pixel[] = [];
let canvasLock = true;

serverApi.onPixelUpdate((updatedEvent: { updatedPixel: Pixel }) => {
  const updatedPixel = updatedEvent.updatedPixel;
  eventsBackflow.push(updatedPixel);
  if (!canvasLock) drawBackflow(eventsBackflow);
});

let errored = false;
serverApi.onConnected(async () => {
  canvasLock = true;
  await setupCanvas();
  drawBackflow(eventsBackflow);
  if (!errored) handleConnect();
});

function handleDisconnect() {
  errored = true;
  canvasLock = true;
  const buttonWrapper = document.querySelector(".buttons-wrap") as HTMLElement;
  const disconnectedMessage = document.querySelector(
    ".disconnected-message"
  ) as HTMLElement;
  buttonWrapper.style.display = "none";
  disconnectedMessage.hidden = false;
  canvasApi.grayscale();
}

function handleConnect() {
  const buttonWrapper = document.querySelector(".buttons-wrap") as HTMLElement;
  const loader = document.querySelector(".loader") as HTMLElement;
  const canvas = document.querySelector("#place") as HTMLElement;
  buttonWrapper.style.display = "flex";
  loader.hidden = true;
  canvas.hidden = false;
  canvasLock = false;
}

serverApi.onClosed(async () => {
  handleDisconnect();
});

function drawBackflow(pixels: Pixel[]) {
  for (const pixel of pixels) {
    canvasApi.drawPixel(pixel.position, pixel.color);
  }
  eventsBackflow = [];
}

setupButtons();
canvasApi.onPixelClicked((pixelClicked: PixelPosition) => {
  if (!canvasLock) {
    canvasApi.drawPixel(pixelClicked, selectedColor);
    serverApi.updatePixel(pixelClicked, selectedColor).then((res) => {
      if (res.error) {
        console.log(res.error);
        handleDisconnect();
      }
    });
  }
});
