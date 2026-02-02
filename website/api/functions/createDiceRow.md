# Function: createDiceRow()

> **createDiceRow**(`options`, `buff`): [`VGroup`](../classes/VGroup.md)

Defined in: [mobjects/probability/DiceFace.ts:316](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/probability/DiceFace.ts#L316)

Create a VGroup containing all six die faces arranged in a row.

## Parameters

### options

`Omit`\<[`DiceFaceOptions`](../interfaces/DiceFaceOptions.md), `"value"` \| `"center"`\> = `{}`

Shared options applied to each DiceFace

### buff

`number` = `0.3`

Buffer/spacing between faces. Default: 0.3

## Returns

[`VGroup`](../classes/VGroup.md)

A VGroup containing DiceFace mobjects for values 1-6

## Example

```typescript
const allFaces = createDiceRow({ size: 1 });
scene.add(allFaces);
```
