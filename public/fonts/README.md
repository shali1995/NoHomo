# public/fonts

Aeonik Regular, Medium and Bold as `.woff2` — `Aeonik-Regular.woff2`,
`Aeonik-Medium.woff2`, `Aeonik-Bold.woff2` — taken from the capture's `assets/fonts/`,
not from a font foundry. `src/app.css` carries the capture's own `@font-face` rules and
declares a fourth face, an italic `.otf` at `/fonts/aeonik-regularitalic.otf`, which
the capture referenced but never stored; that file is not here, so the build warns
about the URL failing to resolve.
