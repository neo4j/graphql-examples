import * as dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { createServer } from "http";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import express from "express";
import cors from "cors";
import { json } from "body-parser";

import { setupMap } from "./map-setup";
import { getDriver } from "./get-driver";
import { createPlugin } from "./create-plugin";

// Load type definitions
const typeDefs = fs.readFileSync(
  path.join(__dirname, "typedefs.graphql"),
  "utf-8"
);

async function main() {
  const driver = await getDriver();
  const plugin = await createPlugin();
  const neoSchema = new Neo4jGraphQL({
    typeDefs,
    driver,
    plugins: {
      subscriptions: plugin,
      auth: new Neo4jGraphQLAuthJWTPlugin({
        secret: "super-secret42",
      }),
    },
  });

  await setupMap(30);

  // Apollo server setup
  const app = express();
  app.use(express.static("dist"));
  const httpServer = createServer(app);

  // Setup websocket server on top of express http server
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  // Build Neo4j/graphql schema
  const schema = await neoSchema.getSchema();

  await neoSchema.assertIndexesAndConstraints({ options: { create: true } });

  const serverCleanup = useServer(
    {
      schema,
      context: (ctx) => ctx,
    },
    wsServer
  );

  const server = new ApolloServer({
    schema,
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),

      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();
  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ req }),
    })
  );

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`Server is now running on http://localhost:${PORT}/graphql`);
  });
}

main();
