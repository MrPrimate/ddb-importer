
export function getEnvironments(monster, DDB_CONFIG) {
  const environments = monster.environments.filter((env) =>
    DDB_CONFIG.environments.some((c) => env == c.id)
  ).map((env) => {
    return DDB_CONFIG.environments.find((c) => env == c.id).name;
  });

  return environments.join(", ");
}
