function safeBigintToNumber(x: bigint): number {
  const max = BigInt(Number.MAX_SAFE_INTEGER);
  const min = BigInt(Number.MIN_SAFE_INTEGER);
  if (x > max || x < min) {
    throw new RangeError("bigint out of safe number range");
  }
  return Number(x);
}

export { safeBigintToNumber };
