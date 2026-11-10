# Plotfoundry for JavaScript — unreleased scaffold

This independent dependency-free ESM package exposes only `packageInfo()`. It
works in a plain browser or Node; no htmpres, Quarto, Python, R, build service or
repository checkout is required at runtime. Plotting APIs/data are not implemented.

Run `npm pack` inside this directory. Install the resulting local tarball with
`npm install /path/to/plotfoundry-0.1.0-dev.0.tgz` in a clean project. No public npm
publication, CDN address or account ownership is claimed.

```js
import {packageInfo} from "plotfoundry";
console.log(packageInfo());
```

The function returns a fresh object with name, version and `status: "scaffold"`.
The independent version in `package.json` and the native ESM entry must agree.
There are no installation scripts or runtime dependencies. Serve your consumer
project and visit `node_modules/plotfoundry/examples/browser.html` to exercise the
installed browser ESM entry, without a bundler/CDN. `exports["."]` exposes that
same source to package-aware consumers. `examples/hello.mjs` is a standalone Node
example. This new scaffold is MIT licensed; see `LICENSE`.
