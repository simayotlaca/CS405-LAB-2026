# CS405 Lab 1

A coloured square drawn with two triangles in WebGPU. It rotates with time and follows the mouse.

## Run

In this folder, run:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000 in a browser with WebGPU support. Check the console for `WebGPU ready`.

## Notes

The completed TODOs cover device and canvas setup, shaders and a render pipeline, vertex colours, rotation, and the square with aspect correction and mouse tracking.

The uniform buffer contains four floats (16 bytes): time, aspect ratio, mouse X and mouse Y. The vertex shader rotates each point using the lab example: `x*cos(a) - y*sin(a)` and `x*sin(a) + y*cos(a)`.

Dividing the rotated X coordinate by `canvas.width / canvas.height` keeps the shape square. Mouse pixels are converted to clip coordinates in `[-1, 1]` and added after aspect correction. Shared vertices use matching colours.

- `index.html`: canvas and a short help message.
- `main.js`: WebGPU setup, shaders and the animation loop.
- `screenshots/`: examples of rotation, mouse movement and resizing.
