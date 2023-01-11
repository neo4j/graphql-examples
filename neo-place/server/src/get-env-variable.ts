export function getEnvVariable(name: string) {
  console.log("Get Env", name, Boolean(process.env[name]));
  return process.env[name];
}
