import { getDriver } from "./get-driver";

export async function setupMap(size: number) {
  const driver = await getDriver();
  const session = driver.session();
  await session.run(getCanvasStatement(size));
  await session.close();
}

function getCanvasStatement(size: number, color = "#FFFFFF") {
  const upperIndex = size - 1;

  return `UNWIND range(0, ${upperIndex}) AS x
    UNWIND range(0, ${upperIndex}) AS y
    MERGE(p:Pixel { position: [x, y]})
    ON CREATE SET p.color="${color}"`;
}
