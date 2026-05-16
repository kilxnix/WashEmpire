# Prototype 3D Assets

Drop generated `.glb` files into `public/prototype-assets/assets/`, then flip the matching `visible` flag in `manifest.json` to `true`.

The web app checks that each GLB exists before loading it, so missing prototype assets do not break the scene.
