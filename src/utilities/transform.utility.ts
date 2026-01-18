function safeBigintToNumber(x: string | number | bigint): number {
  const value = BigInt(x);
  const max = BigInt(Number.MAX_SAFE_INTEGER);
  const min = BigInt(Number.MIN_SAFE_INTEGER);
  if (value > max || value < min) {
    throw new RangeError("bigint out of safe number range");
  }
  return Number(value);
}

export { safeBigintToNumber };
