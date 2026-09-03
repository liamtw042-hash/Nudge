# Nudge — design notes

The app is a physical object: a kitchen timer that talks. Everything below follows from that.

## The dial

The signature element is a ring of sixty ticks, like the minute marks on a wind-up kitchen timer. Every fifth tick is longer, the way a clock face is drawn. All sixty are always printed on the face; what changes is which ones are lit in the routine's colour and which have gone out to a spent paper tone.

As a step runs, ticks go out one at a time from the end of the wound section back toward twelve o'clock. What remains is always a solid wedge anchored at the top, which is how the remaining time on a real timer reads. Ticks go out instantly, like something mechanical. They come back on with a short wind when a step starts or when two minutes are added, because that is what winding a timer looks like.

Sixty discrete ticks rather than a smooth arc is a deliberate choice. A smooth arc is what every timer app does. Discrete ticks read from across a room, feel made rather than rendered, and make progress visibly happen in small events rather than a slow smear. On a two minute step a tick goes out every two seconds.

The reward lives on the dial. When a step completes, one of three things happens: the whole ring floods with the reward colour and slowly settles; a sweep lights the ticks around the ring and then dissolves; or the dial swells slightly and settles back. Which one, in which colour, with which sound, rotates. About one in eleven completions is bigger (a four note chime, a heavier haptic sequence, the swell). About one in ten is nothing but the page turning. A reward the brain can predict stops being a reward.

## Typefaces

**Fraunces** for the step text, routine names and the sign-off. It is a soft serif built on old display faces like Windsor and Cooper: warm, a little buttery, with real character in the lowercase. At 40pt it reads as a kind voice rather than a system message, which matters at 6am with one eye open. It is also slightly odd, and that oddness is why it doesn't look like every other app.

**IBM Plex Mono** for everything that is an instrument reading: the numeral in the dial, durations, step counts, and all the small labels and buttons. Tabular figures so the countdown doesn't wobble. Mono caps with wide tracking is the language of good hardware panels. It is the honest, slightly dry counterpart to Fraunces' warmth.

Two families, committed to. Nothing else. Buttons are words, not icons, because at 6am a word is quicker to trust than a glyph.

## Palette

The base is unbleached paper, `#F3EDE2`, not white. Ink is a warm near-black, `#26211D`, not `#000`. Secondary ink and hairlines are the same brown family let down with paper.

The accent is terracotta, `#B85C3C`: the colour of an unglazed clay pot, taken down a shade so it sits calmly on the paper. It is warm without being an alarm, it is the colour of a cheap tomato kitchen timer softened, and it is not blue, purple or teal.

Each routine wears one of five glazes: clay, ochre, moss, plum, slate. They are the same family of muted pottery colours so a screen never looks like a colour picker exploded. The rewards borrow from all five, so completions vary in colour without ever leaving the palette.

## Layout and motion

Type does the work. There are no cards, no borders around things, no shadows. Space and hairline rules separate content, the way a notebook page does. The big round Done button is the button on top of the timer: ink, 104pt, centred where a thumb lands.

Motion has weight and nothing bounces. Steps turn like a page: the old text drifts up and fades over 420ms, the new one settles in from below over 650ms, with a custom ease that starts firm and lands soft. The next step's timer starts only after the turn, so the dial is never seen already draining.

## Copy

Calm, plain, a bit dry. "Water. A whole glass. One minute." The voice reads exactly what is on screen. Sign-offs rotate through seven lines like "Six things. That'll do." and "That took eleven minutes. Not bad." They say what happened. Nothing anywhere says what didn't.
