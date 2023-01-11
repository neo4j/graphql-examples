import {
  createClient,
  defaultExchanges,
  subscriptionExchange,
  gql,
  Client,
} from "urql";
import { pipe, subscribe } from "wonka";
import { createClient as createWSClient } from "graphql-ws";
import type { Client as WSClient } from "graphql-ws";
import { hasOwnProperty } from "./utils/hasOwnProperty";
import type { PixelColor, PixelPosition, PixelUpdate } from "./types";

// Low security auth
const JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.vVUnlsit1z9nnQJXIEwyFAj9NNflBUoeOpHP9MyzlCg";

export class GraphQLServerApi {
  wsUrl: string;
  url: string;
  client: Client;
  wsClient: WSClient;

  constructor({ wsUrl, url }: { wsUrl: string; url: string }) {
    this.wsUrl = wsUrl;
    this.url = url;
    this.wsClient = createWSClient({
      url: this.wsUrl,
      connectionParams: {
        authorization: `Bearer ${JWT}`,
      },
    });

    this.client = createClient({
      url: this.url,
      exchanges: [
        ...defaultExchanges,
        subscriptionExchange({
          forwardSubscription: (operation) => ({
            subscribe: (sink) => ({
              unsubscribe: this.wsClient.subscribe(operation, sink),
            }),
          }),
        }),
      ],
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${JWT}`,
        },
      },
    });
  }

  async getCanvas() {
    const canvasQuery = gql`
      query Canvas {
        canvas
      }
    `;

    const result = await this.client.query(canvasQuery, {}).toPromise();
    if (result.error) throw new Error(result.error.message);
    return result.data.canvas;
  }

  updatePixel(position: PixelPosition, color: PixelColor) {
    const updatePixelQuery = gql`
      mutation UpdatePixels($update: PixelUpdateInput, $where: PixelWhere) {
        updatePixels(update: $update, where: $where) {
          pixels {
            position
            color
          }
        }
      }
    `;
    const params = {
      update: {
        color,
      },
      where: {
        position,
      },
    };

    return this.client.mutation(updatePixelQuery, params).toPromise();
  }

  onConnected(callback: () => void) {
    this.wsClient.on("connected", () => {
      callback();
    });
  }

  onClosed(callback: () => void) {
    this.wsClient.on("error", () => {
      callback();
    });
    this.wsClient.on("closed", () => {
      callback();
    });
  }

  onPixelUpdate(callback: (updatedEvent: PixelUpdate) => void) {
    const pixelsSubscription = gql`
      subscription Subscription {
        pixelUpdated {
          updatedPixel {
            position
            color
          }
        }
      }
    `;

    pipe(
      this.client.subscription(pixelsSubscription, {}),
      subscribe((result: unknown) => {
        console.log({ result });
        if (this.isPixelUpdate(result)) {
          callback({
            updatedPixel: {
              color: result.data.pixelUpdated.updatedPixel.color,
              position: result.data.pixelUpdated.updatedPixel.position,
            },
          });
        }
      })
    );
  }

  private isPixelUpdate(value: unknown): value is {
    data: {
      pixelUpdated: PixelUpdate;
    };
  } {
    return (
      !!value &&
      !hasOwnProperty(value, "error") &&
      hasOwnProperty(value, "data") &&
      hasOwnProperty(value.data, "pixelUpdated") &&
      hasOwnProperty(value.data.pixelUpdated, "updatedPixel") &&
      hasOwnProperty(value.data.pixelUpdated.updatedPixel, "position") &&
      hasOwnProperty(value.data.pixelUpdated.updatedPixel, "color") &&
      typeof value.data.pixelUpdated.updatedPixel.color === "string" &&
      this.isPixelPosition(value.data.pixelUpdated.updatedPixel.position)
    );
  }

  private isPixelPosition(value: unknown): value is PixelPosition {
    return (
      Array.isArray(value) &&
      value.length === 2 &&
      typeof value[0] === "number" &&
      typeof value[1] === "number"
    );
  }
}
