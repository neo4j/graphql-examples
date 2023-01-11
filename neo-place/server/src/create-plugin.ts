import { Neo4jGraphQLSubscriptionsAMQPPlugin } from "@neo4j/graphql-plugin-subscriptions-amqp";
import {
  Neo4jGraphQLSubscriptionsPlugin,
  Neo4jGraphQLSubscriptionsSingleInstancePlugin,
} from "@neo4j/graphql";
import { getEnvVariable } from "./get-env-variable";

export async function createPlugin(): Promise<Neo4jGraphQLSubscriptionsPlugin> {
  const AMQP_URL = getEnvVariable("NEO_PLACE_AMQP_URL");

  let plugin: Neo4jGraphQLSubscriptionsPlugin;

  if (AMQP_URL) {
    plugin = new Neo4jGraphQLSubscriptionsAMQPPlugin({
      connection: AMQP_URL,
      reconnectTimeout: 1000,
    });
  } else {
    plugin = new Neo4jGraphQLSubscriptionsSingleInstancePlugin();
  }

  plugin.events.setMaxListeners(0);
  return plugin;
}
