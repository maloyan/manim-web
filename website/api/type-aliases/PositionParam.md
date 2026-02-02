# Type Alias: PositionParam

> **PositionParam** = `number` \| `string`

Defined in: [animation/Timeline.ts:16](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/animation/Timeline.ts#L16)

Position parameter for adding animations to the timeline.
- Number: absolute time in seconds
- '+=N': N seconds after the last animation ends
- '-=N': N seconds before the last animation ends
- '<': same start time as the previous animation
- '>': end of the previous animation (default)
