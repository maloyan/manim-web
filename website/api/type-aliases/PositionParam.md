# Type Alias: PositionParam

> **PositionParam** = `number` \| `string`

Defined in: [animation/Timeline.ts:16](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/animation/Timeline.ts#L16)

Position parameter for adding animations to the timeline.
- Number: absolute time in seconds
- '+=N': N seconds after the last animation ends
- '-=N': N seconds before the last animation ends
- '<': same start time as the previous animation
- '>': end of the previous animation (default)
