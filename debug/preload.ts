import { plugin } from 'bun';

plugin({
  name: 'typia-stub',
  setup(build) {
    // onResolve only works in Bun.build, not bun run.
    // onLoad matches by resolved file path, so target typia's entry point directly.
    build.onLoad({ filter: /node_modules\/typia\/lib\/index\.mjs$/ }, () => ({
      contents: 'export default { assert: (v) => v };',
      loader: 'js',
    }));
  },
});
