# Function: linspace()

> **linspace**(`start`, `stop`, `num`): `number`[]

Defined in: [utils/vectors.ts:80](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/utils/vectors.ts#L80)

Create an array of evenly spaced values (NumPy linspace equivalent).

## Parameters

### start

`number`

Start value

### stop

`number`

End value (inclusive)

### num

`number`

Number of points to generate

## Returns

`number`[]

Array of `num` evenly spaced values from `start` to `stop`

## Example

```ts
linspace(0, 10, 5)  // [0, 2.5, 5, 7.5, 10]
linspace(0, 1, 3)   // [0, 0.5, 1]
```
