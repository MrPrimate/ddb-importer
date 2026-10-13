interface ISyncQueue {
  semaphore: InstanceType<typeof foundry.utils.Semaphore>;
  latest: number;
}

const syncQueues = new Map<string, ISyncQueue>();

/**
 * Runs DDB sync calls that share a key (one actor and one endpoint) one at a time, in order,
 * on a Foundry Semaphore.
 *
 * Each call sends absolute state (HP removed, slots used, currency held), so only the newest
 * queued call matters: an older call still waiting when its turn comes is skipped and resolves
 * to `skipped`. Builders run when their turn comes, not when they are queued, so they must read
 * the actor's current state rather than capture values from the triggering update.
 *
 * @param key identifies the actor and endpoint, e.g. `${actor.uuid}:hitpoints`
 * @param build makes the DDB call
 * @param skipped the result for a call superseded by a newer one
 * @returns the call's result, or `skipped`
 */
export function queueSync<T>(key: string, build: () => Promise<T>, skipped: T): Promise<T> {
  let queue = syncQueues.get(key);
  if (!queue) {
    queue = { semaphore: new foundry.utils.Semaphore(1), latest: 0 };
    syncQueues.set(key, queue);
  }
  const activeQueue = queue;
  const version = ++activeQueue.latest;

  return activeQueue.semaphore.add(() => (version === activeQueue.latest ? build() : Promise.resolve(skipped))) as Promise<T>;
}

const characterQueues = new Map<string, InstanceType<typeof foundry.utils.Semaphore>>();

/**
 * Sends DDB update calls for one character one at a time. D&D Beyond loses some of the writes
 * when several reach the same character at once, while still answering success to every one:
 * a sync that removed a container and moved its contents left a removed item behind and
 * contents outside the container.
 *
 * @param characterId the DDB character id
 * @param call makes the DDB call
 * @returns the call's result
 */
export function queueCharacterCall<T>(characterId: string, call: () => Promise<T>): Promise<T> {
  let semaphore = characterQueues.get(characterId);
  if (!semaphore) {
    semaphore = new foundry.utils.Semaphore(1);
    characterQueues.set(characterId, semaphore);
  }
  return semaphore.add(call) as Promise<T>;
}
