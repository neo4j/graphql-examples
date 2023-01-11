import neo4j from "neo4j-driver";
import { getEnvVariable } from "./get-env-variable";
import { Driver } from "neo4j-driver";

let driver: Driver;

export async function getDriver() {
  if (!driver) {
    const NEO4J_URL = getEnvVariable("NEO_PLACE_DB_URL");
    const NEO4J_USER = getEnvVariable("NEO_PLACE_DB_USER");
    const NEO4J_PASSWORD = getEnvVariable("NEO_PLACE_DB_PASSWORD");

    if (NEO4J_URL && NEO4J_USER && NEO4J_PASSWORD) {
      driver = neo4j.driver(
        NEO4J_URL,
        neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
      );
    }
  }

  return driver;
}
