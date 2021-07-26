/// Users/yisheng/Documents/GitHub/musicdsp/source/Other/133-fast-power-and-root-estimates-for-32bit-floats.rst
float fastpower(float f, int n) {
  long *lp, l;
  lp = (long *)(&f);
  l = *lp;
  l -= 0x3F800000l;
  l <<= (n - 1);
  l += 0x3F800000l;
  *lp = l;
  return f;
}