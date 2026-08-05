// Wraps any awaitable in a hard ceiling so a hung request (broken network,
// unresponsive endpoint) can never leave the caller waiting forever —
// callers fall back to a sane default instead.
export function withTimeout<T>(promise: PromiseLike<T>, ms = 5000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}
