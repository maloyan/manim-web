# Scene serialization

Serialize a scene or a single mobject to a plain, JSON-safe document, store or
deep-link it, then reload it in another session. Closes issue #244.

## What this covers

This version serializes **state**: the mobjects in a scene and their
properties. It does not replay animations or restore a timeline.

For each mobject it captures:

- the **type** name (the class name),
- the **constructor-relevant props** (unscaled geometry, e.g. a circle's
  radius, a rectangle's width and height, a polygon's vertices),
- the **transform** (position, rotation, scale),
- the **style** (stroke color, fill color, stroke opacity, fill opacity,
  stroke width),
- the **submobject tree** (children, recursively).

Props hold the _base_ (pre-scale) size and the transform holds the scale, so
`serialize -> deserialize -> serialize` is stable for the supported types.

## Public API

- `serializeScene(scene)` -> `SerializedScene` (a JSON document).
- `deserializeScene(json, container)` -> the rebuilt top-level mobjects, each
  added to `container` (a scene or anything with an `add(...)` method).
- `serializeMobject(mobject)` / `deserializeMobject(json)` for one mobject.
- `registerSerializableMobject(name, { serialize, deserialize })` to add a new
  type. `name` must equal the class name. `serialize` returns only the
  type-specific props; the framework captures transform, style, and children.
- `unregisterSerializableMobject(name)`, `getSerializableTypes()`,
  `getSerializer(name)`.

## Covered types

Geometry: `Circle`, `Square`, `Rectangle`, `Line`, `Dot`, `Polygon`.
Groups: `Group`, `VGroup`.
Text: `Text`, `MathTex`.

## Not covered

- Animation timelines and replay.
- Mobject subtypes without their own registration (e.g. `Triangle`, `Arrow`,
  `Arc`). These serialize with `unknown: true` and are skipped on restore, so a
  document round-trips without throwing. Register a serializer to add support.
- Type lookup uses the runtime class name. A build that mangles class names
  would break the mapping; the library ships unmangled.
