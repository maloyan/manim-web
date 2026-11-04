"""ManimCE reference scenes for the parity harness.

Each class has a manim-web twin of the same name in `scenes.ts`. Keep the two
in lockstep: same mobjects, same options, same animations, same run times.
Most scenes follow the ManimCE tutorial and example gallery.
"""

from manim import *  # noqa: F403

config.background_color = BLACK


class CreateCircle(Scene):
    def construct(self):
        circle = Circle()
        circle.set_fill(PINK, opacity=0.5)
        self.play(Create(circle))
        self.wait(0.5)


class SquareToCircle(Scene):
    def construct(self):
        circle = Circle()
        circle.set_fill(PINK, opacity=0.5)
        square = Square()
        square.rotate(PI / 4)
        self.play(Create(square))
        self.play(Transform(square, circle))
        self.play(FadeOut(square))


class AnimatedSquareToCircle(Scene):
    def construct(self):
        circle = Circle()
        square = Square()
        self.play(Create(square))
        self.play(square.animate.rotate(PI / 4))
        self.play(ReplacementTransform(square, circle))
        self.play(circle.animate.set_fill(PINK, opacity=0.5))


class DifferentRotations(Scene):
    def construct(self):
        left_square = Square(color=BLUE, fill_opacity=0.7).shift(2 * LEFT)
        right_square = Square(color=GREEN, fill_opacity=0.7).shift(2 * RIGHT)
        self.add(left_square, right_square)
        self.play(left_square.animate.rotate(PI), Rotate(right_square, angle=PI), run_time=2)
        self.wait(0.5)


class FadeAndGrow(Scene):
    def construct(self):
        square = Square(color=BLUE, fill_opacity=0.5).shift(2 * LEFT)
        circle = Circle(color=YELLOW, fill_opacity=0.5).shift(2 * RIGHT)
        self.play(FadeIn(square, shift=UP))
        self.play(GrowFromCenter(circle))
        self.play(Indicate(square))
        self.play(FadeOut(square, shift=DOWN), FadeOut(circle))


class MathTexWrite(Scene):
    def construct(self):
        tex = MathTex(r"e^{i\pi} + 1 = 0", font_size=96)
        self.play(Write(tex))
        self.wait(0.5)


class TextWrite(Scene):
    def construct(self):
        text = Text("Hello, Manim", font_size=72)
        self.play(Write(text))
        self.wait(0.5)


class AxesPlot(Scene):
    def construct(self):
        axes = Axes(x_range=[-3, 3, 1], y_range=[-2, 2, 1], x_length=8, y_length=5)
        graph = axes.plot(lambda x: np.sin(2 * x), color=BLUE)
        self.play(Create(axes))
        self.play(Create(graph))
        self.wait(0.5)


class UpdaterDot(Scene):
    def construct(self):
        t = ValueTracker(0)
        dot = Dot(color=YELLOW).move_to(2 * RIGHT)
        line = Line(ORIGIN, dot.get_center(), color=BLUE)
        dot.add_updater(lambda d: d.move_to([2 * np.cos(t.get_value()), 2 * np.sin(t.get_value()), 0]))
        line.add_updater(lambda l: l.put_start_and_end_on(ORIGIN, dot.get_center()))
        self.add(line, dot)
        self.play(t.animate.set_value(PI), run_time=2)
        self.wait(0.5)


class ArrowsAndLines(Scene):
    def construct(self):
        arrow = Arrow(LEFT * 3 + UP, RIGHT * 3 + UP, color=RED)
        double = DoubleArrow(LEFT * 3, RIGHT * 3, color=GREEN)
        dashed = DashedLine(LEFT * 3 + DOWN, RIGHT * 3 + DOWN, color=YELLOW)
        self.play(Create(arrow), Create(double), Create(dashed))
        self.wait(0.5)
