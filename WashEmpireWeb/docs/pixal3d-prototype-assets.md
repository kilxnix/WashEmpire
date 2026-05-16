# Pixal3D Prototype Asset Workflow

This is the fast path for improving Wash Empire visuals with generated GLB props.

## Target Props

- `change-vending-alcove`: brick change/vending wall, awning, change machine, vending cabinets.
- `self-serve-control-box`: blue bay payment/control box with timer, slots, card swipe, mode buttons.
- `vacuum-island`: vacuum island posts, hoses, pad markings, sign.
- `wash-wand-hose`: wand/gun, hose loop, wall hanger.

## Colab

Open `tools/colab/pixal3d_wash_empire_assets.ipynb` in Google Colab with a GPU runtime.

The notebook expects one clean front/three-quarter reference PNG per prop:

```text
change-vending-alcove.png
self-serve-control-box.png
vacuum-island.png
wash-wand-hose.png
```

It exports `wash-empire-pixal3d-assets.zip`.

## Local Import

Unzip the output so the folder looks like this:

```text
public/prototype-assets/manifest.json
public/prototype-assets/assets/change-vending-alcove.glb
public/prototype-assets/assets/self-serve-control-box.glb
public/prototype-assets/assets/vacuum-island.glb
public/prototype-assets/assets/wash-wand-hose.glb
```

Then run:

```powershell
npm.cmd run build
npm.cmd run audit:smoke-ui
```

The scene loader ignores missing files, so you can bring the assets in one at a time.
