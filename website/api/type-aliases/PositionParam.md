# Type Alias: PositionParam

> **PositionParam** = `number` \| `string`

Defined in: [animation/Timeline.ts:16](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/animation/Timeline.ts#L16)

Position parameter for adding animations to the timeline.
- Number: absolute time in seconds
- '+=N': N seconds after the last animation ends
- '-=N': N seconds before the last animation ends
- '<': same start time as the previous animation
- '>': end of the previous animation (default)
