// Resolves Vite-style extensionless imports and swaps Firebase for in-memory mocks.
const mock = new URL('./firestoreMock.js', import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'firebase/firestore' || specifier === './firebase') {
    return { url: mock, shortCircuit: true };
  }
  if (specifier.startsWith('.') && !/\.[cm]?jsx?$/.test(specifier)) {
    return nextResolve(`${specifier}.js`, context);
  }
  return nextResolve(specifier, context);
}
