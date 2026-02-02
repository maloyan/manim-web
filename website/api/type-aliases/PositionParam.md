# Type Alias: PositionParam

> **PositionParam** = `number` \| `string`

Defined in: [animation/Timeline.ts:16](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/animation/Timeline.ts#L16)

Position parameter for adding animations to the timeline.
- Number: absolute time in seconds
- '+=N': N seconds after the last animation ends
- '-=N': N seconds before the last animation ends
- '<': same start time as the previous animation
- '>': end of the previous animation (default)
