/**
 * The compass heading encoding shared by SeaTalk datagrams 0x84 and 0x9C.
 *
 * Thomas Knauf's SeaTalk Technical Reference states it in prose:
 *
 *     the two lower bits of U * 90 +
 *     the six lower bits of VW * 2 +
 *     number of bits set in the two higher bits of U
 *
 * The shorthand he prints beside that prose,
 * `(U & 0x3) * 90 + (VW & 0x3F) * 2 + (U & 0xC ? (U & 0xC == 0xC ? 2 : 1) : 0)`,
 * does not implement it: in C, `==` binds tighter than `&`, so `U & 0xC == 0xC`
 * collapses to `U & 1` and the last term ends up keyed on bit 0 of U — a bit
 * that already belongs to the `* 90` term. Transliterating the shorthand put a
 * one degree error on six of the sixteen values U can take, namely those where
 * bit 0 disagrees with the number of high bits set. The prose is the
 * specification, so the term below counts the bits it names.
 *
 * Reference: http://www.thomasknauf.de/rap/seatalk2.htm
 */
export function compassHeadingDegrees(U: number, VW: number): number {
  const bitsSetInHighNibblePair = ((U >> 2) & 0x1) + ((U >> 3) & 0x1)
  return (U & 0x3) * 90 + (VW & 0x3f) * 2 + bitsSetInHighNibblePair
}
