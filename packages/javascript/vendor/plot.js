// node_modules/d3-array/dist/d3-array.mjs
function ascending(a2, b) {
  return a2 == null || b == null ? NaN : a2 < b ? -1 : a2 > b ? 1 : a2 >= b ? 0 : NaN;
}
function descending(a2, b) {
  return a2 == null || b == null ? NaN : b < a2 ? -1 : b > a2 ? 1 : b >= a2 ? 0 : NaN;
}
function bisector(f) {
  let compare1, compare2, delta;
  if (f.length !== 2) {
    compare1 = ascending;
    compare2 = (d, x2) => ascending(f(d), x2);
    delta = (d, x2) => f(d) - x2;
  } else {
    compare1 = f === ascending || f === descending ? f : zero;
    compare2 = f;
    delta = f;
  }
  function left2(a2, x2, lo = 0, hi = a2.length) {
    if (lo < hi) {
      if (compare1(x2, x2) !== 0) return hi;
      do {
        const mid2 = lo + hi >>> 1;
        if (compare2(a2[mid2], x2) < 0) lo = mid2 + 1;
        else hi = mid2;
      } while (lo < hi);
    }
    return lo;
  }
  function right2(a2, x2, lo = 0, hi = a2.length) {
    if (lo < hi) {
      if (compare1(x2, x2) !== 0) return hi;
      do {
        const mid2 = lo + hi >>> 1;
        if (compare2(a2[mid2], x2) <= 0) lo = mid2 + 1;
        else hi = mid2;
      } while (lo < hi);
    }
    return lo;
  }
  function center2(a2, x2, lo = 0, hi = a2.length) {
    const i = left2(a2, x2, lo, hi - 1);
    return i > lo && delta(a2[i - 1], x2) > -delta(a2[i], x2) ? i - 1 : i;
  }
  return { left: left2, center: center2, right: right2 };
}
function zero() {
  return 0;
}
function number(x2) {
  return x2 === null ? NaN : +x2;
}
function* numbers(values2, valueof2) {
  if (valueof2 === void 0) {
    for (let value2 of values2) {
      if (value2 != null && (value2 = +value2) >= value2) {
        yield value2;
      }
    }
  } else {
    let index2 = -1;
    for (let value2 of values2) {
      if ((value2 = valueof2(value2, ++index2, values2)) != null && (value2 = +value2) >= value2) {
        yield value2;
      }
    }
  }
}
var ascendingBisect = bisector(ascending);
var bisectRight = ascendingBisect.right;
var bisectLeft = ascendingBisect.left;
var bisectCenter = bisector(number).center;
var blur2 = Blur2(blurf);
var blurImage = Blur2(blurfImage);
function Blur2(blur) {
  return function(data, rx, ry = rx) {
    if (!((rx = +rx) >= 0)) throw new RangeError("invalid rx");
    if (!((ry = +ry) >= 0)) throw new RangeError("invalid ry");
    let { data: values2, width, height } = data;
    if (!((width = Math.floor(width)) >= 0)) throw new RangeError("invalid width");
    if (!((height = Math.floor(height !== void 0 ? height : values2.length / width)) >= 0)) throw new RangeError("invalid height");
    if (!width || !height || !rx && !ry) return data;
    const blurx = rx && blur(rx);
    const blury = ry && blur(ry);
    const temp = values2.slice();
    if (blurx && blury) {
      blurh(blurx, temp, values2, width, height);
      blurh(blurx, values2, temp, width, height);
      blurh(blurx, temp, values2, width, height);
      blurv(blury, values2, temp, width, height);
      blurv(blury, temp, values2, width, height);
      blurv(blury, values2, temp, width, height);
    } else if (blurx) {
      blurh(blurx, values2, temp, width, height);
      blurh(blurx, temp, values2, width, height);
      blurh(blurx, values2, temp, width, height);
    } else if (blury) {
      blurv(blury, values2, temp, width, height);
      blurv(blury, temp, values2, width, height);
      blurv(blury, values2, temp, width, height);
    }
    return data;
  };
}
function blurh(blur, T, S, w, h) {
  for (let y2 = 0, n = w * h; y2 < n; ) {
    blur(T, S, y2, y2 += w, 1);
  }
}
function blurv(blur, T, S, w, h) {
  for (let x2 = 0, n = w * h; x2 < w; ++x2) {
    blur(T, S, x2, x2 + n, w);
  }
}
function blurfImage(radius2) {
  const blur = blurf(radius2);
  return (T, S, start, stop, step2) => {
    start <<= 2, stop <<= 2, step2 <<= 2;
    blur(T, S, start + 0, stop + 0, step2);
    blur(T, S, start + 1, stop + 1, step2);
    blur(T, S, start + 2, stop + 2, step2);
    blur(T, S, start + 3, stop + 3, step2);
  };
}
function blurf(radius2) {
  const radius0 = Math.floor(radius2);
  if (radius0 === radius2) return bluri(radius2);
  const t = radius2 - radius0;
  const w = 2 * radius2 + 1;
  return (T, S, start, stop, step2) => {
    if (!((stop -= step2) >= start)) return;
    let sum3 = radius0 * S[start];
    const s0 = step2 * radius0;
    const s1 = s0 + step2;
    for (let i = start, j = start + s0; i < j; i += step2) {
      sum3 += S[Math.min(stop, i)];
    }
    for (let i = start, j = stop; i <= j; i += step2) {
      sum3 += S[Math.min(stop, i + s0)];
      T[i] = (sum3 + t * (S[Math.max(start, i - s1)] + S[Math.min(stop, i + s1)])) / w;
      sum3 -= S[Math.max(start, i - s0)];
    }
  };
}
function bluri(radius2) {
  const w = 2 * radius2 + 1;
  return (T, S, start, stop, step2) => {
    if (!((stop -= step2) >= start)) return;
    let sum3 = radius2 * S[start];
    const s2 = step2 * radius2;
    for (let i = start, j = start + s2; i < j; i += step2) {
      sum3 += S[Math.min(stop, i)];
    }
    for (let i = start, j = stop; i <= j; i += step2) {
      sum3 += S[Math.min(stop, i + s2)];
      T[i] = sum3 / w;
      sum3 -= S[Math.max(start, i - s2)];
    }
  };
}
function count(values2, valueof2) {
  let count3 = 0;
  if (valueof2 === void 0) {
    for (let value2 of values2) {
      if (value2 != null && (value2 = +value2) >= value2) {
        ++count3;
      }
    }
  } else {
    let index2 = -1;
    for (let value2 of values2) {
      if ((value2 = valueof2(value2, ++index2, values2)) != null && (value2 = +value2) >= value2) {
        ++count3;
      }
    }
  }
  return count3;
}
function length$1(array5) {
  return array5.length | 0;
}
function empty(length2) {
  return !(length2 > 0);
}
function arrayify(values2) {
  return typeof values2 !== "object" || "length" in values2 ? values2 : Array.from(values2);
}
function reducer(reduce) {
  return (values2) => reduce(...values2);
}
function cross(...values2) {
  const reduce = typeof values2[values2.length - 1] === "function" && reducer(values2.pop());
  values2 = values2.map(arrayify);
  const lengths = values2.map(length$1);
  const j = values2.length - 1;
  const index2 = new Array(j + 1).fill(0);
  const product = [];
  if (j < 0 || lengths.some(empty)) return product;
  while (true) {
    product.push(index2.map((j2, i2) => values2[i2][j2]));
    let i = j;
    while (++index2[i] === lengths[i]) {
      if (i === 0) return reduce ? product.map(reduce) : product;
      index2[i--] = 0;
    }
  }
}
function cumsum(values2, valueof2) {
  var sum3 = 0, index2 = 0;
  return Float64Array.from(values2, valueof2 === void 0 ? (v) => sum3 += +v || 0 : (v) => sum3 += +valueof2(v, index2++, values2) || 0);
}
function variance(values2, valueof2) {
  let count3 = 0;
  let delta;
  let mean2 = 0;
  let sum3 = 0;
  if (valueof2 === void 0) {
    for (let value2 of values2) {
      if (value2 != null && (value2 = +value2) >= value2) {
        delta = value2 - mean2;
        mean2 += delta / ++count3;
        sum3 += delta * (value2 - mean2);
      }
    }
  } else {
    let index2 = -1;
    for (let value2 of values2) {
      if ((value2 = valueof2(value2, ++index2, values2)) != null && (value2 = +value2) >= value2) {
        delta = value2 - mean2;
        mean2 += delta / ++count3;
        sum3 += delta * (value2 - mean2);
      }
    }
  }
  if (count3 > 1) return sum3 / (count3 - 1);
}
function deviation(values2, valueof2) {
  const v = variance(values2, valueof2);
  return v ? Math.sqrt(v) : v;
}
function extent(values2, valueof2) {
  let min3;
  let max2;
  if (valueof2 === void 0) {
    for (const value2 of values2) {
      if (value2 != null) {
        if (min3 === void 0) {
          if (value2 >= value2) min3 = max2 = value2;
        } else {
          if (min3 > value2) min3 = value2;
          if (max2 < value2) max2 = value2;
        }
      }
    }
  } else {
    let index2 = -1;
    for (let value2 of values2) {
      if ((value2 = valueof2(value2, ++index2, values2)) != null) {
        if (min3 === void 0) {
          if (value2 >= value2) min3 = max2 = value2;
        } else {
          if (min3 > value2) min3 = value2;
          if (max2 < value2) max2 = value2;
        }
      }
    }
  }
  return [min3, max2];
}
var Adder = class {
  constructor() {
    this._partials = new Float64Array(32);
    this._n = 0;
  }
  add(x2) {
    const p = this._partials;
    let i = 0;
    for (let j = 0; j < this._n && j < 32; j++) {
      const y2 = p[j], hi = x2 + y2, lo = Math.abs(x2) < Math.abs(y2) ? x2 - (hi - y2) : y2 - (hi - x2);
      if (lo) p[i++] = lo;
      x2 = hi;
    }
    p[i] = x2;
    this._n = i + 1;
    return this;
  }
  valueOf() {
    const p = this._partials;
    let n = this._n, x2, y2, lo, hi = 0;
    if (n > 0) {
      hi = p[--n];
      while (n > 0) {
        x2 = hi;
        y2 = p[--n];
        hi = x2 + y2;
        lo = y2 - (hi - x2);
        if (lo) break;
      }
      if (n > 0 && (lo < 0 && p[n - 1] < 0 || lo > 0 && p[n - 1] > 0)) {
        y2 = lo * 2;
        x2 = hi + y2;
        if (y2 == x2 - hi) hi = x2;
      }
    }
    return hi;
  }
};
var InternMap = class extends Map {
  constructor(entries, key = keyof) {
    super();
    Object.defineProperties(this, { _intern: { value: /* @__PURE__ */ new Map() }, _key: { value: key } });
    if (entries != null) for (const [key2, value2] of entries) this.set(key2, value2);
  }
  get(key) {
    return super.get(intern_get(this, key));
  }
  has(key) {
    return super.has(intern_get(this, key));
  }
  set(key, value2) {
    return super.set(intern_set(this, key), value2);
  }
  delete(key) {
    return super.delete(intern_delete(this, key));
  }
};
var InternSet = class extends Set {
  constructor(values2, key = keyof) {
    super();
    Object.defineProperties(this, { _intern: { value: /* @__PURE__ */ new Map() }, _key: { value: key } });
    if (values2 != null) for (const value2 of values2) this.add(value2);
  }
  has(value2) {
    return super.has(intern_get(this, value2));
  }
  add(value2) {
    return super.add(intern_set(this, value2));
  }
  delete(value2) {
    return super.delete(intern_delete(this, value2));
  }
};
function intern_get({ _intern, _key }, value2) {
  const key = _key(value2);
  return _intern.has(key) ? _intern.get(key) : value2;
}
function intern_set({ _intern, _key }, value2) {
  const key = _key(value2);
  if (_intern.has(key)) return _intern.get(key);
  _intern.set(key, value2);
  return value2;
}
function intern_delete({ _intern, _key }, value2) {
  const key = _key(value2);
  if (_intern.has(key)) {
    value2 = _intern.get(key);
    _intern.delete(key);
  }
  return value2;
}
function keyof(value2) {
  return value2 !== null && typeof value2 === "object" ? value2.valueOf() : value2;
}
function identity(x2) {
  return x2;
}
function group(values2, ...keys) {
  return nest(values2, identity, identity, keys);
}
function rollup(values2, reduce, ...keys) {
  return nest(values2, identity, reduce, keys);
}
function rollups(values2, reduce, ...keys) {
  return nest(values2, Array.from, reduce, keys);
}
function nest(values2, map3, reduce, keys) {
  return (function regroup(values3, i) {
    if (i >= keys.length) return reduce(values3);
    const groups = new InternMap();
    const keyof3 = keys[i++];
    let index2 = -1;
    for (const value2 of values3) {
      const key = keyof3(value2, ++index2, values3);
      const group3 = groups.get(key);
      if (group3) group3.push(value2);
      else groups.set(key, [value2]);
    }
    for (const [key, values4] of groups) {
      groups.set(key, regroup(values4, i));
    }
    return map3(groups);
  })(values2, 0);
}
function permute(source, keys) {
  return Array.from(keys, (key) => source[key]);
}
function sort(values2, ...F) {
  if (typeof values2[Symbol.iterator] !== "function") throw new TypeError("values is not iterable");
  values2 = Array.from(values2);
  let [f] = F;
  if (f && f.length !== 2 || F.length > 1) {
    const index2 = Uint32Array.from(values2, (d, i) => i);
    if (F.length > 1) {
      F = F.map((f2) => values2.map(f2));
      index2.sort((i, j) => {
        for (const f2 of F) {
          const c3 = ascendingDefined(f2[i], f2[j]);
          if (c3) return c3;
        }
      });
    } else {
      f = values2.map(f);
      index2.sort((i, j) => ascendingDefined(f[i], f[j]));
    }
    return permute(values2, index2);
  }
  return values2.sort(compareDefined(f));
}
function compareDefined(compare = ascending) {
  if (compare === ascending) return ascendingDefined;
  if (typeof compare !== "function") throw new TypeError("compare is not a function");
  return (a2, b) => {
    const x2 = compare(a2, b);
    if (x2 || x2 === 0) return x2;
    return (compare(b, b) === 0) - (compare(a2, a2) === 0);
  };
}
function ascendingDefined(a2, b) {
  return (a2 == null || !(a2 >= a2)) - (b == null || !(b >= b)) || (a2 < b ? -1 : a2 > b ? 1 : 0);
}
function groupSort(values2, reduce, key) {
  return (reduce.length !== 2 ? sort(rollup(values2, reduce, key), (([ak, av], [bk, bv]) => ascending(av, bv) || ascending(ak, bk))) : sort(group(values2, key), (([ak, av], [bk, bv]) => reduce(av, bv) || ascending(ak, bk)))).map(([key2]) => key2);
}
var array = Array.prototype;
var slice = array.slice;
var e10 = Math.sqrt(50);
var e5 = Math.sqrt(10);
var e2 = Math.sqrt(2);
function tickSpec(start, stop, count3) {
  const step2 = (stop - start) / Math.max(0, count3), power = Math.floor(Math.log10(step2)), error = step2 / Math.pow(10, power), factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1;
  let i1, i2, inc2;
  if (power < 0) {
    inc2 = Math.pow(10, -power) / factor;
    i1 = Math.round(start * inc2);
    i2 = Math.round(stop * inc2);
    if (i1 / inc2 < start) ++i1;
    if (i2 / inc2 > stop) --i2;
    inc2 = -inc2;
  } else {
    inc2 = Math.pow(10, power) * factor;
    i1 = Math.round(start / inc2);
    i2 = Math.round(stop / inc2);
    if (i1 * inc2 < start) ++i1;
    if (i2 * inc2 > stop) --i2;
  }
  if (i2 < i1 && 0.5 <= count3 && count3 < 2) return tickSpec(start, stop, count3 * 2);
  return [i1, i2, inc2];
}
function ticks(start, stop, count3) {
  stop = +stop, start = +start, count3 = +count3;
  if (!(count3 > 0)) return [];
  if (start === stop) return [start];
  const reverse3 = stop < start, [i1, i2, inc2] = reverse3 ? tickSpec(stop, start, count3) : tickSpec(start, stop, count3);
  if (!(i2 >= i1)) return [];
  const n = i2 - i1 + 1, ticks2 = new Array(n);
  if (reverse3) {
    if (inc2 < 0) for (let i = 0; i < n; ++i) ticks2[i] = (i2 - i) / -inc2;
    else for (let i = 0; i < n; ++i) ticks2[i] = (i2 - i) * inc2;
  } else {
    if (inc2 < 0) for (let i = 0; i < n; ++i) ticks2[i] = (i1 + i) / -inc2;
    else for (let i = 0; i < n; ++i) ticks2[i] = (i1 + i) * inc2;
  }
  return ticks2;
}
function tickIncrement(start, stop, count3) {
  stop = +stop, start = +start, count3 = +count3;
  return tickSpec(start, stop, count3)[2];
}
function tickStep(start, stop, count3) {
  stop = +stop, start = +start, count3 = +count3;
  const reverse3 = stop < start, inc2 = reverse3 ? tickIncrement(stop, start, count3) : tickIncrement(start, stop, count3);
  return (reverse3 ? -1 : 1) * (inc2 < 0 ? 1 / -inc2 : inc2);
}
function nice(start, stop, count3) {
  let prestep;
  while (true) {
    const step2 = tickIncrement(start, stop, count3);
    if (step2 === prestep || step2 === 0 || !isFinite(step2)) {
      return [start, stop];
    } else if (step2 > 0) {
      const i = Math.ceil(start / step2);
      const j = Math.floor(stop / step2);
      start = (i - (i * step2 > start)) * step2;
      stop = (j + (j * step2 < stop)) * step2;
    } else if (step2 < 0) {
      const s2 = -step2;
      const i = Math.ceil(start * s2);
      const j = Math.floor(stop * s2);
      start = (i - (i / s2 > start)) / s2;
      stop = (j + (j / s2 < stop)) / s2;
    }
    prestep = step2;
  }
}
function thresholdSturges(values2) {
  return Math.max(1, Math.ceil(Math.log(count(values2)) / Math.LN2) + 1);
}
function max(values2, valueof2) {
  let max2;
  if (valueof2 === void 0) {
    for (const value2 of values2) {
      if (value2 != null && (max2 < value2 || max2 === void 0 && value2 >= value2)) {
        max2 = value2;
      }
    }
  } else {
    let index2 = -1;
    for (let value2 of values2) {
      if ((value2 = valueof2(value2, ++index2, values2)) != null && (max2 < value2 || max2 === void 0 && value2 >= value2)) {
        max2 = value2;
      }
    }
  }
  return max2;
}
function maxIndex(values2, valueof2) {
  let max2;
  let maxIndex2 = -1;
  let index2 = -1;
  if (valueof2 === void 0) {
    for (const value2 of values2) {
      ++index2;
      if (value2 != null && (max2 < value2 || max2 === void 0 && value2 >= value2)) {
        max2 = value2, maxIndex2 = index2;
      }
    }
  } else {
    for (let value2 of values2) {
      if ((value2 = valueof2(value2, ++index2, values2)) != null && (max2 < value2 || max2 === void 0 && value2 >= value2)) {
        max2 = value2, maxIndex2 = index2;
      }
    }
  }
  return maxIndex2;
}
function min(values2, valueof2) {
  let min3;
  if (valueof2 === void 0) {
    for (const value2 of values2) {
      if (value2 != null && (min3 > value2 || min3 === void 0 && value2 >= value2)) {
        min3 = value2;
      }
    }
  } else {
    let index2 = -1;
    for (let value2 of values2) {
      if ((value2 = valueof2(value2, ++index2, values2)) != null && (min3 > value2 || min3 === void 0 && value2 >= value2)) {
        min3 = value2;
      }
    }
  }
  return min3;
}
function minIndex(values2, valueof2) {
  let min3;
  let minIndex2 = -1;
  let index2 = -1;
  if (valueof2 === void 0) {
    for (const value2 of values2) {
      ++index2;
      if (value2 != null && (min3 > value2 || min3 === void 0 && value2 >= value2)) {
        min3 = value2, minIndex2 = index2;
      }
    }
  } else {
    for (let value2 of values2) {
      if ((value2 = valueof2(value2, ++index2, values2)) != null && (min3 > value2 || min3 === void 0 && value2 >= value2)) {
        min3 = value2, minIndex2 = index2;
      }
    }
  }
  return minIndex2;
}
function quickselect(array5, k2, left2 = 0, right2 = Infinity, compare) {
  k2 = Math.floor(k2);
  left2 = Math.floor(Math.max(0, left2));
  right2 = Math.floor(Math.min(array5.length - 1, right2));
  if (!(left2 <= k2 && k2 <= right2)) return array5;
  compare = compare === void 0 ? ascendingDefined : compareDefined(compare);
  while (right2 > left2) {
    if (right2 - left2 > 600) {
      const n = right2 - left2 + 1;
      const m = k2 - left2 + 1;
      const z = Math.log(n);
      const s2 = 0.5 * Math.exp(2 * z / 3);
      const sd = 0.5 * Math.sqrt(z * s2 * (n - s2) / n) * (m - n / 2 < 0 ? -1 : 1);
      const newLeft = Math.max(left2, Math.floor(k2 - m * s2 / n + sd));
      const newRight = Math.min(right2, Math.floor(k2 + (n - m) * s2 / n + sd));
      quickselect(array5, k2, newLeft, newRight, compare);
    }
    const t = array5[k2];
    let i = left2;
    let j = right2;
    swap(array5, left2, k2);
    if (compare(array5[right2], t) > 0) swap(array5, left2, right2);
    while (i < j) {
      swap(array5, i, j), ++i, --j;
      while (compare(array5[i], t) < 0) ++i;
      while (compare(array5[j], t) > 0) --j;
    }
    if (compare(array5[left2], t) === 0) swap(array5, left2, j);
    else ++j, swap(array5, j, right2);
    if (j <= k2) left2 = j + 1;
    if (k2 <= j) right2 = j - 1;
  }
  return array5;
}
function swap(array5, i, j) {
  const t = array5[i];
  array5[i] = array5[j];
  array5[j] = t;
}
function greatest(values2, compare = ascending) {
  let max2;
  let defined2 = false;
  if (compare.length === 1) {
    let maxValue;
    for (const element of values2) {
      const value2 = compare(element);
      if (defined2 ? ascending(value2, maxValue) > 0 : ascending(value2, value2) === 0) {
        max2 = element;
        maxValue = value2;
        defined2 = true;
      }
    }
  } else {
    for (const value2 of values2) {
      if (defined2 ? compare(value2, max2) > 0 : compare(value2, value2) === 0) {
        max2 = value2;
        defined2 = true;
      }
    }
  }
  return max2;
}
function quantile(values2, p, valueof2) {
  values2 = Float64Array.from(numbers(values2, valueof2));
  if (!(n = values2.length) || isNaN(p = +p)) return;
  if (p <= 0 || n < 2) return min(values2);
  if (p >= 1) return max(values2);
  var n, i = (n - 1) * p, i0 = Math.floor(i), value0 = max(quickselect(values2, i0).subarray(0, i0 + 1)), value1 = min(values2.subarray(i0 + 1));
  return value0 + (value1 - value0) * (i - i0);
}
function quantileSorted(values2, p, valueof2 = number) {
  if (!(n = values2.length) || isNaN(p = +p)) return;
  if (p <= 0 || n < 2) return +valueof2(values2[0], 0, values2);
  if (p >= 1) return +valueof2(values2[n - 1], n - 1, values2);
  var n, i = (n - 1) * p, i0 = Math.floor(i), value0 = +valueof2(values2[i0], i0, values2), value1 = +valueof2(values2[i0 + 1], i0 + 1, values2);
  return value0 + (value1 - value0) * (i - i0);
}
function thresholdFreedmanDiaconis(values2, min3, max2) {
  const c3 = count(values2), d = quantile(values2, 0.75) - quantile(values2, 0.25);
  return c3 && d ? Math.ceil((max2 - min3) / (2 * d * Math.pow(c3, -1 / 3))) : 1;
}
function thresholdScott(values2, min3, max2) {
  const c3 = count(values2), d = deviation(values2);
  return c3 && d ? Math.ceil((max2 - min3) * Math.cbrt(c3) / (3.49 * d)) : 1;
}
function mean(values2, valueof2) {
  let count3 = 0;
  let sum3 = 0;
  if (valueof2 === void 0) {
    for (let value2 of values2) {
      if (value2 != null && (value2 = +value2) >= value2) {
        ++count3, sum3 += value2;
      }
    }
  } else {
    let index2 = -1;
    for (let value2 of values2) {
      if ((value2 = valueof2(value2, ++index2, values2)) != null && (value2 = +value2) >= value2) {
        ++count3, sum3 += value2;
      }
    }
  }
  if (count3) return sum3 / count3;
}
function median(values2, valueof2) {
  return quantile(values2, 0.5, valueof2);
}
function* flatten(arrays) {
  for (const array5 of arrays) {
    yield* array5;
  }
}
function merge(arrays) {
  return Array.from(flatten(arrays));
}
function mode(values2, valueof2) {
  const counts = new InternMap();
  if (valueof2 === void 0) {
    for (let value2 of values2) {
      if (value2 != null && value2 >= value2) {
        counts.set(value2, (counts.get(value2) || 0) + 1);
      }
    }
  } else {
    let index2 = -1;
    for (let value2 of values2) {
      if ((value2 = valueof2(value2, ++index2, values2)) != null && value2 >= value2) {
        counts.set(value2, (counts.get(value2) || 0) + 1);
      }
    }
  }
  let modeValue;
  let modeCount = 0;
  for (const [value2, count3] of counts) {
    if (count3 > modeCount) {
      modeCount = count3;
      modeValue = value2;
    }
  }
  return modeValue;
}
function pairs(values2, pairof = pair) {
  const pairs2 = [];
  let previous;
  let first2 = false;
  for (const value2 of values2) {
    if (first2) pairs2.push(pairof(previous, value2));
    previous = value2;
    first2 = true;
  }
  return pairs2;
}
function pair(a2, b) {
  return [a2, b];
}
function range(start, stop, step2) {
  start = +start, stop = +stop, step2 = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step2;
  var i = -1, n = Math.max(0, Math.ceil((stop - start) / step2)) | 0, range3 = new Array(n);
  while (++i < n) {
    range3[i] = start + i * step2;
  }
  return range3;
}
function rank(values2, valueof2 = ascending) {
  if (typeof values2[Symbol.iterator] !== "function") throw new TypeError("values is not iterable");
  let V = Array.from(values2);
  const R = new Float64Array(V.length);
  if (valueof2.length !== 2) V = V.map(valueof2), valueof2 = ascending;
  const compareIndex = (i, j) => valueof2(V[i], V[j]);
  let k2, r;
  values2 = Uint32Array.from(V, (_, i) => i);
  values2.sort(valueof2 === ascending ? (i, j) => ascendingDefined(V[i], V[j]) : compareDefined(compareIndex));
  values2.forEach((j, i) => {
    const c3 = compareIndex(j, k2 === void 0 ? j : k2);
    if (c3 >= 0) {
      if (k2 === void 0 || c3 > 0) k2 = j, r = i;
      R[j] = r;
    } else {
      R[j] = NaN;
    }
  });
  return R;
}
function least(values2, compare = ascending) {
  let min3;
  let defined2 = false;
  if (compare.length === 1) {
    let minValue;
    for (const element of values2) {
      const value2 = compare(element);
      if (defined2 ? ascending(value2, minValue) < 0 : ascending(value2, value2) === 0) {
        min3 = element;
        minValue = value2;
        defined2 = true;
      }
    }
  } else {
    for (const value2 of values2) {
      if (defined2 ? compare(value2, min3) < 0 : compare(value2, value2) === 0) {
        min3 = value2;
        defined2 = true;
      }
    }
  }
  return min3;
}
var shuffle = shuffler(Math.random);
function shuffler(random) {
  return function shuffle3(array5, i0 = 0, i1 = array5.length) {
    let m = i1 - (i0 = +i0);
    while (m) {
      const i = random() * m-- | 0, t = array5[m + i0];
      array5[m + i0] = array5[i + i0];
      array5[i + i0] = t;
    }
    return array5;
  };
}
function sum(values2, valueof2) {
  let sum3 = 0;
  if (valueof2 === void 0) {
    for (let value2 of values2) {
      if (value2 = +value2) {
        sum3 += value2;
      }
    }
  } else {
    let index2 = -1;
    for (let value2 of values2) {
      if (value2 = +valueof2(value2, ++index2, values2)) {
        sum3 += value2;
      }
    }
  }
  return sum3;
}
function reverse(values2) {
  if (typeof values2[Symbol.iterator] !== "function") throw new TypeError("values is not iterable");
  return Array.from(values2).reverse();
}

// node_modules/d3-axis/dist/d3-axis.mjs
function identity2(x2) {
  return x2;
}
var top = 1;
var right = 2;
var bottom = 3;
var left = 4;
var epsilon = 1e-6;
function translateX(x2) {
  return "translate(" + x2 + ",0)";
}
function translateY(y2) {
  return "translate(0," + y2 + ")";
}
function number2(scale2) {
  return (d) => +scale2(d);
}
function center(scale2, offset2) {
  offset2 = Math.max(0, scale2.bandwidth() - offset2 * 2) / 2;
  if (scale2.round()) offset2 = Math.round(offset2);
  return (d) => +scale2(d) + offset2;
}
function entering() {
  return !this.__axis;
}
function axis(orient, scale2) {
  var tickArguments = [], tickValues = null, tickFormat2 = null, tickSizeInner = 6, tickSizeOuter = 6, tickPadding = 3, offset2 = typeof window !== "undefined" && window.devicePixelRatio > 1 ? 0 : 0.5, k2 = orient === top || orient === left ? -1 : 1, x2 = orient === left || orient === right ? "x" : "y", transform2 = orient === top || orient === bottom ? translateX : translateY;
  function axis2(context) {
    var values2 = tickValues == null ? scale2.ticks ? scale2.ticks.apply(scale2, tickArguments) : scale2.domain() : tickValues, format3 = tickFormat2 == null ? scale2.tickFormat ? scale2.tickFormat.apply(scale2, tickArguments) : identity2 : tickFormat2, spacing = Math.max(tickSizeInner, 0) + tickPadding, range3 = scale2.range(), range0 = +range3[0] + offset2, range1 = +range3[range3.length - 1] + offset2, position2 = (scale2.bandwidth ? center : number2)(scale2.copy(), offset2), selection2 = context.selection ? context.selection() : context, path2 = selection2.selectAll(".domain").data([null]), tick = selection2.selectAll(".tick").data(values2, scale2).order(), tickExit = tick.exit(), tickEnter = tick.enter().append("g").attr("class", "tick"), line3 = tick.select("line"), text2 = tick.select("text");
    path2 = path2.merge(path2.enter().insert("path", ".tick").attr("class", "domain").attr("stroke", "currentColor"));
    tick = tick.merge(tickEnter);
    line3 = line3.merge(tickEnter.append("line").attr("stroke", "currentColor").attr(x2 + "2", k2 * tickSizeInner));
    text2 = text2.merge(tickEnter.append("text").attr("fill", "currentColor").attr(x2, k2 * spacing).attr("dy", orient === top ? "0em" : orient === bottom ? "0.71em" : "0.32em"));
    if (context !== selection2) {
      path2 = path2.transition(context);
      tick = tick.transition(context);
      line3 = line3.transition(context);
      text2 = text2.transition(context);
      tickExit = tickExit.transition(context).attr("opacity", epsilon).attr("transform", function(d) {
        return isFinite(d = position2(d)) ? transform2(d + offset2) : this.getAttribute("transform");
      });
      tickEnter.attr("opacity", epsilon).attr("transform", function(d) {
        var p = this.parentNode.__axis;
        return transform2((p && isFinite(p = p(d)) ? p : position2(d)) + offset2);
      });
    }
    tickExit.remove();
    path2.attr("d", orient === left || orient === right ? tickSizeOuter ? "M" + k2 * tickSizeOuter + "," + range0 + "H" + offset2 + "V" + range1 + "H" + k2 * tickSizeOuter : "M" + offset2 + "," + range0 + "V" + range1 : tickSizeOuter ? "M" + range0 + "," + k2 * tickSizeOuter + "V" + offset2 + "H" + range1 + "V" + k2 * tickSizeOuter : "M" + range0 + "," + offset2 + "H" + range1);
    tick.attr("opacity", 1).attr("transform", function(d) {
      return transform2(position2(d) + offset2);
    });
    line3.attr(x2 + "2", k2 * tickSizeInner);
    text2.attr(x2, k2 * spacing).text(format3);
    selection2.filter(entering).attr("fill", "none").attr("font-size", 10).attr("font-family", "sans-serif").attr("text-anchor", orient === right ? "start" : orient === left ? "end" : "middle");
    selection2.each(function() {
      this.__axis = position2;
    });
  }
  axis2.scale = function(_) {
    return arguments.length ? (scale2 = _, axis2) : scale2;
  };
  axis2.ticks = function() {
    return tickArguments = Array.from(arguments), axis2;
  };
  axis2.tickArguments = function(_) {
    return arguments.length ? (tickArguments = _ == null ? [] : Array.from(_), axis2) : tickArguments.slice();
  };
  axis2.tickValues = function(_) {
    return arguments.length ? (tickValues = _ == null ? null : Array.from(_), axis2) : tickValues && tickValues.slice();
  };
  axis2.tickFormat = function(_) {
    return arguments.length ? (tickFormat2 = _, axis2) : tickFormat2;
  };
  axis2.tickSize = function(_) {
    return arguments.length ? (tickSizeInner = tickSizeOuter = +_, axis2) : tickSizeInner;
  };
  axis2.tickSizeInner = function(_) {
    return arguments.length ? (tickSizeInner = +_, axis2) : tickSizeInner;
  };
  axis2.tickSizeOuter = function(_) {
    return arguments.length ? (tickSizeOuter = +_, axis2) : tickSizeOuter;
  };
  axis2.tickPadding = function(_) {
    return arguments.length ? (tickPadding = +_, axis2) : tickPadding;
  };
  axis2.offset = function(_) {
    return arguments.length ? (offset2 = +_, axis2) : offset2;
  };
  return axis2;
}
function axisBottom(scale2) {
  return axis(bottom, scale2);
}

// node_modules/d3-selection/dist/d3-selection.mjs
var xhtml = "http://www.w3.org/1999/xhtml";
var namespaces = {
  svg: "http://www.w3.org/2000/svg",
  xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};
function namespace(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces.hasOwnProperty(prefix) ? { space: namespaces[prefix], local: name } : name;
}
function creatorInherit(name) {
  return function() {
    var document2 = this.ownerDocument, uri = this.namespaceURI;
    return uri === xhtml && document2.documentElement.namespaceURI === xhtml ? document2.createElement(name) : document2.createElementNS(uri, name);
  };
}
function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}
function creator(name) {
  var fullname = namespace(name);
  return (fullname.local ? creatorFixed : creatorInherit)(fullname);
}
function none() {
}
function selector(selector2) {
  return selector2 == null ? none : function() {
    return this.querySelector(selector2);
  };
}
function selection_select(select3) {
  if (typeof select3 !== "function") select3 = selector(select3);
  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group3 = groups[j], n = group3.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group3[i]) && (subnode = select3.call(node, node.__data__, i, group3))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }
  return new Selection(subgroups, this._parents);
}
function array2(x2) {
  return x2 == null ? [] : Array.isArray(x2) ? x2 : Array.from(x2);
}
function empty2() {
  return [];
}
function selectorAll(selector2) {
  return selector2 == null ? empty2 : function() {
    return this.querySelectorAll(selector2);
  };
}
function arrayAll(select3) {
  return function() {
    return array2(select3.apply(this, arguments));
  };
}
function selection_selectAll(select3) {
  if (typeof select3 === "function") select3 = arrayAll(select3);
  else select3 = selectorAll(select3);
  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group3 = groups[j], n = group3.length, node, i = 0; i < n; ++i) {
      if (node = group3[i]) {
        subgroups.push(select3.call(node, node.__data__, i, group3));
        parents.push(node);
      }
    }
  }
  return new Selection(subgroups, parents);
}
function matcher(selector2) {
  return function() {
    return this.matches(selector2);
  };
}
function childMatcher(selector2) {
  return function(node) {
    return node.matches(selector2);
  };
}
var find = Array.prototype.find;
function childFind(match) {
  return function() {
    return find.call(this.children, match);
  };
}
function childFirst() {
  return this.firstElementChild;
}
function selection_selectChild(match) {
  return this.select(match == null ? childFirst : childFind(typeof match === "function" ? match : childMatcher(match)));
}
var filter = Array.prototype.filter;
function children() {
  return Array.from(this.children);
}
function childrenFilter(match) {
  return function() {
    return filter.call(this.children, match);
  };
}
function selection_selectChildren(match) {
  return this.selectAll(match == null ? children : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
}
function selection_filter(match) {
  if (typeof match !== "function") match = matcher(match);
  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group3 = groups[j], n = group3.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group3[i]) && match.call(node, node.__data__, i, group3)) {
        subgroup.push(node);
      }
    }
  }
  return new Selection(subgroups, this._parents);
}
function sparse(update) {
  return new Array(update.length);
}
function selection_enter() {
  return new Selection(this._enter || this._groups.map(sparse), this._parents);
}
function EnterNode(parent, datum2) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum2;
}
EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function(child) {
    return this._parent.insertBefore(child, this._next);
  },
  insertBefore: function(child, next) {
    return this._parent.insertBefore(child, next);
  },
  querySelector: function(selector2) {
    return this._parent.querySelector(selector2);
  },
  querySelectorAll: function(selector2) {
    return this._parent.querySelectorAll(selector2);
  }
};
function constant(x2) {
  return function() {
    return x2;
  };
}
function bindIndex(parent, group3, enter, update, exit, data) {
  var i = 0, node, groupLength = group3.length, dataLength = data.length;
  for (; i < dataLength; ++i) {
    if (node = group3[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }
  for (; i < groupLength; ++i) {
    if (node = group3[i]) {
      exit[i] = node;
    }
  }
}
function bindKey(parent, group3, enter, update, exit, data, key) {
  var i, node, nodeByKeyValue = /* @__PURE__ */ new Map(), groupLength = group3.length, dataLength = data.length, keyValues = new Array(groupLength), keyValue;
  for (i = 0; i < groupLength; ++i) {
    if (node = group3[i]) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group3) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }
  for (i = 0; i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if (node = nodeByKeyValue.get(keyValue)) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }
  for (i = 0; i < groupLength; ++i) {
    if ((node = group3[i]) && nodeByKeyValue.get(keyValues[i]) === node) {
      exit[i] = node;
    }
  }
}
function datum(node) {
  return node.__data__;
}
function selection_data(value2, key) {
  if (!arguments.length) return Array.from(this, datum);
  var bind = key ? bindKey : bindIndex, parents = this._parents, groups = this._groups;
  if (typeof value2 !== "function") value2 = constant(value2);
  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j], group3 = groups[j], groupLength = group3.length, data = arraylike(value2.call(parent, parent && parent.__data__, j, parents)), dataLength = data.length, enterGroup = enter[j] = new Array(dataLength), updateGroup = update[j] = new Array(dataLength), exitGroup = exit[j] = new Array(groupLength);
    bind(parent, group3, enterGroup, updateGroup, exitGroup, data, key);
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength) ;
        previous._next = next || null;
      }
    }
  }
  update = new Selection(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
}
function arraylike(data) {
  return typeof data === "object" && "length" in data ? data : Array.from(data);
}
function selection_exit() {
  return new Selection(this._exit || this._groups.map(sparse), this._parents);
}
function selection_join(onenter, onupdate, onexit) {
  var enter = this.enter(), update = this, exit = this.exit();
  if (typeof onenter === "function") {
    enter = onenter(enter);
    if (enter) enter = enter.selection();
  } else {
    enter = enter.append(onenter + "");
  }
  if (onupdate != null) {
    update = onupdate(update);
    if (update) update = update.selection();
  }
  if (onexit == null) exit.remove();
  else onexit(exit);
  return enter && update ? enter.merge(update).order() : update;
}
function selection_merge(context) {
  var selection2 = context.selection ? context.selection() : context;
  for (var groups0 = this._groups, groups1 = selection2._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge2 = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge2[i] = node;
      }
    }
  }
  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }
  return new Selection(merges, this._parents);
}
function selection_order() {
  for (var groups = this._groups, j = -1, m = groups.length; ++j < m; ) {
    for (var group3 = groups[j], i = group3.length - 1, next = group3[i], node; --i >= 0; ) {
      if (node = group3[i]) {
        if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }
  return this;
}
function selection_sort(compare) {
  if (!compare) compare = ascending2;
  function compareNode(a2, b) {
    return a2 && b ? compare(a2.__data__, b.__data__) : !a2 - !b;
  }
  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group3 = groups[j], n = group3.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group3[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }
  return new Selection(sortgroups, this._parents).order();
}
function ascending2(a2, b) {
  return a2 < b ? -1 : a2 > b ? 1 : a2 >= b ? 0 : NaN;
}
function selection_call() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}
function selection_nodes() {
  return Array.from(this);
}
function selection_node() {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group3 = groups[j], i = 0, n = group3.length; i < n; ++i) {
      var node = group3[i];
      if (node) return node;
    }
  }
  return null;
}
function selection_size() {
  let size = 0;
  for (const node of this) ++size;
  return size;
}
function selection_empty() {
  return !this.node();
}
function selection_each(callback) {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group3 = groups[j], i = 0, n = group3.length, node; i < n; ++i) {
      if (node = group3[i]) callback.call(node, node.__data__, i, group3);
    }
  }
  return this;
}
function attrRemove(name) {
  return function() {
    this.removeAttribute(name);
  };
}
function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant(name, value2) {
  return function() {
    this.setAttribute(name, value2);
  };
}
function attrConstantNS(fullname, value2) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value2);
  };
}
function attrFunction(name, value2) {
  return function() {
    var v = value2.apply(this, arguments);
    if (v == null) this.removeAttribute(name);
    else this.setAttribute(name, v);
  };
}
function attrFunctionNS(fullname, value2) {
  return function() {
    var v = value2.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
    else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}
function selection_attr(name, value2) {
  var fullname = namespace(name);
  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
  }
  return this.each((value2 == null ? fullname.local ? attrRemoveNS : attrRemove : typeof value2 === "function" ? fullname.local ? attrFunctionNS : attrFunction : fullname.local ? attrConstantNS : attrConstant)(fullname, value2));
}
function defaultView(node) {
  return node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView;
}
function styleRemove(name) {
  return function() {
    this.style.removeProperty(name);
  };
}
function styleConstant(name, value2, priority) {
  return function() {
    this.style.setProperty(name, value2, priority);
  };
}
function styleFunction(name, value2, priority) {
  return function() {
    var v = value2.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);
    else this.style.setProperty(name, v, priority);
  };
}
function selection_style(name, value2, priority) {
  return arguments.length > 1 ? this.each((value2 == null ? styleRemove : typeof value2 === "function" ? styleFunction : styleConstant)(name, value2, priority == null ? "" : priority)) : styleValue(this.node(), name);
}
function styleValue(node, name) {
  return node.style.getPropertyValue(name) || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
}
function propertyRemove(name) {
  return function() {
    delete this[name];
  };
}
function propertyConstant(name, value2) {
  return function() {
    this[name] = value2;
  };
}
function propertyFunction(name, value2) {
  return function() {
    var v = value2.apply(this, arguments);
    if (v == null) delete this[name];
    else this[name] = v;
  };
}
function selection_property(name, value2) {
  return arguments.length > 1 ? this.each((value2 == null ? propertyRemove : typeof value2 === "function" ? propertyFunction : propertyConstant)(name, value2)) : this.node()[name];
}
function classArray(string3) {
  return string3.trim().split(/^|\s+/);
}
function classList(node) {
  return node.classList || new ClassList(node);
}
function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}
ClassList.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};
function classedAdd(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.add(names[i]);
}
function classedRemove(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.remove(names[i]);
}
function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}
function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}
function classedFunction(names, value2) {
  return function() {
    (value2.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}
function selection_classed(name, value2) {
  var names = classArray(name + "");
  if (arguments.length < 2) {
    var list = classList(this.node()), i = -1, n = names.length;
    while (++i < n) if (!list.contains(names[i])) return false;
    return true;
  }
  return this.each((typeof value2 === "function" ? classedFunction : value2 ? classedTrue : classedFalse)(names, value2));
}
function textRemove() {
  this.textContent = "";
}
function textConstant(value2) {
  return function() {
    this.textContent = value2;
  };
}
function textFunction(value2) {
  return function() {
    var v = value2.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}
function selection_text(value2) {
  return arguments.length ? this.each(value2 == null ? textRemove : (typeof value2 === "function" ? textFunction : textConstant)(value2)) : this.node().textContent;
}
function htmlRemove() {
  this.innerHTML = "";
}
function htmlConstant(value2) {
  return function() {
    this.innerHTML = value2;
  };
}
function htmlFunction(value2) {
  return function() {
    var v = value2.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}
function selection_html(value2) {
  return arguments.length ? this.each(value2 == null ? htmlRemove : (typeof value2 === "function" ? htmlFunction : htmlConstant)(value2)) : this.node().innerHTML;
}
function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}
function selection_raise() {
  return this.each(raise);
}
function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function selection_lower() {
  return this.each(lower);
}
function selection_append(name) {
  var create2 = typeof name === "function" ? name : creator(name);
  return this.select(function() {
    return this.appendChild(create2.apply(this, arguments));
  });
}
function constantNull() {
  return null;
}
function selection_insert(name, before) {
  var create2 = typeof name === "function" ? name : creator(name), select3 = before == null ? constantNull : typeof before === "function" ? before : selector(before);
  return this.select(function() {
    return this.insertBefore(create2.apply(this, arguments), select3.apply(this, arguments) || null);
  });
}
function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}
function selection_remove() {
  return this.each(remove);
}
function selection_cloneShallow() {
  var clone = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function selection_cloneDeep() {
  var clone = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function selection_clone(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}
function selection_datum(value2) {
  return arguments.length ? this.property("__data__", value2) : this.node().__data__;
}
function contextListener(listener) {
  return function(event) {
    listener.call(this, event, this.__data__);
  };
}
function parseTypenames(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return { type: t, name };
  });
}
function onRemove(typename) {
  return function() {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;
    else delete this.__on;
  };
}
function onAdd(typename, value2, options) {
  return function() {
    var on = this.__on, o, listener = contextListener(value2);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
        this.addEventListener(o.type, o.listener = listener, o.options = options);
        o.value = value2;
        return;
      }
    }
    this.addEventListener(typename.type, listener, options);
    o = { type: typename.type, name: typename.name, value: value2, listener, options };
    if (!on) this.__on = [o];
    else on.push(o);
  };
}
function selection_on(typename, value2, options) {
  var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;
  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }
  on = value2 ? onAdd : onRemove;
  for (i = 0; i < n; ++i) this.each(on(typenames[i], value2, options));
  return this;
}
function dispatchEvent(node, type, params) {
  var window2 = defaultView(node), event = window2.CustomEvent;
  if (typeof event === "function") {
    event = new event(type, params);
  } else {
    event = window2.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
    else event.initEvent(type, false, false);
  }
  node.dispatchEvent(event);
}
function dispatchConstant(type, params) {
  return function() {
    return dispatchEvent(this, type, params);
  };
}
function dispatchFunction(type, params) {
  return function() {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}
function selection_dispatch(type, params) {
  return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type, params));
}
function* selection_iterator() {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group3 = groups[j], i = 0, n = group3.length, node; i < n; ++i) {
      if (node = group3[i]) yield node;
    }
  }
}
var root = [null];
function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}
function selection() {
  return new Selection([[document.documentElement]], root);
}
function selection_selection() {
  return this;
}
Selection.prototype = selection.prototype = {
  constructor: Selection,
  select: selection_select,
  selectAll: selection_selectAll,
  selectChild: selection_selectChild,
  selectChildren: selection_selectChildren,
  filter: selection_filter,
  data: selection_data,
  enter: selection_enter,
  exit: selection_exit,
  join: selection_join,
  merge: selection_merge,
  selection: selection_selection,
  order: selection_order,
  sort: selection_sort,
  call: selection_call,
  nodes: selection_nodes,
  node: selection_node,
  size: selection_size,
  empty: selection_empty,
  each: selection_each,
  attr: selection_attr,
  style: selection_style,
  property: selection_property,
  classed: selection_classed,
  text: selection_text,
  html: selection_html,
  raise: selection_raise,
  lower: selection_lower,
  append: selection_append,
  insert: selection_insert,
  remove: selection_remove,
  clone: selection_clone,
  datum: selection_datum,
  on: selection_on,
  dispatch: selection_dispatch,
  [Symbol.iterator]: selection_iterator
};
function select(selector2) {
  return typeof selector2 === "string" ? new Selection([[document.querySelector(selector2)]], [document.documentElement]) : new Selection([[selector2]], root);
}
var nextId = 0;
function local() {
  return new Local();
}
function Local() {
  this._ = "@" + (++nextId).toString(36);
}
Local.prototype = local.prototype = {
  constructor: Local,
  get: function(node) {
    var id = this._;
    while (!(id in node)) if (!(node = node.parentNode)) return;
    return node[id];
  },
  set: function(node, value2) {
    return node[this._] = value2;
  },
  remove: function(node) {
    return this._ in node && delete node[this._];
  },
  toString: function() {
    return this._;
  }
};
function sourceEvent(event) {
  let sourceEvent2;
  while (sourceEvent2 = event.sourceEvent) event = sourceEvent2;
  return event;
}
function pointer(event, node) {
  event = sourceEvent(event);
  if (node === void 0) node = event.currentTarget;
  if (node) {
    var svg = node.ownerSVGElement || node;
    if (svg.createSVGPoint) {
      var point3 = svg.createSVGPoint();
      point3.x = event.clientX, point3.y = event.clientY;
      point3 = point3.matrixTransform(node.getScreenCTM().inverse());
      return [point3.x, point3.y];
    }
    if (node.getBoundingClientRect) {
      var rect2 = node.getBoundingClientRect();
      return [event.clientX - rect2.left - node.clientLeft, event.clientY - rect2.top - node.clientTop];
    }
  }
  return [event.pageX, event.pageY];
}

// node_modules/d3-color/dist/d3-color.mjs
function define(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}
function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}
function Color() {
}
var darker = 0.7;
var brighter = 1 / darker;
var reI = "\\s*([+-]?\\d+)\\s*";
var reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex = /^#([0-9a-f]{3,8})$/;
var reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`);
var reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`);
var reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`);
var reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`);
var reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`);
var reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
var named = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
define(Color, color, {
  copy(channels) {
    return Object.assign(new this.constructor(), this, channels);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex,
  // Deprecated! Use color.formatHex.
  formatHex: color_formatHex,
  formatHex8: color_formatHex8,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb
});
function color_formatHex() {
  return this.rgb().formatHex();
}
function color_formatHex8() {
  return this.rgb().formatHex8();
}
function color_formatHsl() {
  return hslConvert(this).formatHsl();
}
function color_formatRgb() {
  return this.rgb().formatRgb();
}
function color(format3) {
  var m, l;
  format3 = (format3 + "").trim().toLowerCase();
  return (m = reHex.exec(format3)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) : l === 3 ? new Rgb(m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, (m & 15) << 4 | m & 15, 1) : l === 8 ? rgba(m >> 24 & 255, m >> 16 & 255, m >> 8 & 255, (m & 255) / 255) : l === 4 ? rgba(m >> 12 & 15 | m >> 8 & 240, m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, ((m & 15) << 4 | m & 15) / 255) : null) : (m = reRgbInteger.exec(format3)) ? new Rgb(m[1], m[2], m[3], 1) : (m = reRgbPercent.exec(format3)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) : (m = reRgbaInteger.exec(format3)) ? rgba(m[1], m[2], m[3], m[4]) : (m = reRgbaPercent.exec(format3)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) : (m = reHslPercent.exec(format3)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) : (m = reHslaPercent.exec(format3)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) : named.hasOwnProperty(format3) ? rgbn(named[format3]) : format3 === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
}
function rgbn(n) {
  return new Rgb(n >> 16 & 255, n >> 8 & 255, n & 255, 1);
}
function rgba(r, g, b, a2) {
  if (a2 <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a2);
}
function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb();
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}
function rgb(r, g, b, opacity2) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity2 == null ? 1 : opacity2);
}
function Rgb(r, g, b, opacity2) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity2;
}
define(Rgb, rgb, extend(Color, {
  brighter(k2) {
    k2 = k2 == null ? brighter : Math.pow(brighter, k2);
    return new Rgb(this.r * k2, this.g * k2, this.b * k2, this.opacity);
  },
  darker(k2) {
    k2 = k2 == null ? darker : Math.pow(darker, k2);
    return new Rgb(this.r * k2, this.g * k2, this.b * k2, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && (-0.5 <= this.g && this.g < 255.5) && (-0.5 <= this.b && this.b < 255.5) && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex,
  // Deprecated! Use color.formatHex.
  formatHex: rgb_formatHex,
  formatHex8: rgb_formatHex8,
  formatRgb: rgb_formatRgb,
  toString: rgb_formatRgb
}));
function rgb_formatHex() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}
function rgb_formatHex8() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function rgb_formatRgb() {
  const a2 = clampa(this.opacity);
  return `${a2 === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a2 === 1 ? ")" : `, ${a2})`}`;
}
function clampa(opacity2) {
  return isNaN(opacity2) ? 1 : Math.max(0, Math.min(1, opacity2));
}
function clampi(value2) {
  return Math.max(0, Math.min(255, Math.round(value2) || 0));
}
function hex(value2) {
  value2 = clampi(value2);
  return (value2 < 16 ? "0" : "") + value2.toString(16);
}
function hsla(h, s2, l, a2) {
  if (a2 <= 0) h = s2 = l = NaN;
  else if (l <= 0 || l >= 1) h = s2 = NaN;
  else if (s2 <= 0) h = NaN;
  return new Hsl(h, s2, l, a2);
}
function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl();
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255, g = o.g / 255, b = o.b / 255, min3 = Math.min(r, g, b), max2 = Math.max(r, g, b), h = NaN, s2 = max2 - min3, l = (max2 + min3) / 2;
  if (s2) {
    if (r === max2) h = (g - b) / s2 + (g < b) * 6;
    else if (g === max2) h = (b - r) / s2 + 2;
    else h = (r - g) / s2 + 4;
    s2 /= l < 0.5 ? max2 + min3 : 2 - max2 - min3;
    h *= 60;
  } else {
    s2 = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s2, l, o.opacity);
}
function hsl(h, s2, l, opacity2) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s2, l, opacity2 == null ? 1 : opacity2);
}
function Hsl(h, s2, l, opacity2) {
  this.h = +h;
  this.s = +s2;
  this.l = +l;
  this.opacity = +opacity2;
}
define(Hsl, hsl, extend(Color, {
  brighter(k2) {
    k2 = k2 == null ? brighter : Math.pow(brighter, k2);
    return new Hsl(this.h, this.s, this.l * k2, this.opacity);
  },
  darker(k2) {
    k2 = k2 == null ? darker : Math.pow(darker, k2);
    return new Hsl(this.h, this.s, this.l * k2, this.opacity);
  },
  rgb() {
    var h = this.h % 360 + (this.h < 0) * 360, s2 = isNaN(h) || isNaN(this.s) ? 0 : this.s, l = this.l, m2 = l + (l < 0.5 ? l : 1 - l) * s2, m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb(h, m1, m2),
      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  clamp() {
    return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && (0 <= this.l && this.l <= 1) && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl() {
    const a2 = clampa(this.opacity);
    return `${a2 === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a2 === 1 ? ")" : `, ${a2})`}`;
  }
}));
function clamph(value2) {
  value2 = (value2 || 0) % 360;
  return value2 < 0 ? value2 + 360 : value2;
}
function clampt(value2) {
  return Math.max(0, Math.min(1, value2 || 0));
}
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
}
var radians = Math.PI / 180;
var degrees = 180 / Math.PI;
var K = 18;
var Xn = 0.96422;
var Yn = 1;
var Zn = 0.82521;
var t0 = 4 / 29;
var t1 = 6 / 29;
var t2 = 3 * t1 * t1;
var t3 = t1 * t1 * t1;
function labConvert(o) {
  if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
  if (o instanceof Hcl) return hcl2lab(o);
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var r = rgb2lrgb(o.r), g = rgb2lrgb(o.g), b = rgb2lrgb(o.b), y2 = xyz2lab((0.2225045 * r + 0.7168786 * g + 0.0606169 * b) / Yn), x2, z;
  if (r === g && g === b) x2 = z = y2;
  else {
    x2 = xyz2lab((0.4360747 * r + 0.3850649 * g + 0.1430804 * b) / Xn);
    z = xyz2lab((0.0139322 * r + 0.0971045 * g + 0.7141733 * b) / Zn);
  }
  return new Lab(116 * y2 - 16, 500 * (x2 - y2), 200 * (y2 - z), o.opacity);
}
function lab(l, a2, b, opacity2) {
  return arguments.length === 1 ? labConvert(l) : new Lab(l, a2, b, opacity2 == null ? 1 : opacity2);
}
function Lab(l, a2, b, opacity2) {
  this.l = +l;
  this.a = +a2;
  this.b = +b;
  this.opacity = +opacity2;
}
define(Lab, lab, extend(Color, {
  brighter(k2) {
    return new Lab(this.l + K * (k2 == null ? 1 : k2), this.a, this.b, this.opacity);
  },
  darker(k2) {
    return new Lab(this.l - K * (k2 == null ? 1 : k2), this.a, this.b, this.opacity);
  },
  rgb() {
    var y2 = (this.l + 16) / 116, x2 = isNaN(this.a) ? y2 : y2 + this.a / 500, z = isNaN(this.b) ? y2 : y2 - this.b / 200;
    x2 = Xn * lab2xyz(x2);
    y2 = Yn * lab2xyz(y2);
    z = Zn * lab2xyz(z);
    return new Rgb(
      lrgb2rgb(3.1338561 * x2 - 1.6168667 * y2 - 0.4906146 * z),
      lrgb2rgb(-0.9787684 * x2 + 1.9161415 * y2 + 0.033454 * z),
      lrgb2rgb(0.0719453 * x2 - 0.2289914 * y2 + 1.4052427 * z),
      this.opacity
    );
  }
}));
function xyz2lab(t) {
  return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
}
function lab2xyz(t) {
  return t > t1 ? t * t * t : t2 * (t - t0);
}
function lrgb2rgb(x2) {
  return 255 * (x2 <= 31308e-7 ? 12.92 * x2 : 1.055 * Math.pow(x2, 1 / 2.4) - 0.055);
}
function rgb2lrgb(x2) {
  return (x2 /= 255) <= 0.04045 ? x2 / 12.92 : Math.pow((x2 + 0.055) / 1.055, 2.4);
}
function hclConvert(o) {
  if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
  if (!(o instanceof Lab)) o = labConvert(o);
  if (o.a === 0 && o.b === 0) return new Hcl(NaN, 0 < o.l && o.l < 100 ? 0 : NaN, o.l, o.opacity);
  var h = Math.atan2(o.b, o.a) * degrees;
  return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
}
function hcl(h, c3, l, opacity2) {
  return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c3, l, opacity2 == null ? 1 : opacity2);
}
function Hcl(h, c3, l, opacity2) {
  this.h = +h;
  this.c = +c3;
  this.l = +l;
  this.opacity = +opacity2;
}
function hcl2lab(o) {
  if (isNaN(o.h)) return new Lab(o.l, 0, 0, o.opacity);
  var h = o.h * radians;
  return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
}
define(Hcl, hcl, extend(Color, {
  brighter(k2) {
    return new Hcl(this.h, this.c, this.l + K * (k2 == null ? 1 : k2), this.opacity);
  },
  darker(k2) {
    return new Hcl(this.h, this.c, this.l - K * (k2 == null ? 1 : k2), this.opacity);
  },
  rgb() {
    return hcl2lab(this).rgb();
  }
}));
var A = -0.14861;
var B = 1.78277;
var C = -0.29227;
var D = -0.90649;
var E = 1.97294;
var ED = E * D;
var EB = E * B;
var BC_DA = B * C - D * A;
function cubehelixConvert(o) {
  if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var r = o.r / 255, g = o.g / 255, b = o.b / 255, l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB), bl = b - l, k2 = (E * (g - l) - C * bl) / D, s2 = Math.sqrt(k2 * k2 + bl * bl) / (E * l * (1 - l)), h = s2 ? Math.atan2(k2, bl) * degrees - 120 : NaN;
  return new Cubehelix(h < 0 ? h + 360 : h, s2, l, o.opacity);
}
function cubehelix(h, s2, l, opacity2) {
  return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s2, l, opacity2 == null ? 1 : opacity2);
}
function Cubehelix(h, s2, l, opacity2) {
  this.h = +h;
  this.s = +s2;
  this.l = +l;
  this.opacity = +opacity2;
}
define(Cubehelix, cubehelix, extend(Color, {
  brighter(k2) {
    k2 = k2 == null ? brighter : Math.pow(brighter, k2);
    return new Cubehelix(this.h, this.s, this.l * k2, this.opacity);
  },
  darker(k2) {
    k2 = k2 == null ? darker : Math.pow(darker, k2);
    return new Cubehelix(this.h, this.s, this.l * k2, this.opacity);
  },
  rgb() {
    var h = isNaN(this.h) ? 0 : (this.h + 120) * radians, l = +this.l, a2 = isNaN(this.s) ? 0 : this.s * l * (1 - l), cosh2 = Math.cos(h), sinh2 = Math.sin(h);
    return new Rgb(
      255 * (l + a2 * (A * cosh2 + B * sinh2)),
      255 * (l + a2 * (C * cosh2 + D * sinh2)),
      255 * (l + a2 * (E * cosh2)),
      this.opacity
    );
  }
}));

// node_modules/d3-interpolate/dist/d3-interpolate.mjs
function basis(t13, v0, v1, v2, v3) {
  var t22 = t13 * t13, t32 = t22 * t13;
  return ((1 - 3 * t13 + 3 * t22 - t32) * v0 + (4 - 6 * t22 + 3 * t32) * v1 + (1 + 3 * t13 + 3 * t22 - 3 * t32) * v2 + t32 * v3) / 6;
}
function basis$1(values2) {
  var n = values2.length - 1;
  return function(t) {
    var i = t <= 0 ? t = 0 : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n), v1 = values2[i], v2 = values2[i + 1], v0 = i > 0 ? values2[i - 1] : 2 * v1 - v2, v3 = i < n - 1 ? values2[i + 2] : 2 * v2 - v1;
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}
function basisClosed(values2) {
  var n = values2.length;
  return function(t) {
    var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n), v0 = values2[(i + n - 1) % n], v1 = values2[i % n], v2 = values2[(i + 1) % n], v3 = values2[(i + 2) % n];
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}
var constant2 = (x2) => () => x2;
function linear(a2, d) {
  return function(t) {
    return a2 + t * d;
  };
}
function exponential(a2, b, y2) {
  return a2 = Math.pow(a2, y2), b = Math.pow(b, y2) - a2, y2 = 1 / y2, function(t) {
    return Math.pow(a2 + t * b, y2);
  };
}
function hue$1(a2, b) {
  var d = b - a2;
  return d ? linear(a2, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant2(isNaN(a2) ? b : a2);
}
function gamma(y2) {
  return (y2 = +y2) === 1 ? nogamma : function(a2, b) {
    return b - a2 ? exponential(a2, b, y2) : constant2(isNaN(a2) ? b : a2);
  };
}
function nogamma(a2, b) {
  var d = b - a2;
  return d ? linear(a2, d) : constant2(isNaN(a2) ? b : a2);
}
var rgb2 = (function rgbGamma(y2) {
  var color3 = gamma(y2);
  function rgb3(start, end) {
    var r = color3((start = rgb(start)).r, (end = rgb(end)).r), g = color3(start.g, end.g), b = color3(start.b, end.b), opacity2 = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity2(t);
      return start + "";
    };
  }
  rgb3.gamma = rgbGamma;
  return rgb3;
})(1);
function rgbSpline(spline) {
  return function(colors2) {
    var n = colors2.length, r = new Array(n), g = new Array(n), b = new Array(n), i, color3;
    for (i = 0; i < n; ++i) {
      color3 = rgb(colors2[i]);
      r[i] = color3.r || 0;
      g[i] = color3.g || 0;
      b[i] = color3.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b = spline(b);
    color3.opacity = 1;
    return function(t) {
      color3.r = r(t);
      color3.g = g(t);
      color3.b = b(t);
      return color3 + "";
    };
  };
}
var rgbBasis = rgbSpline(basis$1);
var rgbBasisClosed = rgbSpline(basisClosed);
function numberArray(a2, b) {
  if (!b) b = [];
  var n = a2 ? Math.min(b.length, a2.length) : 0, c3 = b.slice(), i;
  return function(t) {
    for (i = 0; i < n; ++i) c3[i] = a2[i] * (1 - t) + b[i] * t;
    return c3;
  };
}
function isNumberArray(x2) {
  return ArrayBuffer.isView(x2) && !(x2 instanceof DataView);
}
function genericArray(a2, b) {
  var nb = b ? b.length : 0, na = a2 ? Math.min(nb, a2.length) : 0, x2 = new Array(na), c3 = new Array(nb), i;
  for (i = 0; i < na; ++i) x2[i] = value(a2[i], b[i]);
  for (; i < nb; ++i) c3[i] = b[i];
  return function(t) {
    for (i = 0; i < na; ++i) c3[i] = x2[i](t);
    return c3;
  };
}
function date(a2, b) {
  var d = /* @__PURE__ */ new Date();
  return a2 = +a2, b = +b, function(t) {
    return d.setTime(a2 * (1 - t) + b * t), d;
  };
}
function number3(a2, b) {
  return a2 = +a2, b = +b, function(t) {
    return a2 * (1 - t) + b * t;
  };
}
function object(a2, b) {
  var i = {}, c3 = {}, k2;
  if (a2 === null || typeof a2 !== "object") a2 = {};
  if (b === null || typeof b !== "object") b = {};
  for (k2 in b) {
    if (k2 in a2) {
      i[k2] = value(a2[k2], b[k2]);
    } else {
      c3[k2] = b[k2];
    }
  }
  return function(t) {
    for (k2 in i) c3[k2] = i[k2](t);
    return c3;
  };
}
var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");
function zero2(b) {
  return function() {
    return b;
  };
}
function one(b) {
  return function(t) {
    return b(t) + "";
  };
}
function string(a2, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, am, bm, bs, i = -1, s2 = [], q = [];
  a2 = a2 + "", b = b + "";
  while ((am = reA.exec(a2)) && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) {
      bs = b.slice(bi, bs);
      if (s2[i]) s2[i] += bs;
      else s2[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      if (s2[i]) s2[i] += bm;
      else s2[++i] = bm;
    } else {
      s2[++i] = null;
      q.push({ i, x: number3(am, bm) });
    }
    bi = reB.lastIndex;
  }
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s2[i]) s2[i] += bs;
    else s2[++i] = bs;
  }
  return s2.length < 2 ? q[0] ? one(q[0].x) : zero2(b) : (b = q.length, function(t) {
    for (var i2 = 0, o; i2 < b; ++i2) s2[(o = q[i2]).i] = o.x(t);
    return s2.join("");
  });
}
function value(a2, b) {
  var t = typeof b, c3;
  return b == null || t === "boolean" ? constant2(b) : (t === "number" ? number3 : t === "string" ? (c3 = color(b)) ? (b = c3, rgb2) : string : b instanceof color ? rgb2 : b instanceof Date ? date : isNumberArray(b) ? numberArray : Array.isArray(b) ? genericArray : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object : number3)(a2, b);
}
function round(a2, b) {
  return a2 = +a2, b = +b, function(t) {
    return Math.round(a2 * (1 - t) + b * t);
  };
}
var degrees2 = 180 / Math.PI;
var identity3 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};
function decompose(a2, b, c3, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a2 * a2 + b * b)) a2 /= scaleX, b /= scaleX;
  if (skewX = a2 * c3 + b * d) c3 -= a2 * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c3 * c3 + d * d)) c3 /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a2 * d < b * c3) a2 = -a2, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a2) * degrees2,
    skewX: Math.atan(skewX) * degrees2,
    scaleX,
    scaleY
  };
}
var svgNode;
function parseCss(value2) {
  const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value2 + "");
  return m.isIdentity ? identity3 : decompose(m.a, m.b, m.c, m.d, m.e, m.f);
}
function parseSvg(value2) {
  if (value2 == null) return identity3;
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value2);
  if (!(value2 = svgNode.transform.baseVal.consolidate())) return identity3;
  value2 = value2.matrix;
  return decompose(value2.a, value2.b, value2.c, value2.d, value2.e, value2.f);
}
function interpolateTransform(parse2, pxComma, pxParen, degParen) {
  function pop(s2) {
    return s2.length ? s2.pop() + " " : "";
  }
  function translate2(xa, ya, xb, yb, s2, q) {
    if (xa !== xb || ya !== yb) {
      var i = s2.push("translate(", null, pxComma, null, pxParen);
      q.push({ i: i - 4, x: number3(xa, xb) }, { i: i - 2, x: number3(ya, yb) });
    } else if (xb || yb) {
      s2.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }
  function rotate(a2, b, s2, q) {
    if (a2 !== b) {
      if (a2 - b > 180) b += 360;
      else if (b - a2 > 180) a2 += 360;
      q.push({ i: s2.push(pop(s2) + "rotate(", null, degParen) - 2, x: number3(a2, b) });
    } else if (b) {
      s2.push(pop(s2) + "rotate(" + b + degParen);
    }
  }
  function skewX(a2, b, s2, q) {
    if (a2 !== b) {
      q.push({ i: s2.push(pop(s2) + "skewX(", null, degParen) - 2, x: number3(a2, b) });
    } else if (b) {
      s2.push(pop(s2) + "skewX(" + b + degParen);
    }
  }
  function scale2(xa, ya, xb, yb, s2, q) {
    if (xa !== xb || ya !== yb) {
      var i = s2.push(pop(s2) + "scale(", null, ",", null, ")");
      q.push({ i: i - 4, x: number3(xa, xb) }, { i: i - 2, x: number3(ya, yb) });
    } else if (xb !== 1 || yb !== 1) {
      s2.push(pop(s2) + "scale(" + xb + "," + yb + ")");
    }
  }
  return function(a2, b) {
    var s2 = [], q = [];
    a2 = parse2(a2), b = parse2(b);
    translate2(a2.translateX, a2.translateY, b.translateX, b.translateY, s2, q);
    rotate(a2.rotate, b.rotate, s2, q);
    skewX(a2.skewX, b.skewX, s2, q);
    scale2(a2.scaleX, a2.scaleY, b.scaleX, b.scaleY, s2, q);
    a2 = b = null;
    return function(t) {
      var i = -1, n = q.length, o;
      while (++i < n) s2[(o = q[i]).i] = o.x(t);
      return s2.join("");
    };
  };
}
var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");
var epsilon2 = 1e-12;
function cosh(x2) {
  return ((x2 = Math.exp(x2)) + 1 / x2) / 2;
}
function sinh(x2) {
  return ((x2 = Math.exp(x2)) - 1 / x2) / 2;
}
function tanh(x2) {
  return ((x2 = Math.exp(2 * x2)) - 1) / (x2 + 1);
}
var zoom = (function zoomRho(rho, rho2, rho4) {
  function zoom2(p0, p1) {
    var ux0 = p0[0], uy0 = p0[1], w0 = p0[2], ux1 = p1[0], uy1 = p1[1], w1 = p1[2], dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, i, S;
    if (d2 < epsilon2) {
      S = Math.log(w1 / w0) / rho;
      i = function(t) {
        return [
          ux0 + t * dx,
          uy0 + t * dy,
          w0 * Math.exp(rho * t * S)
        ];
      };
    } else {
      var d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1), b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1), r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
      S = (r1 - r0) / rho;
      i = function(t) {
        var s2 = t * S, coshr0 = cosh(r0), u2 = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s2 + r0) - sinh(r0));
        return [
          ux0 + u2 * dx,
          uy0 + u2 * dy,
          w0 * coshr0 / cosh(rho * s2 + r0)
        ];
      };
    }
    i.duration = Math.abs(S) * 1e3 * rho / Math.SQRT2;
    return i;
  }
  zoom2.rho = function(_) {
    var _1 = Math.max(1e-3, +_), _2 = _1 * _1, _4 = _2 * _2;
    return zoomRho(_1, _2, _4);
  };
  return zoom2;
})(Math.SQRT2, 2, 4);
function hsl2(hue) {
  return function(start, end) {
    var h = hue((start = hsl(start)).h, (end = hsl(end)).h), s2 = nogamma(start.s, end.s), l = nogamma(start.l, end.l), opacity2 = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.h = h(t);
      start.s = s2(t);
      start.l = l(t);
      start.opacity = opacity2(t);
      return start + "";
    };
  };
}
var hsl_default = hsl2(hue$1);
var hslLong = hsl2(nogamma);
function lab2(start, end) {
  var l = nogamma((start = lab(start)).l, (end = lab(end)).l), a2 = nogamma(start.a, end.a), b = nogamma(start.b, end.b), opacity2 = nogamma(start.opacity, end.opacity);
  return function(t) {
    start.l = l(t);
    start.a = a2(t);
    start.b = b(t);
    start.opacity = opacity2(t);
    return start + "";
  };
}
function hcl2(hue) {
  return function(start, end) {
    var h = hue((start = hcl(start)).h, (end = hcl(end)).h), c3 = nogamma(start.c, end.c), l = nogamma(start.l, end.l), opacity2 = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.h = h(t);
      start.c = c3(t);
      start.l = l(t);
      start.opacity = opacity2(t);
      return start + "";
    };
  };
}
var hcl_default = hcl2(hue$1);
var hclLong = hcl2(nogamma);
function cubehelix2(hue) {
  return (function cubehelixGamma(y2) {
    y2 = +y2;
    function cubehelix4(start, end) {
      var h = hue((start = cubehelix(start)).h, (end = cubehelix(end)).h), s2 = nogamma(start.s, end.s), l = nogamma(start.l, end.l), opacity2 = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.h = h(t);
        start.s = s2(t);
        start.l = l(Math.pow(t, y2));
        start.opacity = opacity2(t);
        return start + "";
      };
    }
    cubehelix4.gamma = cubehelixGamma;
    return cubehelix4;
  })(1);
}
var cubehelix_default = cubehelix2(hue$1);
var cubehelixLong = cubehelix2(nogamma);
function piecewise(interpolate, values2) {
  if (values2 === void 0) values2 = interpolate, interpolate = value;
  var i = 0, n = values2.length - 1, v = values2[0], I = new Array(n < 0 ? 0 : n);
  while (i < n) I[i] = interpolate(v, v = values2[++i]);
  return function(t) {
    var i2 = Math.max(0, Math.min(n - 1, Math.floor(t *= n)));
    return I[i2](t - i2);
  };
}
function quantize(interpolator, n) {
  var samples = new Array(n);
  for (var i = 0; i < n; ++i) samples[i] = interpolator(i / (n - 1));
  return samples;
}

// node_modules/d3-path/dist/d3-path.mjs
var pi = Math.PI;
var tau = 2 * pi;
var epsilon3 = 1e-6;
var tauEpsilon = tau - epsilon3;
function append(strings) {
  this._ += strings[0];
  for (let i = 1, n = strings.length; i < n; ++i) {
    this._ += arguments[i] + strings[i];
  }
}
function appendRound(digits) {
  let d = Math.floor(digits);
  if (!(d >= 0)) throw new Error(`invalid digits: ${digits}`);
  if (d > 15) return append;
  const k2 = 10 ** d;
  return function(strings) {
    this._ += strings[0];
    for (let i = 1, n = strings.length; i < n; ++i) {
      this._ += Math.round(arguments[i] * k2) / k2 + strings[i];
    }
  };
}
function equal(x02, y02, x12, y12) {
  return x02 === x12 && y02 === y12;
}
function equalRound(digits) {
  const d = Math.floor(digits);
  if (!(d <= 15)) return equal;
  const k2 = 10 ** d;
  const r = function(value2) {
    return Math.round(value2 * k2);
  };
  return function(x02, y02, x12, y12) {
    return r(x02) === r(x12) && r(y02) === r(y12);
  };
}
var Path = class {
  constructor(digits) {
    this._x0 = this._y0 = // start of current subpath
    this._x1 = this._y1 = null;
    this._ = "";
    this._append = digits == null ? append : appendRound(digits);
    this._equal = digits == null ? equal : equalRound(digits);
  }
  moveTo(x2, y2) {
    this._append`M${this._x0 = this._x1 = +x2},${this._y0 = this._y1 = +y2}`;
  }
  closePath() {
    if (this._x1 !== null) {
      this._x1 = this._x0, this._y1 = this._y0;
      this._append`Z`;
    }
  }
  lineTo(x2, y2) {
    this._append`L${this._x1 = +x2},${this._y1 = +y2}`;
  }
  quadraticCurveTo(x12, y12, x2, y2) {
    this._append`Q${+x12},${+y12},${this._x1 = +x2},${this._y1 = +y2}`;
  }
  bezierCurveTo(x12, y12, x2, y2, x3, y3) {
    this._append`C${+x12},${+y12},${+x2},${+y2},${this._x1 = +x3},${this._y1 = +y3}`;
  }
  arcTo(x12, y12, x2, y2, r) {
    x12 = +x12, y12 = +y12, x2 = +x2, y2 = +y2, r = +r;
    if (r < 0) throw new Error(`negative radius: ${r}`);
    let x02 = this._x1, y02 = this._y1, x21 = x2 - x12, y21 = y2 - y12, x01 = x02 - x12, y01 = y02 - y12, l01_2 = x01 * x01 + y01 * y01;
    if (this._x1 === null) {
      this._append`M${this._x1 = x12},${this._y1 = y12}`;
    } else if (!(l01_2 > epsilon3)) ;
    else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon3) || !r) {
      this._append`L${this._x1 = x12},${this._y1 = y12}`;
    } else {
      let x20 = x2 - x02, y20 = y2 - y02, l21_2 = x21 * x21 + y21 * y21, l20_2 = x20 * x20 + y20 * y20, l21 = Math.sqrt(l21_2), l01 = Math.sqrt(l01_2), l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2), t01 = l / l01, t21 = l / l21;
      if (Math.abs(t01 - 1) > epsilon3) {
        this._append`L${x12 + t01 * x01},${y12 + t01 * y01}`;
      }
      this._append`A${r},${r},0,0,${+(y01 * x20 > x01 * y20)},${this._x1 = x12 + t21 * x21},${this._y1 = y12 + t21 * y21}`;
    }
  }
  arc(x2, y2, r, a0, a1, ccw) {
    x2 = +x2, y2 = +y2, r = +r, ccw = !!ccw;
    if (r < 0) throw new Error(`negative radius: ${r}`);
    let dx = r * Math.cos(a0), dy = r * Math.sin(a0), x02 = x2 + dx, y02 = y2 + dy, cw = 1 ^ ccw, da = ccw ? a0 - a1 : a1 - a0;
    if (this._x1 === null) {
      this._append`M${x02},${y02}`;
    } else if (Math.abs(this._x1 - x02) > epsilon3 || Math.abs(this._y1 - y02) > epsilon3) {
      this._append`L${x02},${y02}`;
    }
    if (!r) return;
    if (da < 0) da = da % tau + tau;
    if (da > tauEpsilon) {
      this._append`A${r},${r},0,1,${cw},${x2 - dx},${y2 - dy}A${r},${r},0,1,${cw},${this._x1 = x02},${this._y1 = y02}`;
    } else if (da > epsilon3) {
      const x12 = x2 + r * Math.cos(a1);
      const y12 = y2 + r * Math.sin(a1);
      if (da >= pi && this._equal(x02, y02, x12, y12)) {
        da /= 2;
        let a00 = a0 + da;
        this._append`A${r},${r},0,${+(da >= pi)},${cw},${x2 + r * Math.cos(a00)},${y2 + r * Math.sin(a00)}`;
      }
      this._append`A${r},${r},0,${+(da >= pi)},${cw},${this._x1 = x12},${this._y1 = y12}`;
    }
  }
  rect(x2, y2, w, h) {
    this._append`M${this._x0 = this._x1 = +x2},${this._y0 = this._y1 = +y2}h${w = +w}v${+h}h${-w}Z`;
  }
  toString() {
    return this._;
  }
};
function path() {
  return new Path();
}
path.prototype = Path.prototype;
function pathRound(digits = 3) {
  return new Path(+digits);
}

// node_modules/d3-contour/dist/d3-contour.mjs
var array3 = Array.prototype;
var slice2 = array3.slice;
function ascending3(a2, b) {
  return a2 - b;
}
function area(ring) {
  var i = 0, n = ring.length, area4 = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
  while (++i < n) area4 += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
  return area4;
}
var constant3 = (x2) => () => x2;
function contains(ring, hole) {
  var i = -1, n = hole.length, c3;
  while (++i < n) if (c3 = ringContains(ring, hole[i])) return c3;
  return 0;
}
function ringContains(ring, point3) {
  var x2 = point3[0], y2 = point3[1], contains2 = -1;
  for (var i = 0, n = ring.length, j = n - 1; i < n; j = i++) {
    var pi5 = ring[i], xi = pi5[0], yi = pi5[1], pj = ring[j], xj = pj[0], yj = pj[1];
    if (segmentContains(pi5, pj, point3)) return 0;
    if (yi > y2 !== yj > y2 && x2 < (xj - xi) * (y2 - yi) / (yj - yi) + xi) contains2 = -contains2;
  }
  return contains2;
}
function segmentContains(a2, b, c3) {
  var i;
  return collinear(a2, b, c3) && within(a2[i = +(a2[0] === b[0])], c3[i], b[i]);
}
function collinear(a2, b, c3) {
  return (b[0] - a2[0]) * (c3[1] - a2[1]) === (c3[0] - a2[0]) * (b[1] - a2[1]);
}
function within(p, q, r) {
  return p <= q && q <= r || r <= q && q <= p;
}
function noop() {
}
var cases = [
  [],
  [[[1, 1.5], [0.5, 1]]],
  [[[1.5, 1], [1, 1.5]]],
  [[[1.5, 1], [0.5, 1]]],
  [[[1, 0.5], [1.5, 1]]],
  [[[1, 1.5], [0.5, 1]], [[1, 0.5], [1.5, 1]]],
  [[[1, 0.5], [1, 1.5]]],
  [[[1, 0.5], [0.5, 1]]],
  [[[0.5, 1], [1, 0.5]]],
  [[[1, 1.5], [1, 0.5]]],
  [[[0.5, 1], [1, 0.5]], [[1.5, 1], [1, 1.5]]],
  [[[1.5, 1], [1, 0.5]]],
  [[[0.5, 1], [1.5, 1]]],
  [[[1, 1.5], [1.5, 1]]],
  [[[0.5, 1], [1, 1.5]]],
  []
];
function Contours() {
  var dx = 1, dy = 1, threshold2 = thresholdSturges, smooth = smoothLinear;
  function contours(values2) {
    var tz = threshold2(values2);
    if (!Array.isArray(tz)) {
      const e = extent(values2, finite);
      tz = ticks(...nice(e[0], e[1], tz), tz);
      while (tz[tz.length - 1] >= e[1]) tz.pop();
      while (tz[1] < e[0]) tz.shift();
    } else {
      tz = tz.slice().sort(ascending3);
    }
    return tz.map((value2) => contour2(values2, value2));
  }
  function contour2(values2, value2) {
    const v = value2 == null ? NaN : +value2;
    if (isNaN(v)) throw new Error(`invalid value: ${value2}`);
    var polygons = [], holes = [];
    isorings(values2, v, function(ring) {
      smooth(ring, values2, v);
      if (area(ring) > 0) polygons.push([ring]);
      else holes.push(ring);
    });
    holes.forEach(function(hole) {
      for (var i = 0, n = polygons.length, polygon; i < n; ++i) {
        if (contains((polygon = polygons[i])[0], hole) !== -1) {
          polygon.push(hole);
          return;
        }
      }
    });
    return {
      type: "MultiPolygon",
      value: value2,
      coordinates: polygons
    };
  }
  function isorings(values2, value2, callback) {
    var fragmentByStart = new Array(), fragmentByEnd = new Array(), x2, y2, t03, t13, t22, t32;
    x2 = y2 = -1;
    t13 = above(values2[0], value2);
    cases[t13 << 1].forEach(stitch);
    while (++x2 < dx - 1) {
      t03 = t13, t13 = above(values2[x2 + 1], value2);
      cases[t03 | t13 << 1].forEach(stitch);
    }
    cases[t13 << 0].forEach(stitch);
    while (++y2 < dy - 1) {
      x2 = -1;
      t13 = above(values2[y2 * dx + dx], value2);
      t22 = above(values2[y2 * dx], value2);
      cases[t13 << 1 | t22 << 2].forEach(stitch);
      while (++x2 < dx - 1) {
        t03 = t13, t13 = above(values2[y2 * dx + dx + x2 + 1], value2);
        t32 = t22, t22 = above(values2[y2 * dx + x2 + 1], value2);
        cases[t03 | t13 << 1 | t22 << 2 | t32 << 3].forEach(stitch);
      }
      cases[t13 | t22 << 3].forEach(stitch);
    }
    x2 = -1;
    t22 = values2[y2 * dx] >= value2;
    cases[t22 << 2].forEach(stitch);
    while (++x2 < dx - 1) {
      t32 = t22, t22 = above(values2[y2 * dx + x2 + 1], value2);
      cases[t22 << 2 | t32 << 3].forEach(stitch);
    }
    cases[t22 << 3].forEach(stitch);
    function stitch(line3) {
      var start = [line3[0][0] + x2, line3[0][1] + y2], end = [line3[1][0] + x2, line3[1][1] + y2], startIndex = index2(start), endIndex = index2(end), f, g;
      if (f = fragmentByEnd[startIndex]) {
        if (g = fragmentByStart[endIndex]) {
          delete fragmentByEnd[f.end];
          delete fragmentByStart[g.start];
          if (f === g) {
            f.ring.push(end);
            callback(f.ring);
          } else {
            fragmentByStart[f.start] = fragmentByEnd[g.end] = { start: f.start, end: g.end, ring: f.ring.concat(g.ring) };
          }
        } else {
          delete fragmentByEnd[f.end];
          f.ring.push(end);
          fragmentByEnd[f.end = endIndex] = f;
        }
      } else if (f = fragmentByStart[endIndex]) {
        if (g = fragmentByEnd[startIndex]) {
          delete fragmentByStart[f.start];
          delete fragmentByEnd[g.end];
          if (f === g) {
            f.ring.push(end);
            callback(f.ring);
          } else {
            fragmentByStart[g.start] = fragmentByEnd[f.end] = { start: g.start, end: f.end, ring: g.ring.concat(f.ring) };
          }
        } else {
          delete fragmentByStart[f.start];
          f.ring.unshift(start);
          fragmentByStart[f.start = startIndex] = f;
        }
      } else {
        fragmentByStart[startIndex] = fragmentByEnd[endIndex] = { start: startIndex, end: endIndex, ring: [start, end] };
      }
    }
  }
  function index2(point3) {
    return point3[0] * 2 + point3[1] * (dx + 1) * 4;
  }
  function smoothLinear(ring, values2, value2) {
    ring.forEach(function(point3) {
      var x2 = point3[0], y2 = point3[1], xt = x2 | 0, yt = y2 | 0, v1 = valid(values2[yt * dx + xt]);
      if (x2 > 0 && x2 < dx && xt === x2) {
        point3[0] = smooth1(x2, valid(values2[yt * dx + xt - 1]), v1, value2);
      }
      if (y2 > 0 && y2 < dy && yt === y2) {
        point3[1] = smooth1(y2, valid(values2[(yt - 1) * dx + xt]), v1, value2);
      }
    });
  }
  contours.contour = contour2;
  contours.size = function(_) {
    if (!arguments.length) return [dx, dy];
    var _0 = Math.floor(_[0]), _1 = Math.floor(_[1]);
    if (!(_0 >= 0 && _1 >= 0)) throw new Error("invalid size");
    return dx = _0, dy = _1, contours;
  };
  contours.thresholds = function(_) {
    return arguments.length ? (threshold2 = typeof _ === "function" ? _ : Array.isArray(_) ? constant3(slice2.call(_)) : constant3(_), contours) : threshold2;
  };
  contours.smooth = function(_) {
    return arguments.length ? (smooth = _ ? smoothLinear : noop, contours) : smooth === smoothLinear;
  };
  return contours;
}
function finite(x2) {
  return isFinite(x2) ? x2 : NaN;
}
function above(x2, value2) {
  return x2 == null ? false : +x2 >= value2;
}
function valid(v) {
  return v == null || isNaN(v = +v) ? -Infinity : v;
}
function smooth1(x2, v0, v1, value2) {
  const a2 = value2 - v0;
  const b = v1 - v0;
  const d = isFinite(a2) || isFinite(b) ? a2 / b : Math.sign(a2) / Math.sign(b);
  return isNaN(d) ? x2 : x2 + d - 0.5;
}
function defaultX(d) {
  return d[0];
}
function defaultY(d) {
  return d[1];
}
function defaultWeight() {
  return 1;
}
function density() {
  var x2 = defaultX, y2 = defaultY, weight = defaultWeight, dx = 960, dy = 500, r = 20, k2 = 2, o = r * 3, n = dx + o * 2 >> k2, m = dy + o * 2 >> k2, threshold2 = constant3(20);
  function grid(data) {
    var values2 = new Float32Array(n * m), pow2k = Math.pow(2, -k2), i = -1;
    for (const d of data) {
      var xi = (x2(d, ++i, data) + o) * pow2k, yi = (y2(d, i, data) + o) * pow2k, wi = +weight(d, i, data);
      if (wi && xi >= 0 && xi < n && yi >= 0 && yi < m) {
        var x02 = Math.floor(xi), y02 = Math.floor(yi), xt = xi - x02 - 0.5, yt = yi - y02 - 0.5;
        values2[x02 + y02 * n] += (1 - xt) * (1 - yt) * wi;
        values2[x02 + 1 + y02 * n] += xt * (1 - yt) * wi;
        values2[x02 + 1 + (y02 + 1) * n] += xt * yt * wi;
        values2[x02 + (y02 + 1) * n] += (1 - xt) * yt * wi;
      }
    }
    blur2({ data: values2, width: n, height: m }, r * pow2k);
    return values2;
  }
  function density3(data) {
    var values2 = grid(data), tz = threshold2(values2), pow4k = Math.pow(2, 2 * k2);
    if (!Array.isArray(tz)) {
      tz = ticks(Number.MIN_VALUE, max(values2) / pow4k, tz);
    }
    return Contours().size([n, m]).thresholds(tz.map((d) => d * pow4k))(values2).map((c3, i) => (c3.value = +tz[i], transform2(c3)));
  }
  density3.contours = function(data) {
    var values2 = grid(data), contours = Contours().size([n, m]), pow4k = Math.pow(2, 2 * k2), contour2 = (value2) => {
      value2 = +value2;
      var c3 = transform2(contours.contour(values2, value2 * pow4k));
      c3.value = value2;
      return c3;
    };
    Object.defineProperty(contour2, "max", { get: () => max(values2) / pow4k });
    return contour2;
  };
  function transform2(geometry) {
    geometry.coordinates.forEach(transformPolygon);
    return geometry;
  }
  function transformPolygon(coordinates) {
    coordinates.forEach(transformRing);
  }
  function transformRing(coordinates) {
    coordinates.forEach(transformPoint);
  }
  function transformPoint(coordinates) {
    coordinates[0] = coordinates[0] * Math.pow(2, k2) - o;
    coordinates[1] = coordinates[1] * Math.pow(2, k2) - o;
  }
  function resize() {
    o = r * 3;
    n = dx + o * 2 >> k2;
    m = dy + o * 2 >> k2;
    return density3;
  }
  density3.x = function(_) {
    return arguments.length ? (x2 = typeof _ === "function" ? _ : constant3(+_), density3) : x2;
  };
  density3.y = function(_) {
    return arguments.length ? (y2 = typeof _ === "function" ? _ : constant3(+_), density3) : y2;
  };
  density3.weight = function(_) {
    return arguments.length ? (weight = typeof _ === "function" ? _ : constant3(+_), density3) : weight;
  };
  density3.size = function(_) {
    if (!arguments.length) return [dx, dy];
    var _0 = +_[0], _1 = +_[1];
    if (!(_0 >= 0 && _1 >= 0)) throw new Error("invalid size");
    return dx = _0, dy = _1, resize();
  };
  density3.cellSize = function(_) {
    if (!arguments.length) return 1 << k2;
    if (!((_ = +_) >= 1)) throw new Error("invalid cell size");
    return k2 = Math.floor(Math.log(_) / Math.LN2), resize();
  };
  density3.thresholds = function(_) {
    return arguments.length ? (threshold2 = typeof _ === "function" ? _ : Array.isArray(_) ? constant3(slice2.call(_)) : constant3(_), density3) : threshold2;
  };
  density3.bandwidth = function(_) {
    if (!arguments.length) return Math.sqrt(r * (r + 1));
    if (!((_ = +_) >= 0)) throw new Error("invalid bandwidth");
    return r = (Math.sqrt(4 * _ * _ + 1) - 1) / 2, resize();
  };
  return density3;
}

// node_modules/d3-delaunay/dist/d3-delaunay.mjs
var epsilon$1 = 11102230246251565e-32;
var splitter = 134217729;
var resulterrbound = (3 + 8 * epsilon$1) * epsilon$1;
function sum2(elen, e, flen, f, h) {
  let Q, Qnew, hh, bvirt;
  let enow = e[0];
  let fnow = f[0];
  let eindex = 0;
  let findex = 0;
  if (fnow > enow === fnow > -enow) {
    Q = enow;
    enow = e[++eindex];
  } else {
    Q = fnow;
    fnow = f[++findex];
  }
  let hindex = 0;
  if (eindex < elen && findex < flen) {
    if (fnow > enow === fnow > -enow) {
      Qnew = enow + Q;
      hh = Q - (Qnew - enow);
      enow = e[++eindex];
    } else {
      Qnew = fnow + Q;
      hh = Q - (Qnew - fnow);
      fnow = f[++findex];
    }
    Q = Qnew;
    if (hh !== 0) {
      h[hindex++] = hh;
    }
    while (eindex < elen && findex < flen) {
      if (fnow > enow === fnow > -enow) {
        Qnew = Q + enow;
        bvirt = Qnew - Q;
        hh = Q - (Qnew - bvirt) + (enow - bvirt);
        enow = e[++eindex];
      } else {
        Qnew = Q + fnow;
        bvirt = Qnew - Q;
        hh = Q - (Qnew - bvirt) + (fnow - bvirt);
        fnow = f[++findex];
      }
      Q = Qnew;
      if (hh !== 0) {
        h[hindex++] = hh;
      }
    }
  }
  while (eindex < elen) {
    Qnew = Q + enow;
    bvirt = Qnew - Q;
    hh = Q - (Qnew - bvirt) + (enow - bvirt);
    enow = e[++eindex];
    Q = Qnew;
    if (hh !== 0) {
      h[hindex++] = hh;
    }
  }
  while (findex < flen) {
    Qnew = Q + fnow;
    bvirt = Qnew - Q;
    hh = Q - (Qnew - bvirt) + (fnow - bvirt);
    fnow = f[++findex];
    Q = Qnew;
    if (hh !== 0) {
      h[hindex++] = hh;
    }
  }
  if (Q !== 0 || hindex === 0) {
    h[hindex++] = Q;
  }
  return hindex;
}
function estimate(elen, e) {
  let Q = e[0];
  for (let i = 1; i < elen; i++) Q += e[i];
  return Q;
}
function vec(n) {
  return new Float64Array(n);
}
var ccwerrboundA = (3 + 16 * epsilon$1) * epsilon$1;
var ccwerrboundB = (2 + 12 * epsilon$1) * epsilon$1;
var ccwerrboundC = (9 + 64 * epsilon$1) * epsilon$1 * epsilon$1;
var B2 = vec(4);
var C1 = vec(8);
var C2 = vec(12);
var D2 = vec(16);
var u = vec(4);
function orient2dadapt(ax, ay, bx, by, cx, cy, detsum) {
  let acxtail, acytail, bcxtail, bcytail;
  let bvirt, c3, ahi, alo, bhi, blo, _i, _j, _0, s1, s0, t13, t03, u3;
  const acx = ax - cx;
  const bcx = bx - cx;
  const acy = ay - cy;
  const bcy = by - cy;
  s1 = acx * bcy;
  c3 = splitter * acx;
  ahi = c3 - (c3 - acx);
  alo = acx - ahi;
  c3 = splitter * bcy;
  bhi = c3 - (c3 - bcy);
  blo = bcy - bhi;
  s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
  t13 = acy * bcx;
  c3 = splitter * acy;
  ahi = c3 - (c3 - acy);
  alo = acy - ahi;
  c3 = splitter * bcx;
  bhi = c3 - (c3 - bcx);
  blo = bcx - bhi;
  t03 = alo * blo - (t13 - ahi * bhi - alo * bhi - ahi * blo);
  _i = s0 - t03;
  bvirt = s0 - _i;
  B2[0] = s0 - (_i + bvirt) + (bvirt - t03);
  _j = s1 + _i;
  bvirt = _j - s1;
  _0 = s1 - (_j - bvirt) + (_i - bvirt);
  _i = _0 - t13;
  bvirt = _0 - _i;
  B2[1] = _0 - (_i + bvirt) + (bvirt - t13);
  u3 = _j + _i;
  bvirt = u3 - _j;
  B2[2] = _j - (u3 - bvirt) + (_i - bvirt);
  B2[3] = u3;
  let det = estimate(4, B2);
  let errbound = ccwerrboundB * detsum;
  if (det >= errbound || -det >= errbound) {
    return det;
  }
  bvirt = ax - acx;
  acxtail = ax - (acx + bvirt) + (bvirt - cx);
  bvirt = bx - bcx;
  bcxtail = bx - (bcx + bvirt) + (bvirt - cx);
  bvirt = ay - acy;
  acytail = ay - (acy + bvirt) + (bvirt - cy);
  bvirt = by - bcy;
  bcytail = by - (bcy + bvirt) + (bvirt - cy);
  if (acxtail === 0 && acytail === 0 && bcxtail === 0 && bcytail === 0) {
    return det;
  }
  errbound = ccwerrboundC * detsum + resulterrbound * Math.abs(det);
  det += acx * bcytail + bcy * acxtail - (acy * bcxtail + bcx * acytail);
  if (det >= errbound || -det >= errbound) return det;
  s1 = acxtail * bcy;
  c3 = splitter * acxtail;
  ahi = c3 - (c3 - acxtail);
  alo = acxtail - ahi;
  c3 = splitter * bcy;
  bhi = c3 - (c3 - bcy);
  blo = bcy - bhi;
  s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
  t13 = acytail * bcx;
  c3 = splitter * acytail;
  ahi = c3 - (c3 - acytail);
  alo = acytail - ahi;
  c3 = splitter * bcx;
  bhi = c3 - (c3 - bcx);
  blo = bcx - bhi;
  t03 = alo * blo - (t13 - ahi * bhi - alo * bhi - ahi * blo);
  _i = s0 - t03;
  bvirt = s0 - _i;
  u[0] = s0 - (_i + bvirt) + (bvirt - t03);
  _j = s1 + _i;
  bvirt = _j - s1;
  _0 = s1 - (_j - bvirt) + (_i - bvirt);
  _i = _0 - t13;
  bvirt = _0 - _i;
  u[1] = _0 - (_i + bvirt) + (bvirt - t13);
  u3 = _j + _i;
  bvirt = u3 - _j;
  u[2] = _j - (u3 - bvirt) + (_i - bvirt);
  u[3] = u3;
  const C1len = sum2(4, B2, 4, u, C1);
  s1 = acx * bcytail;
  c3 = splitter * acx;
  ahi = c3 - (c3 - acx);
  alo = acx - ahi;
  c3 = splitter * bcytail;
  bhi = c3 - (c3 - bcytail);
  blo = bcytail - bhi;
  s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
  t13 = acy * bcxtail;
  c3 = splitter * acy;
  ahi = c3 - (c3 - acy);
  alo = acy - ahi;
  c3 = splitter * bcxtail;
  bhi = c3 - (c3 - bcxtail);
  blo = bcxtail - bhi;
  t03 = alo * blo - (t13 - ahi * bhi - alo * bhi - ahi * blo);
  _i = s0 - t03;
  bvirt = s0 - _i;
  u[0] = s0 - (_i + bvirt) + (bvirt - t03);
  _j = s1 + _i;
  bvirt = _j - s1;
  _0 = s1 - (_j - bvirt) + (_i - bvirt);
  _i = _0 - t13;
  bvirt = _0 - _i;
  u[1] = _0 - (_i + bvirt) + (bvirt - t13);
  u3 = _j + _i;
  bvirt = u3 - _j;
  u[2] = _j - (u3 - bvirt) + (_i - bvirt);
  u[3] = u3;
  const C2len = sum2(C1len, C1, 4, u, C2);
  s1 = acxtail * bcytail;
  c3 = splitter * acxtail;
  ahi = c3 - (c3 - acxtail);
  alo = acxtail - ahi;
  c3 = splitter * bcytail;
  bhi = c3 - (c3 - bcytail);
  blo = bcytail - bhi;
  s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
  t13 = acytail * bcxtail;
  c3 = splitter * acytail;
  ahi = c3 - (c3 - acytail);
  alo = acytail - ahi;
  c3 = splitter * bcxtail;
  bhi = c3 - (c3 - bcxtail);
  blo = bcxtail - bhi;
  t03 = alo * blo - (t13 - ahi * bhi - alo * bhi - ahi * blo);
  _i = s0 - t03;
  bvirt = s0 - _i;
  u[0] = s0 - (_i + bvirt) + (bvirt - t03);
  _j = s1 + _i;
  bvirt = _j - s1;
  _0 = s1 - (_j - bvirt) + (_i - bvirt);
  _i = _0 - t13;
  bvirt = _0 - _i;
  u[1] = _0 - (_i + bvirt) + (bvirt - t13);
  u3 = _j + _i;
  bvirt = u3 - _j;
  u[2] = _j - (u3 - bvirt) + (_i - bvirt);
  u[3] = u3;
  const Dlen = sum2(C2len, C2, 4, u, D2);
  return D2[Dlen - 1];
}
function orient2d(ax, ay, bx, by, cx, cy) {
  const detleft = (ay - cy) * (bx - cx);
  const detright = (ax - cx) * (by - cy);
  const det = detleft - detright;
  const detsum = Math.abs(detleft + detright);
  if (Math.abs(det) >= ccwerrboundA * detsum) return det;
  return -orient2dadapt(ax, ay, bx, by, cx, cy, detsum);
}
vec(4);
vec(4);
vec(4);
vec(4);
vec(4);
vec(4);
vec(4);
vec(4);
vec(4);
vec(8);
vec(8);
vec(8);
vec(4);
vec(8);
vec(8);
vec(16);
vec(12);
vec(192);
vec(192);
vec(4);
vec(4);
vec(4);
vec(4);
vec(4);
vec(4);
vec(4);
vec(4);
vec(8);
vec(8);
vec(8);
vec(8);
vec(8);
vec(8);
vec(8);
vec(8);
vec(8);
vec(4);
vec(4);
vec(4);
vec(8);
vec(16);
vec(16);
vec(16);
vec(32);
vec(32);
vec(48);
vec(64);
vec(1152);
vec(1152);
vec(4);
vec(4);
vec(4);
vec(4);
vec(4);
vec(4);
vec(4);
vec(4);
vec(4);
vec(4);
vec(24);
vec(24);
vec(24);
vec(24);
vec(24);
vec(24);
vec(24);
vec(24);
vec(24);
vec(24);
vec(1152);
vec(1152);
vec(1152);
vec(1152);
vec(1152);
vec(2304);
vec(2304);
vec(3456);
vec(5760);
vec(8);
vec(8);
vec(8);
vec(16);
vec(24);
vec(48);
vec(48);
vec(96);
vec(192);
vec(384);
vec(384);
vec(384);
vec(768);
vec(96);
vec(96);
vec(96);
vec(1152);
var EPSILON = Math.pow(2, -52);
var EDGE_STACK = new Uint32Array(512);
var Delaunator = class _Delaunator {
  /**
   * Constructs a delaunay triangulation object given an array of points (`[x, y]` by default).
   * `getX` and `getY` are optional functions of the form `(point) => value` for custom point formats.
   *
   * @template P
   * @param {P[]} points
   * @param {(p: P) => number} [getX]
   * @param {(p: P) => number} [getY]
   */
  // @ts-expect-error TS2322
  static from(points, getX = defaultGetX, getY = defaultGetY) {
    const n = points.length;
    const coords = new Float64Array(n * 2);
    for (let i = 0; i < n; i++) {
      const p = points[i];
      coords[2 * i] = getX(p);
      coords[2 * i + 1] = getY(p);
    }
    return new _Delaunator(coords);
  }
  /**
   * Constructs a delaunay triangulation object given an array of point coordinates of the form:
   * `[x0, y0, x1, y1, ...]` (use a typed array for best performance). Duplicate points are skipped.
   *
   * @param {T} coords
   */
  constructor(coords) {
    const n = coords.length >> 1;
    if (n > 0 && typeof coords[0] !== "number") throw new Error("Expected coords to contain numbers.");
    this.coords = coords;
    const maxTriangles = Math.max(2 * n - 5, 0);
    this._triangles = new Uint32Array(maxTriangles * 3);
    this._halfedges = new Int32Array(maxTriangles * 3);
    this._hashSize = Math.ceil(Math.sqrt(n));
    this._hullPrev = new Uint32Array(n);
    this._hullNext = new Uint32Array(n);
    this._hullTri = new Uint32Array(n);
    this._hullHash = new Int32Array(this._hashSize);
    this._ids = new Uint32Array(n);
    this._dists = new Float64Array(n);
    this.trianglesLen = 0;
    this._cx = 0;
    this._cy = 0;
    this._hullStart = 0;
    this.hull = this._triangles;
    this.triangles = this._triangles;
    this.halfedges = this._halfedges;
    this.update();
  }
  /**
   * Updates the triangulation if you modified `delaunay.coords` values in place, avoiding expensive memory allocations.
   * Useful for iterative relaxation algorithms such as Lloyd's.
   */
  update() {
    const { coords, _hullPrev: hullPrev, _hullNext: hullNext, _hullTri: hullTri, _hullHash: hullHash } = this;
    const n = coords.length >> 1;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY2 = -Infinity;
    for (let i = 0; i < n; i++) {
      const x2 = coords[2 * i];
      const y2 = coords[2 * i + 1];
      if (x2 < minX) minX = x2;
      if (y2 < minY) minY = y2;
      if (x2 > maxX) maxX = x2;
      if (y2 > maxY2) maxY2 = y2;
      this._ids[i] = i;
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY2) / 2;
    let i0 = 0, i1 = 0, i2 = 0;
    for (let i = 0, minDist = Infinity; i < n; i++) {
      const d = dist(cx, cy, coords[2 * i], coords[2 * i + 1]);
      if (d < minDist) {
        i0 = i;
        minDist = d;
      }
    }
    const i0x = coords[2 * i0];
    const i0y = coords[2 * i0 + 1];
    for (let i = 0, minDist = Infinity; i < n; i++) {
      if (i === i0) continue;
      const d = dist(i0x, i0y, coords[2 * i], coords[2 * i + 1]);
      if (d < minDist && d > 0) {
        i1 = i;
        minDist = d;
      }
    }
    let i1x = coords[2 * i1];
    let i1y = coords[2 * i1 + 1];
    let minRadius = Infinity;
    for (let i = 0; i < n; i++) {
      if (i === i0 || i === i1) continue;
      const r = circumradius(i0x, i0y, i1x, i1y, coords[2 * i], coords[2 * i + 1]);
      if (r < minRadius) {
        i2 = i;
        minRadius = r;
      }
    }
    let i2x = coords[2 * i2];
    let i2y = coords[2 * i2 + 1];
    if (minRadius === Infinity) {
      for (let i = 0; i < n; i++) {
        this._dists[i] = coords[2 * i] - coords[0] || coords[2 * i + 1] - coords[1];
      }
      quicksort(this._ids, this._dists, 0, n - 1);
      const hull2 = new Uint32Array(n);
      let j = 0;
      for (let i = 0, d0 = -Infinity; i < n; i++) {
        const id = this._ids[i];
        const d = this._dists[id];
        if (d > d0) {
          hull2[j++] = id;
          d0 = d;
        }
      }
      this.hull = hull2.subarray(0, j);
      this.triangles = new Uint32Array(0);
      this.halfedges = new Int32Array(0);
      return;
    }
    if (orient2d(i0x, i0y, i1x, i1y, i2x, i2y) < 0) {
      const i = i1;
      const x2 = i1x;
      const y2 = i1y;
      i1 = i2;
      i1x = i2x;
      i1y = i2y;
      i2 = i;
      i2x = x2;
      i2y = y2;
    }
    const center2 = circumcenter(i0x, i0y, i1x, i1y, i2x, i2y);
    this._cx = center2.x;
    this._cy = center2.y;
    for (let i = 0; i < n; i++) {
      this._dists[i] = dist(coords[2 * i], coords[2 * i + 1], center2.x, center2.y);
    }
    quicksort(this._ids, this._dists, 0, n - 1);
    this._hullStart = i0;
    let hullSize = 3;
    hullNext[i0] = hullPrev[i2] = i1;
    hullNext[i1] = hullPrev[i0] = i2;
    hullNext[i2] = hullPrev[i1] = i0;
    hullTri[i0] = 0;
    hullTri[i1] = 1;
    hullTri[i2] = 2;
    hullHash.fill(-1);
    hullHash[this._hashKey(i0x, i0y)] = i0;
    hullHash[this._hashKey(i1x, i1y)] = i1;
    hullHash[this._hashKey(i2x, i2y)] = i2;
    this.trianglesLen = 0;
    this._addTriangle(i0, i1, i2, -1, -1, -1);
    for (let k2 = 0, xp = 0, yp = 0; k2 < this._ids.length; k2++) {
      const i = this._ids[k2];
      const x2 = coords[2 * i];
      const y2 = coords[2 * i + 1];
      if (k2 > 0 && Math.abs(x2 - xp) <= EPSILON && Math.abs(y2 - yp) <= EPSILON) continue;
      xp = x2;
      yp = y2;
      if (i === i0 || i === i1 || i === i2) continue;
      let start = 0;
      for (let j = 0, key = this._hashKey(x2, y2); j < this._hashSize; j++) {
        start = hullHash[(key + j) % this._hashSize];
        if (start !== -1 && start !== hullNext[start]) break;
      }
      start = hullPrev[start];
      let e = start, q;
      while (q = hullNext[e], orient2d(x2, y2, coords[2 * e], coords[2 * e + 1], coords[2 * q], coords[2 * q + 1]) >= 0) {
        e = q;
        if (e === start) {
          e = -1;
          break;
        }
      }
      if (e === -1) continue;
      let t = this._addTriangle(e, i, hullNext[e], -1, -1, hullTri[e]);
      hullTri[i] = this._legalize(t + 2);
      hullTri[e] = t;
      hullSize++;
      let n2 = hullNext[e];
      while (q = hullNext[n2], orient2d(x2, y2, coords[2 * n2], coords[2 * n2 + 1], coords[2 * q], coords[2 * q + 1]) < 0) {
        t = this._addTriangle(n2, i, q, hullTri[i], -1, hullTri[n2]);
        hullTri[i] = this._legalize(t + 2);
        hullNext[n2] = n2;
        hullSize--;
        n2 = q;
      }
      if (e === start) {
        while (q = hullPrev[e], orient2d(x2, y2, coords[2 * q], coords[2 * q + 1], coords[2 * e], coords[2 * e + 1]) < 0) {
          t = this._addTriangle(q, i, e, -1, hullTri[e], hullTri[q]);
          this._legalize(t + 2);
          hullTri[q] = t;
          hullNext[e] = e;
          hullSize--;
          e = q;
        }
      }
      this._hullStart = hullPrev[i] = e;
      hullNext[e] = hullPrev[n2] = i;
      hullNext[i] = n2;
      hullHash[this._hashKey(x2, y2)] = i;
      hullHash[this._hashKey(coords[2 * e], coords[2 * e + 1])] = e;
    }
    this.hull = new Uint32Array(hullSize);
    for (let i = 0, e = this._hullStart; i < hullSize; i++) {
      this.hull[i] = e;
      e = hullNext[e];
    }
    this.triangles = this._triangles.subarray(0, this.trianglesLen);
    this.halfedges = this._halfedges.subarray(0, this.trianglesLen);
  }
  /**
   * Calculate an angle-based key for the edge hash used for advancing convex hull.
   *
   * @param {number} x
   * @param {number} y
   * @private
   */
  _hashKey(x2, y2) {
    return Math.floor(pseudoAngle(x2 - this._cx, y2 - this._cy) * this._hashSize) % this._hashSize;
  }
  /**
   * Flip an edge in a pair of triangles if it doesn't satisfy the Delaunay condition.
   *
   * @param {number} a
   * @private
   */
  _legalize(a2) {
    const { _triangles: triangles, _halfedges: halfedges, coords } = this;
    let i = 0;
    let ar = 0;
    while (true) {
      const b = halfedges[a2];
      const a0 = a2 - a2 % 3;
      ar = a0 + (a2 + 2) % 3;
      if (b === -1) {
        if (i === 0) break;
        a2 = EDGE_STACK[--i];
        continue;
      }
      const b0 = b - b % 3;
      const al = a0 + (a2 + 1) % 3;
      const bl = b0 + (b + 2) % 3;
      const p0 = triangles[ar];
      const pr = triangles[a2];
      const pl = triangles[al];
      const p1 = triangles[bl];
      const illegal = inCircle(
        coords[2 * p0],
        coords[2 * p0 + 1],
        coords[2 * pr],
        coords[2 * pr + 1],
        coords[2 * pl],
        coords[2 * pl + 1],
        coords[2 * p1],
        coords[2 * p1 + 1]
      );
      if (illegal) {
        triangles[a2] = p1;
        triangles[b] = p0;
        const hbl = halfedges[bl];
        if (hbl === -1) {
          let e = this._hullStart;
          do {
            if (this._hullTri[e] === bl) {
              this._hullTri[e] = a2;
              break;
            }
            e = this._hullPrev[e];
          } while (e !== this._hullStart);
        }
        this._link(a2, hbl);
        this._link(b, halfedges[ar]);
        this._link(ar, bl);
        const br = b0 + (b + 1) % 3;
        if (i < EDGE_STACK.length) {
          EDGE_STACK[i++] = br;
        }
      } else {
        if (i === 0) break;
        a2 = EDGE_STACK[--i];
      }
    }
    return ar;
  }
  /**
   * Link two half-edges to each other.
   * @param {number} a
   * @param {number} b
   * @private
   */
  _link(a2, b) {
    this._halfedges[a2] = b;
    if (b !== -1) this._halfedges[b] = a2;
  }
  /**
   * Add a new triangle given vertex indices and adjacent half-edge ids.
   *
   * @param {number} i0
   * @param {number} i1
   * @param {number} i2
   * @param {number} a
   * @param {number} b
   * @param {number} c
   * @private
   */
  _addTriangle(i0, i1, i2, a2, b, c3) {
    const t = this.trianglesLen;
    this._triangles[t] = i0;
    this._triangles[t + 1] = i1;
    this._triangles[t + 2] = i2;
    this._link(t, a2);
    this._link(t + 1, b);
    this._link(t + 2, c3);
    this.trianglesLen += 3;
    return t;
  }
};
function pseudoAngle(dx, dy) {
  const p = dx / (Math.abs(dx) + Math.abs(dy));
  return (dy > 0 ? 3 - p : 1 + p) / 4;
}
function dist(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}
function inCircle(ax, ay, bx, by, cx, cy, px, py) {
  const dx = ax - px;
  const dy = ay - py;
  const ex = bx - px;
  const ey = by - py;
  const fx = cx - px;
  const fy = cy - py;
  const ap = dx * dx + dy * dy;
  const bp = ex * ex + ey * ey;
  const cp = fx * fx + fy * fy;
  return dx * (ey * cp - bp * fy) - dy * (ex * cp - bp * fx) + ap * (ex * fy - ey * fx) < 0;
}
function circumradius(ax, ay, bx, by, cx, cy) {
  const dx = bx - ax;
  const dy = by - ay;
  const ex = cx - ax;
  const ey = cy - ay;
  const bl = dx * dx + dy * dy;
  const cl = ex * ex + ey * ey;
  const d = 0.5 / (dx * ey - dy * ex);
  const x2 = (ey * bl - dy * cl) * d;
  const y2 = (dx * cl - ex * bl) * d;
  return x2 * x2 + y2 * y2;
}
function circumcenter(ax, ay, bx, by, cx, cy) {
  const dx = bx - ax;
  const dy = by - ay;
  const ex = cx - ax;
  const ey = cy - ay;
  const bl = dx * dx + dy * dy;
  const cl = ex * ex + ey * ey;
  const d = 0.5 / (dx * ey - dy * ex);
  const x2 = ax + (ey * bl - dy * cl) * d;
  const y2 = ay + (dx * cl - ex * bl) * d;
  return { x: x2, y: y2 };
}
function quicksort(ids, dists, left2, right2) {
  if (right2 - left2 <= 20) {
    for (let i = left2 + 1; i <= right2; i++) {
      const temp = ids[i];
      const tempDist = dists[temp];
      let j = i - 1;
      while (j >= left2 && dists[ids[j]] > tempDist) ids[j + 1] = ids[j--];
      ids[j + 1] = temp;
    }
  } else {
    const median2 = left2 + right2 >> 1;
    let i = left2 + 1;
    let j = right2;
    swap2(ids, median2, i);
    if (dists[ids[left2]] > dists[ids[right2]]) swap2(ids, left2, right2);
    if (dists[ids[i]] > dists[ids[right2]]) swap2(ids, i, right2);
    if (dists[ids[left2]] > dists[ids[i]]) swap2(ids, left2, i);
    const temp = ids[i];
    const tempDist = dists[temp];
    while (true) {
      do
        i++;
      while (dists[ids[i]] < tempDist);
      do
        j--;
      while (dists[ids[j]] > tempDist);
      if (j < i) break;
      swap2(ids, i, j);
    }
    ids[left2 + 1] = ids[j];
    ids[j] = temp;
    if (right2 - i + 1 >= j - left2) {
      quicksort(ids, dists, i, right2);
      quicksort(ids, dists, left2, j - 1);
    } else {
      quicksort(ids, dists, left2, j - 1);
      quicksort(ids, dists, i, right2);
    }
  }
}
function swap2(arr, i, j) {
  const tmp = arr[i];
  arr[i] = arr[j];
  arr[j] = tmp;
}
function defaultGetX(p) {
  return p[0];
}
function defaultGetY(p) {
  return p[1];
}
var epsilon4 = 1e-6;
var Path2 = class {
  constructor() {
    this._x0 = this._y0 = // start of current subpath
    this._x1 = this._y1 = null;
    this._ = "";
  }
  moveTo(x2, y2) {
    this._ += `M${this._x0 = this._x1 = +x2},${this._y0 = this._y1 = +y2}`;
  }
  closePath() {
    if (this._x1 !== null) {
      this._x1 = this._x0, this._y1 = this._y0;
      this._ += "Z";
    }
  }
  lineTo(x2, y2) {
    this._ += `L${this._x1 = +x2},${this._y1 = +y2}`;
  }
  arc(x2, y2, r) {
    x2 = +x2, y2 = +y2, r = +r;
    const x02 = x2 + r;
    const y02 = y2;
    if (r < 0) throw new Error("negative radius");
    if (this._x1 === null) this._ += `M${x02},${y02}`;
    else if (Math.abs(this._x1 - x02) > epsilon4 || Math.abs(this._y1 - y02) > epsilon4) this._ += "L" + x02 + "," + y02;
    if (!r) return;
    this._ += `A${r},${r},0,1,1,${x2 - r},${y2}A${r},${r},0,1,1,${this._x1 = x02},${this._y1 = y02}`;
  }
  rect(x2, y2, w, h) {
    this._ += `M${this._x0 = this._x1 = +x2},${this._y0 = this._y1 = +y2}h${+w}v${+h}h${-w}Z`;
  }
  value() {
    return this._ || null;
  }
};
var Polygon = class {
  constructor() {
    this._ = [];
  }
  moveTo(x2, y2) {
    this._.push([x2, y2]);
  }
  closePath() {
    this._.push(this._[0].slice());
  }
  lineTo(x2, y2) {
    this._.push([x2, y2]);
  }
  value() {
    return this._.length ? this._ : null;
  }
};
var Voronoi = class {
  constructor(delaunay, [xmin, ymin, xmax, ymax] = [0, 0, 960, 500]) {
    if (!((xmax = +xmax) >= (xmin = +xmin)) || !((ymax = +ymax) >= (ymin = +ymin))) throw new Error("invalid bounds");
    this.delaunay = delaunay;
    this._circumcenters = new Float64Array(delaunay.points.length * 2);
    this.vectors = new Float64Array(delaunay.points.length * 2);
    this.xmax = xmax, this.xmin = xmin;
    this.ymax = ymax, this.ymin = ymin;
    this._init();
  }
  update() {
    this.delaunay.update();
    this._init();
    return this;
  }
  _init() {
    const { delaunay: { points, hull: hull2, triangles }, vectors } = this;
    let bx, by;
    const circumcenters = this.circumcenters = this._circumcenters.subarray(0, triangles.length / 3 * 2);
    for (let i = 0, j = 0, n = triangles.length, x2, y2; i < n; i += 3, j += 2) {
      const t13 = triangles[i] * 2;
      const t22 = triangles[i + 1] * 2;
      const t32 = triangles[i + 2] * 2;
      const x13 = points[t13];
      const y13 = points[t13 + 1];
      const x22 = points[t22];
      const y22 = points[t22 + 1];
      const x3 = points[t32];
      const y3 = points[t32 + 1];
      const dx = x22 - x13;
      const dy = y22 - y13;
      const ex = x3 - x13;
      const ey = y3 - y13;
      const ab = (dx * ey - dy * ex) * 2;
      if (Math.abs(ab) < 1e-9) {
        if (bx === void 0) {
          bx = by = 0;
          for (const i2 of hull2) bx += points[i2 * 2], by += points[i2 * 2 + 1];
          bx /= hull2.length, by /= hull2.length;
        }
        const a2 = 1e9 * Math.sign((bx - x13) * ey - (by - y13) * ex);
        x2 = (x13 + x3) / 2 - a2 * ey;
        y2 = (y13 + y3) / 2 + a2 * ex;
      } else {
        const d = 1 / ab;
        const bl = dx * dx + dy * dy;
        const cl = ex * ex + ey * ey;
        x2 = x13 + (ey * bl - dy * cl) * d;
        y2 = y13 + (dx * cl - ex * bl) * d;
      }
      circumcenters[j] = x2;
      circumcenters[j + 1] = y2;
    }
    let h = hull2[hull2.length - 1];
    let p0, p1 = h * 4;
    let x02, x12 = points[2 * h];
    let y02, y12 = points[2 * h + 1];
    vectors.fill(0);
    for (let i = 0; i < hull2.length; ++i) {
      h = hull2[i];
      p0 = p1, x02 = x12, y02 = y12;
      p1 = h * 4, x12 = points[2 * h], y12 = points[2 * h + 1];
      vectors[p0 + 2] = vectors[p1] = y02 - y12;
      vectors[p0 + 3] = vectors[p1 + 1] = x12 - x02;
    }
  }
  render(context) {
    const buffer = context == null ? context = new Path2() : void 0;
    const { delaunay: { halfedges, inedges, hull: hull2 }, circumcenters, vectors } = this;
    if (hull2.length <= 1) return null;
    for (let i = 0, n = halfedges.length; i < n; ++i) {
      const j = halfedges[i];
      if (j < i) continue;
      const ti = Math.floor(i / 3) * 2;
      const tj = Math.floor(j / 3) * 2;
      const xi = circumcenters[ti];
      const yi = circumcenters[ti + 1];
      const xj = circumcenters[tj];
      const yj = circumcenters[tj + 1];
      this._renderSegment(xi, yi, xj, yj, context);
    }
    let h0, h1 = hull2[hull2.length - 1];
    for (let i = 0; i < hull2.length; ++i) {
      h0 = h1, h1 = hull2[i];
      const t = Math.floor(inedges[h1] / 3) * 2;
      const x2 = circumcenters[t];
      const y2 = circumcenters[t + 1];
      const v = h0 * 4;
      const p = this._project(x2, y2, vectors[v + 2], vectors[v + 3]);
      if (p) this._renderSegment(x2, y2, p[0], p[1], context);
    }
    return buffer && buffer.value();
  }
  renderBounds(context) {
    const buffer = context == null ? context = new Path2() : void 0;
    context.rect(this.xmin, this.ymin, this.xmax - this.xmin, this.ymax - this.ymin);
    return buffer && buffer.value();
  }
  renderCell(i, context) {
    const buffer = context == null ? context = new Path2() : void 0;
    const points = this._clip(i);
    if (points === null || !points.length) return;
    context.moveTo(points[0], points[1]);
    let n = points.length;
    while (points[0] === points[n - 2] && points[1] === points[n - 1] && n > 1) n -= 2;
    for (let i2 = 2; i2 < n; i2 += 2) {
      if (points[i2] !== points[i2 - 2] || points[i2 + 1] !== points[i2 - 1])
        context.lineTo(points[i2], points[i2 + 1]);
    }
    context.closePath();
    return buffer && buffer.value();
  }
  *cellPolygons() {
    const { delaunay: { points } } = this;
    for (let i = 0, n = points.length / 2; i < n; ++i) {
      const cell2 = this.cellPolygon(i);
      if (cell2) cell2.index = i, yield cell2;
    }
  }
  cellPolygon(i) {
    const polygon = new Polygon();
    this.renderCell(i, polygon);
    return polygon.value();
  }
  _renderSegment(x02, y02, x12, y12, context) {
    let S;
    const c0 = this._regioncode(x02, y02);
    const c1 = this._regioncode(x12, y12);
    if (c0 === 0 && c1 === 0) {
      context.moveTo(x02, y02);
      context.lineTo(x12, y12);
    } else if (S = this._clipSegment(x02, y02, x12, y12, c0, c1)) {
      context.moveTo(S[0], S[1]);
      context.lineTo(S[2], S[3]);
    }
  }
  contains(i, x2, y2) {
    if ((x2 = +x2, x2 !== x2) || (y2 = +y2, y2 !== y2)) return false;
    return this.delaunay._step(i, x2, y2) === i;
  }
  *neighbors(i) {
    const ci = this._clip(i);
    if (ci) for (const j of this.delaunay.neighbors(i)) {
      const cj = this._clip(j);
      if (cj) loop: for (let ai = 0, li = ci.length; ai < li; ai += 2) {
        for (let aj = 0, lj = cj.length; aj < lj; aj += 2) {
          if (ci[ai] === cj[aj] && ci[ai + 1] === cj[aj + 1] && ci[(ai + 2) % li] === cj[(aj + lj - 2) % lj] && ci[(ai + 3) % li] === cj[(aj + lj - 1) % lj]) {
            yield j;
            break loop;
          }
        }
      }
    }
  }
  _cell(i) {
    const { circumcenters, delaunay: { inedges, halfedges, triangles } } = this;
    const e0 = inedges[i];
    if (e0 === -1) return null;
    const points = [];
    let e = e0;
    do {
      const t = Math.floor(e / 3);
      points.push(circumcenters[t * 2], circumcenters[t * 2 + 1]);
      e = e % 3 === 2 ? e - 2 : e + 1;
      if (triangles[e] !== i) break;
      e = halfedges[e];
    } while (e !== e0 && e !== -1);
    return points;
  }
  _clip(i) {
    if (i === 0 && this.delaunay.hull.length === 1) {
      return [this.xmax, this.ymin, this.xmax, this.ymax, this.xmin, this.ymax, this.xmin, this.ymin];
    }
    const points = this._cell(i);
    if (points === null) return null;
    const { vectors: V } = this;
    const v = i * 4;
    return this._simplify(V[v] || V[v + 1] ? this._clipInfinite(i, points, V[v], V[v + 1], V[v + 2], V[v + 3]) : this._clipFinite(i, points));
  }
  _clipFinite(i, points) {
    const n = points.length;
    let P = null;
    let x02, y02, x12 = points[n - 2], y12 = points[n - 1];
    let c0, c1 = this._regioncode(x12, y12);
    let e0, e1 = 0;
    for (let j = 0; j < n; j += 2) {
      x02 = x12, y02 = y12, x12 = points[j], y12 = points[j + 1];
      c0 = c1, c1 = this._regioncode(x12, y12);
      if (c0 === 0 && c1 === 0) {
        e0 = e1, e1 = 0;
        if (P) P.push(x12, y12);
        else P = [x12, y12];
      } else {
        let S, sx0, sy0, sx1, sy1;
        if (c0 === 0) {
          if ((S = this._clipSegment(x02, y02, x12, y12, c0, c1)) === null) continue;
          [sx0, sy0, sx1, sy1] = S;
        } else {
          if ((S = this._clipSegment(x12, y12, x02, y02, c1, c0)) === null) continue;
          [sx1, sy1, sx0, sy0] = S;
          e0 = e1, e1 = this._edgecode(sx0, sy0);
          if (e0 && e1) this._edge(i, e0, e1, P, P.length);
          if (P) P.push(sx0, sy0);
          else P = [sx0, sy0];
        }
        e0 = e1, e1 = this._edgecode(sx1, sy1);
        if (e0 && e1) this._edge(i, e0, e1, P, P.length);
        if (P) P.push(sx1, sy1);
        else P = [sx1, sy1];
      }
    }
    if (P) {
      e0 = e1, e1 = this._edgecode(P[0], P[1]);
      if (e0 && e1) this._edge(i, e0, e1, P, P.length);
    } else if (this.contains(i, (this.xmin + this.xmax) / 2, (this.ymin + this.ymax) / 2)) {
      return [this.xmax, this.ymin, this.xmax, this.ymax, this.xmin, this.ymax, this.xmin, this.ymin];
    }
    return P;
  }
  _clipSegment(x02, y02, x12, y12, c0, c1) {
    const flip2 = c0 < c1;
    if (flip2) [x02, y02, x12, y12, c0, c1] = [x12, y12, x02, y02, c1, c0];
    while (true) {
      if (c0 === 0 && c1 === 0) return flip2 ? [x12, y12, x02, y02] : [x02, y02, x12, y12];
      if (c0 & c1) return null;
      let x2, y2, c3 = c0 || c1;
      if (c3 & 8) x2 = x02 + (x12 - x02) * (this.ymax - y02) / (y12 - y02), y2 = this.ymax;
      else if (c3 & 4) x2 = x02 + (x12 - x02) * (this.ymin - y02) / (y12 - y02), y2 = this.ymin;
      else if (c3 & 2) y2 = y02 + (y12 - y02) * (this.xmax - x02) / (x12 - x02), x2 = this.xmax;
      else y2 = y02 + (y12 - y02) * (this.xmin - x02) / (x12 - x02), x2 = this.xmin;
      if (c0) x02 = x2, y02 = y2, c0 = this._regioncode(x02, y02);
      else x12 = x2, y12 = y2, c1 = this._regioncode(x12, y12);
    }
  }
  _clipInfinite(i, points, vx0, vy0, vxn, vyn) {
    let P = Array.from(points), p;
    if (p = this._project(P[0], P[1], vx0, vy0)) P.unshift(p[0], p[1]);
    if (p = this._project(P[P.length - 2], P[P.length - 1], vxn, vyn)) P.push(p[0], p[1]);
    if (P = this._clipFinite(i, P)) {
      for (let j = 0, n = P.length, c0, c1 = this._edgecode(P[n - 2], P[n - 1]); j < n; j += 2) {
        c0 = c1, c1 = this._edgecode(P[j], P[j + 1]);
        if (c0 && c1) j = this._edge(i, c0, c1, P, j), n = P.length;
      }
    } else if (this.contains(i, (this.xmin + this.xmax) / 2, (this.ymin + this.ymax) / 2)) {
      P = [this.xmin, this.ymin, this.xmax, this.ymin, this.xmax, this.ymax, this.xmin, this.ymax];
    }
    return P;
  }
  _edge(i, e0, e1, P, j) {
    while (e0 !== e1) {
      let x2, y2;
      switch (e0) {
        case 5:
          e0 = 4;
          continue;
        // top-left
        case 4:
          e0 = 6, x2 = this.xmax, y2 = this.ymin;
          break;
        // top
        case 6:
          e0 = 2;
          continue;
        // top-right
        case 2:
          e0 = 10, x2 = this.xmax, y2 = this.ymax;
          break;
        // right
        case 10:
          e0 = 8;
          continue;
        // bottom-right
        case 8:
          e0 = 9, x2 = this.xmin, y2 = this.ymax;
          break;
        // bottom
        case 9:
          e0 = 1;
          continue;
        // bottom-left
        case 1:
          e0 = 5, x2 = this.xmin, y2 = this.ymin;
          break;
      }
      if ((P[j] !== x2 || P[j + 1] !== y2) && this.contains(i, x2, y2)) {
        P.splice(j, 0, x2, y2), j += 2;
      }
    }
    return j;
  }
  _project(x02, y02, vx, vy) {
    let t = Infinity, c3, x2, y2;
    if (vy < 0) {
      if (y02 <= this.ymin) return null;
      if ((c3 = (this.ymin - y02) / vy) < t) y2 = this.ymin, x2 = x02 + (t = c3) * vx;
    } else if (vy > 0) {
      if (y02 >= this.ymax) return null;
      if ((c3 = (this.ymax - y02) / vy) < t) y2 = this.ymax, x2 = x02 + (t = c3) * vx;
    }
    if (vx > 0) {
      if (x02 >= this.xmax) return null;
      if ((c3 = (this.xmax - x02) / vx) < t) x2 = this.xmax, y2 = y02 + (t = c3) * vy;
    } else if (vx < 0) {
      if (x02 <= this.xmin) return null;
      if ((c3 = (this.xmin - x02) / vx) < t) x2 = this.xmin, y2 = y02 + (t = c3) * vy;
    }
    return [x2, y2];
  }
  _edgecode(x2, y2) {
    return (x2 === this.xmin ? 1 : x2 === this.xmax ? 2 : 0) | (y2 === this.ymin ? 4 : y2 === this.ymax ? 8 : 0);
  }
  _regioncode(x2, y2) {
    return (x2 < this.xmin ? 1 : x2 > this.xmax ? 2 : 0) | (y2 < this.ymin ? 4 : y2 > this.ymax ? 8 : 0);
  }
  _simplify(P) {
    if (P && P.length > 4) {
      for (let i = 0; i < P.length; i += 2) {
        const j = (i + 2) % P.length, k2 = (i + 4) % P.length;
        if (P[i] === P[j] && P[j] === P[k2] || P[i + 1] === P[j + 1] && P[j + 1] === P[k2 + 1]) {
          P.splice(j, 2), i -= 2;
        }
      }
      if (!P.length) P = null;
    }
    return P;
  }
};
var tau2 = 2 * Math.PI;
var pow = Math.pow;
function pointX(p) {
  return p[0];
}
function pointY(p) {
  return p[1];
}
function collinear2(d) {
  const { triangles, coords } = d;
  for (let i = 0; i < triangles.length; i += 3) {
    const a2 = 2 * triangles[i], b = 2 * triangles[i + 1], c3 = 2 * triangles[i + 2], cross4 = (coords[c3] - coords[a2]) * (coords[b + 1] - coords[a2 + 1]) - (coords[b] - coords[a2]) * (coords[c3 + 1] - coords[a2 + 1]);
    if (cross4 > 1e-10) return false;
  }
  return true;
}
function jitter(x2, y2, r) {
  return [x2 + Math.sin(x2 + y2) * r, y2 + Math.cos(x2 - y2) * r];
}
var Delaunay = class _Delaunay {
  static from(points, fx = pointX, fy = pointY, that) {
    return new _Delaunay("length" in points ? flatArray(points, fx, fy, that) : Float64Array.from(flatIterable(points, fx, fy, that)));
  }
  constructor(points) {
    this._delaunator = new Delaunator(points);
    this.inedges = new Int32Array(points.length / 2);
    this._hullIndex = new Int32Array(points.length / 2);
    this.points = this._delaunator.coords;
    this._init();
  }
  update() {
    this._delaunator.update();
    this._init();
    return this;
  }
  _init() {
    const d = this._delaunator, points = this.points;
    if (d.hull && d.hull.length > 2 && collinear2(d)) {
      this.collinear = Int32Array.from({ length: points.length / 2 }, (_, i) => i).sort((i, j) => points[2 * i] - points[2 * j] || points[2 * i + 1] - points[2 * j + 1]);
      const e = this.collinear[0], f = this.collinear[this.collinear.length - 1], bounds = [points[2 * e], points[2 * e + 1], points[2 * f], points[2 * f + 1]], r = 1e-8 * Math.hypot(bounds[3] - bounds[1], bounds[2] - bounds[0]);
      for (let i = 0, n = points.length / 2; i < n; ++i) {
        const p = jitter(points[2 * i], points[2 * i + 1], r);
        points[2 * i] = p[0];
        points[2 * i + 1] = p[1];
      }
      this._delaunator = new Delaunator(points);
    } else {
      delete this.collinear;
    }
    const halfedges = this.halfedges = this._delaunator.halfedges;
    const hull2 = this.hull = this._delaunator.hull;
    const triangles = this.triangles = this._delaunator.triangles;
    const inedges = this.inedges.fill(-1);
    const hullIndex = this._hullIndex.fill(-1);
    for (let e = 0, n = halfedges.length; e < n; ++e) {
      const p = triangles[e % 3 === 2 ? e - 2 : e + 1];
      if (halfedges[e] === -1 || inedges[p] === -1) inedges[p] = e;
    }
    for (let i = 0, n = hull2.length; i < n; ++i) {
      hullIndex[hull2[i]] = i;
    }
    if (hull2.length <= 2 && hull2.length > 0) {
      this.triangles = new Int32Array(3).fill(-1);
      this.halfedges = new Int32Array(3).fill(-1);
      this.triangles[0] = hull2[0];
      inedges[hull2[0]] = 1;
      if (hull2.length === 2) {
        inedges[hull2[1]] = 0;
        this.triangles[1] = hull2[1];
        this.triangles[2] = hull2[1];
      }
    }
  }
  voronoi(bounds) {
    return new Voronoi(this, bounds);
  }
  *neighbors(i) {
    const { inedges, hull: hull2, _hullIndex, halfedges, triangles, collinear: collinear3 } = this;
    if (collinear3) {
      const l = collinear3.indexOf(i);
      if (l > 0) yield collinear3[l - 1];
      if (l < collinear3.length - 1) yield collinear3[l + 1];
      return;
    }
    const e0 = inedges[i];
    if (e0 === -1) return;
    let e = e0, p0 = -1;
    do {
      yield p0 = triangles[e];
      e = e % 3 === 2 ? e - 2 : e + 1;
      if (triangles[e] !== i) return;
      e = halfedges[e];
      if (e === -1) {
        const p = hull2[(_hullIndex[i] + 1) % hull2.length];
        if (p !== p0) yield p;
        return;
      }
    } while (e !== e0);
  }
  find(x2, y2, i = 0) {
    if ((x2 = +x2, x2 !== x2) || (y2 = +y2, y2 !== y2)) return -1;
    const i0 = i;
    let c3;
    while ((c3 = this._step(i, x2, y2)) >= 0 && c3 !== i && c3 !== i0) i = c3;
    return c3;
  }
  _step(i, x2, y2) {
    const { inedges, hull: hull2, _hullIndex, halfedges, triangles, points } = this;
    if (points.length < 2) return -1;
    if (inedges[i] === -1) return (i + 1) % (points.length >> 1);
    let c3 = i;
    let dc = pow(x2 - points[i * 2], 2) + pow(y2 - points[i * 2 + 1], 2);
    const e0 = inedges[i];
    let e = e0;
    do {
      let t = triangles[e];
      const dt = pow(x2 - points[t * 2], 2) + pow(y2 - points[t * 2 + 1], 2);
      if (dt < dc) dc = dt, c3 = t;
      e = e % 3 === 2 ? e - 2 : e + 1;
      if (triangles[e] !== i) break;
      e = halfedges[e];
      if (e === -1) {
        e = hull2[(_hullIndex[i] + 1) % hull2.length];
        if (e !== t) {
          if (pow(x2 - points[e * 2], 2) + pow(y2 - points[e * 2 + 1], 2) < dc) return e;
        }
        break;
      }
    } while (e !== e0);
    return c3;
  }
  render(context) {
    const buffer = context == null ? context = new Path2() : void 0;
    const { points, halfedges, triangles } = this;
    for (let i = 0, n = halfedges.length; i < n; ++i) {
      const j = halfedges[i];
      if (j < i) continue;
      const ti = triangles[i] * 2;
      const tj = triangles[j] * 2;
      context.moveTo(points[ti], points[ti + 1]);
      context.lineTo(points[tj], points[tj + 1]);
    }
    this.renderHull(context);
    return buffer && buffer.value();
  }
  renderPoints(context, r) {
    if (r === void 0 && (!context || typeof context.moveTo !== "function")) r = context, context = null;
    r = r == void 0 ? 2 : +r;
    const buffer = context == null ? context = new Path2() : void 0;
    const { points } = this;
    for (let i = 0, n = points.length & -2; i < n; i += 2) {
      const x2 = points[i], y2 = points[i + 1];
      context.moveTo(x2 + r, y2);
      context.arc(x2, y2, r, 0, tau2);
    }
    return buffer && buffer.value();
  }
  renderHull(context) {
    const buffer = context == null ? context = new Path2() : void 0;
    const { hull: hull2, points } = this;
    const h = hull2[0] * 2, n = hull2.length;
    context.moveTo(points[h], points[h + 1]);
    for (let i = 1; i < n; ++i) {
      const h2 = 2 * hull2[i];
      context.lineTo(points[h2], points[h2 + 1]);
    }
    context.closePath();
    return buffer && buffer.value();
  }
  hullPolygon() {
    const polygon = new Polygon();
    this.renderHull(polygon);
    return polygon.value();
  }
  renderTriangle(i, context) {
    const buffer = context == null ? context = new Path2() : void 0;
    const { points, triangles } = this;
    const t03 = triangles[i *= 3] * 2;
    const t13 = triangles[i + 1] * 2;
    const t22 = triangles[i + 2] * 2;
    context.moveTo(points[t03], points[t03 + 1]);
    context.lineTo(points[t13], points[t13 + 1]);
    context.lineTo(points[t22], points[t22 + 1]);
    context.closePath();
    return buffer && buffer.value();
  }
  *trianglePolygons() {
    const { triangles } = this;
    for (let i = 0, n = triangles.length / 3; i < n; ++i) {
      yield this.trianglePolygon(i);
    }
  }
  trianglePolygon(i) {
    const polygon = new Polygon();
    this.renderTriangle(i, polygon);
    return polygon.value();
  }
};
function flatArray(points, fx, fy, that) {
  const n = points.length;
  const array5 = new Float64Array(n * 2);
  for (let i = 0; i < n; ++i) {
    const p = points[i];
    array5[i * 2] = fx.call(that, p, i, points);
    array5[i * 2 + 1] = fy.call(that, p, i, points);
  }
  return array5;
}
function* flatIterable(points, fx, fy, that) {
  let i = 0;
  for (const p of points) {
    yield fx.call(that, p, i, points);
    yield fy.call(that, p, i, points);
    ++i;
  }
}

// node_modules/d3-format/dist/d3-format.mjs
function formatDecimal(x2) {
  return Math.abs(x2 = Math.round(x2)) >= 1e21 ? x2.toLocaleString("en").replace(/,/g, "") : x2.toString(10);
}
function formatDecimalParts(x2, p) {
  if (!isFinite(x2) || x2 === 0) return null;
  var i = (x2 = p ? x2.toExponential(p - 1) : x2.toExponential()).indexOf("e"), coefficient = x2.slice(0, i);
  return [
    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
    +x2.slice(i + 1)
  ];
}
function exponent(x2) {
  return x2 = formatDecimalParts(Math.abs(x2)), x2 ? x2[1] : NaN;
}
function formatGroup(grouping, thousands) {
  return function(value2, width) {
    var i = value2.length, t = [], j = 0, g = grouping[0], length2 = 0;
    while (i > 0 && g > 0) {
      if (length2 + g + 1 > width) g = Math.max(1, width - length2);
      t.push(value2.substring(i -= g, i + g));
      if ((length2 += g + 1) > width) break;
      g = grouping[j = (j + 1) % grouping.length];
    }
    return t.reverse().join(thousands);
  };
}
function formatNumerals(numerals) {
  return function(value2) {
    return value2.replace(/[0-9]/g, function(i) {
      return numerals[+i];
    });
  };
}
var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;
function formatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
  var match;
  return new FormatSpecifier({
    fill: match[1],
    align: match[2],
    sign: match[3],
    symbol: match[4],
    zero: match[5],
    width: match[6],
    comma: match[7],
    precision: match[8] && match[8].slice(1),
    trim: match[9],
    type: match[10]
  });
}
formatSpecifier.prototype = FormatSpecifier.prototype;
function FormatSpecifier(specifier) {
  this.fill = specifier.fill === void 0 ? " " : specifier.fill + "";
  this.align = specifier.align === void 0 ? ">" : specifier.align + "";
  this.sign = specifier.sign === void 0 ? "-" : specifier.sign + "";
  this.symbol = specifier.symbol === void 0 ? "" : specifier.symbol + "";
  this.zero = !!specifier.zero;
  this.width = specifier.width === void 0 ? void 0 : +specifier.width;
  this.comma = !!specifier.comma;
  this.precision = specifier.precision === void 0 ? void 0 : +specifier.precision;
  this.trim = !!specifier.trim;
  this.type = specifier.type === void 0 ? "" : specifier.type + "";
}
FormatSpecifier.prototype.toString = function() {
  return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width === void 0 ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision === void 0 ? "" : "." + Math.max(0, this.precision | 0)) + (this.trim ? "~" : "") + this.type;
};
function formatTrim(s2) {
  out: for (var n = s2.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (s2[i]) {
      case ".":
        i0 = i1 = i;
        break;
      case "0":
        if (i0 === 0) i0 = i;
        i1 = i;
        break;
      default:
        if (!+s2[i]) break out;
        if (i0 > 0) i0 = 0;
        break;
    }
  }
  return i0 > 0 ? s2.slice(0, i0) + s2.slice(i1 + 1) : s2;
}
var prefixExponent;
function formatPrefixAuto(x2, p) {
  var d = formatDecimalParts(x2, p);
  if (!d) return prefixExponent = void 0, x2.toPrecision(p);
  var coefficient = d[0], exponent2 = d[1], i = exponent2 - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent2 / 3))) * 3) + 1, n = coefficient.length;
  return i === n ? coefficient : i > n ? coefficient + new Array(i - n + 1).join("0") : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i) : "0." + new Array(1 - i).join("0") + formatDecimalParts(x2, Math.max(0, p + i - 1))[0];
}
function formatRounded(x2, p) {
  var d = formatDecimalParts(x2, p);
  if (!d) return x2 + "";
  var coefficient = d[0], exponent2 = d[1];
  return exponent2 < 0 ? "0." + new Array(-exponent2).join("0") + coefficient : coefficient.length > exponent2 + 1 ? coefficient.slice(0, exponent2 + 1) + "." + coefficient.slice(exponent2 + 1) : coefficient + new Array(exponent2 - coefficient.length + 2).join("0");
}
var formatTypes = {
  "%": (x2, p) => (x2 * 100).toFixed(p),
  "b": (x2) => Math.round(x2).toString(2),
  "c": (x2) => x2 + "",
  "d": formatDecimal,
  "e": (x2, p) => x2.toExponential(p),
  "f": (x2, p) => x2.toFixed(p),
  "g": (x2, p) => x2.toPrecision(p),
  "o": (x2) => Math.round(x2).toString(8),
  "p": (x2, p) => formatRounded(x2 * 100, p),
  "r": formatRounded,
  "s": formatPrefixAuto,
  "X": (x2) => Math.round(x2).toString(16).toUpperCase(),
  "x": (x2) => Math.round(x2).toString(16)
};
function identity4(x2) {
  return x2;
}
var map = Array.prototype.map;
var prefixes = ["y", "z", "a", "f", "p", "n", "\xB5", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];
function formatLocale(locale3) {
  var group3 = locale3.grouping === void 0 || locale3.thousands === void 0 ? identity4 : formatGroup(map.call(locale3.grouping, Number), locale3.thousands + ""), currencyPrefix = locale3.currency === void 0 ? "" : locale3.currency[0] + "", currencySuffix = locale3.currency === void 0 ? "" : locale3.currency[1] + "", decimal = locale3.decimal === void 0 ? "." : locale3.decimal + "", numerals = locale3.numerals === void 0 ? identity4 : formatNumerals(map.call(locale3.numerals, String)), percent = locale3.percent === void 0 ? "%" : locale3.percent + "", minus = locale3.minus === void 0 ? "\u2212" : locale3.minus + "", nan = locale3.nan === void 0 ? "NaN" : locale3.nan + "";
  function newFormat(specifier, options) {
    specifier = formatSpecifier(specifier);
    var fill = specifier.fill, align = specifier.align, sign3 = specifier.sign, symbol2 = specifier.symbol, zero3 = specifier.zero, width = specifier.width, comma = specifier.comma, precision = specifier.precision, trim = specifier.trim, type = specifier.type;
    if (type === "n") comma = true, type = "g";
    else if (!formatTypes[type]) precision === void 0 && (precision = 12), trim = true, type = "g";
    if (zero3 || fill === "0" && align === "=") zero3 = true, fill = "0", align = "=";
    var prefix = (options && options.prefix !== void 0 ? options.prefix : "") + (symbol2 === "$" ? currencyPrefix : symbol2 === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : ""), suffix = (symbol2 === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "") + (options && options.suffix !== void 0 ? options.suffix : "");
    var formatType = formatTypes[type], maybeSuffix = /[defgprs%]/.test(type);
    precision = precision === void 0 ? 6 : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision)) : Math.max(0, Math.min(20, precision));
    function format3(value2) {
      var valuePrefix = prefix, valueSuffix = suffix, i, n, c3;
      if (type === "c") {
        valueSuffix = formatType(value2) + valueSuffix;
        value2 = "";
      } else {
        value2 = +value2;
        var valueNegative = value2 < 0 || 1 / value2 < 0;
        value2 = isNaN(value2) ? nan : formatType(Math.abs(value2), precision);
        if (trim) value2 = formatTrim(value2);
        if (valueNegative && +value2 === 0 && sign3 !== "+") valueNegative = false;
        valuePrefix = (valueNegative ? sign3 === "(" ? sign3 : minus : sign3 === "-" || sign3 === "(" ? "" : sign3) + valuePrefix;
        valueSuffix = (type === "s" && !isNaN(value2) && prefixExponent !== void 0 ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign3 === "(" ? ")" : "");
        if (maybeSuffix) {
          i = -1, n = value2.length;
          while (++i < n) {
            if (c3 = value2.charCodeAt(i), 48 > c3 || c3 > 57) {
              valueSuffix = (c3 === 46 ? decimal + value2.slice(i + 1) : value2.slice(i)) + valueSuffix;
              value2 = value2.slice(0, i);
              break;
            }
          }
        }
      }
      if (comma && !zero3) value2 = group3(value2, Infinity);
      var length2 = valuePrefix.length + value2.length + valueSuffix.length, padding = length2 < width ? new Array(width - length2 + 1).join(fill) : "";
      if (comma && zero3) value2 = group3(padding + value2, padding.length ? width - valueSuffix.length : Infinity), padding = "";
      switch (align) {
        case "<":
          value2 = valuePrefix + value2 + valueSuffix + padding;
          break;
        case "=":
          value2 = valuePrefix + padding + value2 + valueSuffix;
          break;
        case "^":
          value2 = padding.slice(0, length2 = padding.length >> 1) + valuePrefix + value2 + valueSuffix + padding.slice(length2);
          break;
        default:
          value2 = padding + valuePrefix + value2 + valueSuffix;
          break;
      }
      return numerals(value2);
    }
    format3.toString = function() {
      return specifier + "";
    };
    return format3;
  }
  function formatPrefix2(specifier, value2) {
    var e = Math.max(-8, Math.min(8, Math.floor(exponent(value2) / 3))) * 3, k2 = Math.pow(10, -e), f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier), { suffix: prefixes[8 + e / 3] });
    return function(value3) {
      return f(k2 * value3);
    };
  }
  return {
    format: newFormat,
    formatPrefix: formatPrefix2
  };
}
var locale;
var format;
var formatPrefix;
defaultLocale({
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});
function defaultLocale(definition) {
  locale = formatLocale(definition);
  format = locale.format;
  formatPrefix = locale.formatPrefix;
  return locale;
}
function precisionFixed(step2) {
  return Math.max(0, -exponent(Math.abs(step2)));
}
function precisionPrefix(step2, value2) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value2) / 3))) * 3 - exponent(Math.abs(step2)));
}
function precisionRound(step2, max2) {
  step2 = Math.abs(step2), max2 = Math.abs(max2) - step2;
  return Math.max(0, exponent(max2) - exponent(step2)) + 1;
}

// node_modules/d3-geo/dist/d3-geo.mjs
var epsilon5 = 1e-6;
var epsilon22 = 1e-12;
var pi2 = Math.PI;
var halfPi = pi2 / 2;
var quarterPi = pi2 / 4;
var tau3 = pi2 * 2;
var degrees3 = 180 / pi2;
var radians2 = pi2 / 180;
var abs = Math.abs;
var atan = Math.atan;
var atan2 = Math.atan2;
var cos = Math.cos;
var ceil = Math.ceil;
var exp = Math.exp;
var hypot = Math.hypot;
var log = Math.log;
var pow2 = Math.pow;
var sin = Math.sin;
var sign = Math.sign || function(x2) {
  return x2 > 0 ? 1 : x2 < 0 ? -1 : 0;
};
var sqrt = Math.sqrt;
var tan = Math.tan;
function acos(x2) {
  return x2 > 1 ? 0 : x2 < -1 ? pi2 : Math.acos(x2);
}
function asin(x2) {
  return x2 > 1 ? halfPi : x2 < -1 ? -halfPi : Math.asin(x2);
}
function noop2() {
}
function streamGeometry(geometry, stream) {
  if (geometry && streamGeometryType.hasOwnProperty(geometry.type)) {
    streamGeometryType[geometry.type](geometry, stream);
  }
}
var streamObjectType = {
  Feature: function(object2, stream) {
    streamGeometry(object2.geometry, stream);
  },
  FeatureCollection: function(object2, stream) {
    var features = object2.features, i = -1, n = features.length;
    while (++i < n) streamGeometry(features[i].geometry, stream);
  }
};
var streamGeometryType = {
  Sphere: function(object2, stream) {
    stream.sphere();
  },
  Point: function(object2, stream) {
    object2 = object2.coordinates;
    stream.point(object2[0], object2[1], object2[2]);
  },
  MultiPoint: function(object2, stream) {
    var coordinates = object2.coordinates, i = -1, n = coordinates.length;
    while (++i < n) object2 = coordinates[i], stream.point(object2[0], object2[1], object2[2]);
  },
  LineString: function(object2, stream) {
    streamLine(object2.coordinates, stream, 0);
  },
  MultiLineString: function(object2, stream) {
    var coordinates = object2.coordinates, i = -1, n = coordinates.length;
    while (++i < n) streamLine(coordinates[i], stream, 0);
  },
  Polygon: function(object2, stream) {
    streamPolygon(object2.coordinates, stream);
  },
  MultiPolygon: function(object2, stream) {
    var coordinates = object2.coordinates, i = -1, n = coordinates.length;
    while (++i < n) streamPolygon(coordinates[i], stream);
  },
  GeometryCollection: function(object2, stream) {
    var geometries = object2.geometries, i = -1, n = geometries.length;
    while (++i < n) streamGeometry(geometries[i], stream);
  }
};
function streamLine(coordinates, stream, closed) {
  var i = -1, n = coordinates.length - closed, coordinate;
  stream.lineStart();
  while (++i < n) coordinate = coordinates[i], stream.point(coordinate[0], coordinate[1], coordinate[2]);
  stream.lineEnd();
}
function streamPolygon(coordinates, stream) {
  var i = -1, n = coordinates.length;
  stream.polygonStart();
  while (++i < n) streamLine(coordinates[i], stream, 1);
  stream.polygonEnd();
}
function geoStream(object2, stream) {
  if (object2 && streamObjectType.hasOwnProperty(object2.type)) {
    streamObjectType[object2.type](object2, stream);
  } else {
    streamGeometry(object2, stream);
  }
}
var areaRingSum$1 = new Adder();
var areaSum$1 = new Adder();
function spherical(cartesian2) {
  return [atan2(cartesian2[1], cartesian2[0]), asin(cartesian2[2])];
}
function cartesian(spherical2) {
  var lambda = spherical2[0], phi2 = spherical2[1], cosPhi = cos(phi2);
  return [cosPhi * cos(lambda), cosPhi * sin(lambda), sin(phi2)];
}
function cartesianDot(a2, b) {
  return a2[0] * b[0] + a2[1] * b[1] + a2[2] * b[2];
}
function cartesianCross(a2, b) {
  return [a2[1] * b[2] - a2[2] * b[1], a2[2] * b[0] - a2[0] * b[2], a2[0] * b[1] - a2[1] * b[0]];
}
function cartesianAddInPlace(a2, b) {
  a2[0] += b[0], a2[1] += b[1], a2[2] += b[2];
}
function cartesianScale(vector2, k2) {
  return [vector2[0] * k2, vector2[1] * k2, vector2[2] * k2];
}
function cartesianNormalizeInPlace(d) {
  var l = sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
  d[0] /= l, d[1] /= l, d[2] /= l;
}
var W0;
var W1;
var X0$1;
var Y0$1;
var Z0$1;
var X1$1;
var Y1$1;
var Z1$1;
var X2$1;
var Y2$1;
var Z2$1;
var lambda00;
var phi00;
var x0$4;
var y0$4;
var z0;
var centroidStream$1 = {
  sphere: noop2,
  point: centroidPoint$1,
  lineStart: centroidLineStart$1,
  lineEnd: centroidLineEnd$1,
  polygonStart: function() {
    centroidStream$1.lineStart = centroidRingStart$1;
    centroidStream$1.lineEnd = centroidRingEnd$1;
  },
  polygonEnd: function() {
    centroidStream$1.lineStart = centroidLineStart$1;
    centroidStream$1.lineEnd = centroidLineEnd$1;
  }
};
function centroidPoint$1(lambda, phi2) {
  lambda *= radians2, phi2 *= radians2;
  var cosPhi = cos(phi2);
  centroidPointCartesian(cosPhi * cos(lambda), cosPhi * sin(lambda), sin(phi2));
}
function centroidPointCartesian(x2, y2, z) {
  ++W0;
  X0$1 += (x2 - X0$1) / W0;
  Y0$1 += (y2 - Y0$1) / W0;
  Z0$1 += (z - Z0$1) / W0;
}
function centroidLineStart$1() {
  centroidStream$1.point = centroidLinePointFirst;
}
function centroidLinePointFirst(lambda, phi2) {
  lambda *= radians2, phi2 *= radians2;
  var cosPhi = cos(phi2);
  x0$4 = cosPhi * cos(lambda);
  y0$4 = cosPhi * sin(lambda);
  z0 = sin(phi2);
  centroidStream$1.point = centroidLinePoint;
  centroidPointCartesian(x0$4, y0$4, z0);
}
function centroidLinePoint(lambda, phi2) {
  lambda *= radians2, phi2 *= radians2;
  var cosPhi = cos(phi2), x2 = cosPhi * cos(lambda), y2 = cosPhi * sin(lambda), z = sin(phi2), w = atan2(sqrt((w = y0$4 * z - z0 * y2) * w + (w = z0 * x2 - x0$4 * z) * w + (w = x0$4 * y2 - y0$4 * x2) * w), x0$4 * x2 + y0$4 * y2 + z0 * z);
  W1 += w;
  X1$1 += w * (x0$4 + (x0$4 = x2));
  Y1$1 += w * (y0$4 + (y0$4 = y2));
  Z1$1 += w * (z0 + (z0 = z));
  centroidPointCartesian(x0$4, y0$4, z0);
}
function centroidLineEnd$1() {
  centroidStream$1.point = centroidPoint$1;
}
function centroidRingStart$1() {
  centroidStream$1.point = centroidRingPointFirst;
}
function centroidRingEnd$1() {
  centroidRingPoint(lambda00, phi00);
  centroidStream$1.point = centroidPoint$1;
}
function centroidRingPointFirst(lambda, phi2) {
  lambda00 = lambda, phi00 = phi2;
  lambda *= radians2, phi2 *= radians2;
  centroidStream$1.point = centroidRingPoint;
  var cosPhi = cos(phi2);
  x0$4 = cosPhi * cos(lambda);
  y0$4 = cosPhi * sin(lambda);
  z0 = sin(phi2);
  centroidPointCartesian(x0$4, y0$4, z0);
}
function centroidRingPoint(lambda, phi2) {
  lambda *= radians2, phi2 *= radians2;
  var cosPhi = cos(phi2), x2 = cosPhi * cos(lambda), y2 = cosPhi * sin(lambda), z = sin(phi2), cx = y0$4 * z - z0 * y2, cy = z0 * x2 - x0$4 * z, cz = x0$4 * y2 - y0$4 * x2, m = hypot(cx, cy, cz), w = asin(m), v = m && -w / m;
  X2$1.add(v * cx);
  Y2$1.add(v * cy);
  Z2$1.add(v * cz);
  W1 += w;
  X1$1 += w * (x0$4 + (x0$4 = x2));
  Y1$1 += w * (y0$4 + (y0$4 = y2));
  Z1$1 += w * (z0 + (z0 = z));
  centroidPointCartesian(x0$4, y0$4, z0);
}
function centroid(object2) {
  W0 = W1 = X0$1 = Y0$1 = Z0$1 = X1$1 = Y1$1 = Z1$1 = 0;
  X2$1 = new Adder();
  Y2$1 = new Adder();
  Z2$1 = new Adder();
  geoStream(object2, centroidStream$1);
  var x2 = +X2$1, y2 = +Y2$1, z = +Z2$1, m = hypot(x2, y2, z);
  if (m < epsilon22) {
    x2 = X1$1, y2 = Y1$1, z = Z1$1;
    if (W1 < epsilon5) x2 = X0$1, y2 = Y0$1, z = Z0$1;
    m = hypot(x2, y2, z);
    if (m < epsilon22) return [NaN, NaN];
  }
  return [atan2(y2, x2) * degrees3, asin(z / m) * degrees3];
}
function compose(a2, b) {
  function compose2(x2, y2) {
    return x2 = a2(x2, y2), b(x2[0], x2[1]);
  }
  if (a2.invert && b.invert) compose2.invert = function(x2, y2) {
    return x2 = b.invert(x2, y2), x2 && a2.invert(x2[0], x2[1]);
  };
  return compose2;
}
function rotationIdentity(lambda, phi2) {
  if (abs(lambda) > pi2) lambda -= Math.round(lambda / tau3) * tau3;
  return [lambda, phi2];
}
rotationIdentity.invert = rotationIdentity;
function rotateRadians(deltaLambda, deltaPhi, deltaGamma) {
  return (deltaLambda %= tau3) ? deltaPhi || deltaGamma ? compose(rotationLambda(deltaLambda), rotationPhiGamma(deltaPhi, deltaGamma)) : rotationLambda(deltaLambda) : deltaPhi || deltaGamma ? rotationPhiGamma(deltaPhi, deltaGamma) : rotationIdentity;
}
function forwardRotationLambda(deltaLambda) {
  return function(lambda, phi2) {
    lambda += deltaLambda;
    if (abs(lambda) > pi2) lambda -= Math.round(lambda / tau3) * tau3;
    return [lambda, phi2];
  };
}
function rotationLambda(deltaLambda) {
  var rotation2 = forwardRotationLambda(deltaLambda);
  rotation2.invert = forwardRotationLambda(-deltaLambda);
  return rotation2;
}
function rotationPhiGamma(deltaPhi, deltaGamma) {
  var cosDeltaPhi = cos(deltaPhi), sinDeltaPhi = sin(deltaPhi), cosDeltaGamma = cos(deltaGamma), sinDeltaGamma = sin(deltaGamma);
  function rotation2(lambda, phi2) {
    var cosPhi = cos(phi2), x2 = cos(lambda) * cosPhi, y2 = sin(lambda) * cosPhi, z = sin(phi2), k2 = z * cosDeltaPhi + x2 * sinDeltaPhi;
    return [
      atan2(y2 * cosDeltaGamma - k2 * sinDeltaGamma, x2 * cosDeltaPhi - z * sinDeltaPhi),
      asin(k2 * cosDeltaGamma + y2 * sinDeltaGamma)
    ];
  }
  rotation2.invert = function(lambda, phi2) {
    var cosPhi = cos(phi2), x2 = cos(lambda) * cosPhi, y2 = sin(lambda) * cosPhi, z = sin(phi2), k2 = z * cosDeltaGamma - y2 * sinDeltaGamma;
    return [
      atan2(y2 * cosDeltaGamma + z * sinDeltaGamma, x2 * cosDeltaPhi + k2 * sinDeltaPhi),
      asin(k2 * cosDeltaPhi - x2 * sinDeltaPhi)
    ];
  };
  return rotation2;
}
function rotation(rotate) {
  rotate = rotateRadians(rotate[0] * radians2, rotate[1] * radians2, rotate.length > 2 ? rotate[2] * radians2 : 0);
  function forward(coordinates) {
    coordinates = rotate(coordinates[0] * radians2, coordinates[1] * radians2);
    return coordinates[0] *= degrees3, coordinates[1] *= degrees3, coordinates;
  }
  forward.invert = function(coordinates) {
    coordinates = rotate.invert(coordinates[0] * radians2, coordinates[1] * radians2);
    return coordinates[0] *= degrees3, coordinates[1] *= degrees3, coordinates;
  };
  return forward;
}
function circleStream(stream, radius2, delta, direction, t03, t13) {
  if (!delta) return;
  var cosRadius = cos(radius2), sinRadius = sin(radius2), step2 = direction * delta;
  if (t03 == null) {
    t03 = radius2 + direction * tau3;
    t13 = radius2 - step2 / 2;
  } else {
    t03 = circleRadius(cosRadius, t03);
    t13 = circleRadius(cosRadius, t13);
    if (direction > 0 ? t03 < t13 : t03 > t13) t03 += direction * tau3;
  }
  for (var point3, t = t03; direction > 0 ? t > t13 : t < t13; t -= step2) {
    point3 = spherical([cosRadius, -sinRadius * cos(t), -sinRadius * sin(t)]);
    stream.point(point3[0], point3[1]);
  }
}
function circleRadius(cosRadius, point3) {
  point3 = cartesian(point3), point3[0] -= cosRadius;
  cartesianNormalizeInPlace(point3);
  var radius2 = acos(-point3[1]);
  return ((-point3[2] < 0 ? -radius2 : radius2) + tau3 - epsilon5) % tau3;
}
function clipBuffer() {
  var lines = [], line3;
  return {
    point: function(x2, y2, m) {
      line3.push([x2, y2, m]);
    },
    lineStart: function() {
      lines.push(line3 = []);
    },
    lineEnd: noop2,
    rejoin: function() {
      if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
    },
    result: function() {
      var result = lines;
      lines = [];
      line3 = null;
      return result;
    }
  };
}
function pointEqual(a2, b) {
  return abs(a2[0] - b[0]) < epsilon5 && abs(a2[1] - b[1]) < epsilon5;
}
function Intersection(point3, points, other, entry) {
  this.x = point3;
  this.z = points;
  this.o = other;
  this.e = entry;
  this.v = false;
  this.n = this.p = null;
}
function clipRejoin(segments, compareIntersection2, startInside, interpolate, stream) {
  var subject = [], clip2 = [], i, n;
  segments.forEach(function(segment) {
    if ((n2 = segment.length - 1) <= 0) return;
    var n2, p0 = segment[0], p1 = segment[n2], x2;
    if (pointEqual(p0, p1)) {
      if (!p0[2] && !p1[2]) {
        stream.lineStart();
        for (i = 0; i < n2; ++i) stream.point((p0 = segment[i])[0], p0[1]);
        stream.lineEnd();
        return;
      }
      p1[0] += 2 * epsilon5;
    }
    subject.push(x2 = new Intersection(p0, segment, null, true));
    clip2.push(x2.o = new Intersection(p0, null, x2, false));
    subject.push(x2 = new Intersection(p1, segment, null, false));
    clip2.push(x2.o = new Intersection(p1, null, x2, true));
  });
  if (!subject.length) return;
  clip2.sort(compareIntersection2);
  link(subject);
  link(clip2);
  for (i = 0, n = clip2.length; i < n; ++i) {
    clip2[i].e = startInside = !startInside;
  }
  var start = subject[0], points, point3;
  while (1) {
    var current = start, isSubject = true;
    while (current.v) if ((current = current.n) === start) return;
    points = current.z;
    stream.lineStart();
    do {
      current.v = current.o.v = true;
      if (current.e) {
        if (isSubject) {
          for (i = 0, n = points.length; i < n; ++i) stream.point((point3 = points[i])[0], point3[1]);
        } else {
          interpolate(current.x, current.n.x, 1, stream);
        }
        current = current.n;
      } else {
        if (isSubject) {
          points = current.p.z;
          for (i = points.length - 1; i >= 0; --i) stream.point((point3 = points[i])[0], point3[1]);
        } else {
          interpolate(current.x, current.p.x, -1, stream);
        }
        current = current.p;
      }
      current = current.o;
      points = current.z;
      isSubject = !isSubject;
    } while (!current.v);
    stream.lineEnd();
  }
}
function link(array5) {
  if (!(n = array5.length)) return;
  var n, i = 0, a2 = array5[0], b;
  while (++i < n) {
    a2.n = b = array5[i];
    b.p = a2;
    a2 = b;
  }
  a2.n = b = array5[0];
  b.p = a2;
}
function longitude(point3) {
  return abs(point3[0]) <= pi2 ? point3[0] : sign(point3[0]) * ((abs(point3[0]) + pi2) % tau3 - pi2);
}
function polygonContains(polygon, point3) {
  var lambda = longitude(point3), phi2 = point3[1], sinPhi = sin(phi2), normal2 = [sin(lambda), -cos(lambda), 0], angle = 0, winding = 0;
  var sum3 = new Adder();
  if (sinPhi === 1) phi2 = halfPi + epsilon5;
  else if (sinPhi === -1) phi2 = -halfPi - epsilon5;
  for (var i = 0, n = polygon.length; i < n; ++i) {
    if (!(m = (ring = polygon[i]).length)) continue;
    var ring, m, point0 = ring[m - 1], lambda0 = longitude(point0), phi0 = point0[1] / 2 + quarterPi, sinPhi0 = sin(phi0), cosPhi0 = cos(phi0);
    for (var j = 0; j < m; ++j, lambda0 = lambda1, sinPhi0 = sinPhi1, cosPhi0 = cosPhi1, point0 = point1) {
      var point1 = ring[j], lambda1 = longitude(point1), phi1 = point1[1] / 2 + quarterPi, sinPhi1 = sin(phi1), cosPhi1 = cos(phi1), delta = lambda1 - lambda0, sign3 = delta >= 0 ? 1 : -1, absDelta = sign3 * delta, antimeridian = absDelta > pi2, k2 = sinPhi0 * sinPhi1;
      sum3.add(atan2(k2 * sign3 * sin(absDelta), cosPhi0 * cosPhi1 + k2 * cos(absDelta)));
      angle += antimeridian ? delta + sign3 * tau3 : delta;
      if (antimeridian ^ lambda0 >= lambda ^ lambda1 >= lambda) {
        var arc = cartesianCross(cartesian(point0), cartesian(point1));
        cartesianNormalizeInPlace(arc);
        var intersection = cartesianCross(normal2, arc);
        cartesianNormalizeInPlace(intersection);
        var phiArc = (antimeridian ^ delta >= 0 ? -1 : 1) * asin(intersection[2]);
        if (phi2 > phiArc || phi2 === phiArc && (arc[0] || arc[1])) {
          winding += antimeridian ^ delta >= 0 ? 1 : -1;
        }
      }
    }
  }
  return (angle < -epsilon5 || angle < epsilon5 && sum3 < -epsilon22) ^ winding & 1;
}
function clip(pointVisible, clipLine2, interpolate, start) {
  return function(sink) {
    var line3 = clipLine2(sink), ringBuffer = clipBuffer(), ringSink = clipLine2(ringBuffer), polygonStarted = false, polygon, segments, ring;
    var clip2 = {
      point: point3,
      lineStart,
      lineEnd,
      polygonStart: function() {
        clip2.point = pointRing;
        clip2.lineStart = ringStart;
        clip2.lineEnd = ringEnd;
        segments = [];
        polygon = [];
      },
      polygonEnd: function() {
        clip2.point = point3;
        clip2.lineStart = lineStart;
        clip2.lineEnd = lineEnd;
        segments = merge(segments);
        var startInside = polygonContains(polygon, start);
        if (segments.length) {
          if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
          clipRejoin(segments, compareIntersection, startInside, interpolate, sink);
        } else if (startInside) {
          if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
          sink.lineStart();
          interpolate(null, null, 1, sink);
          sink.lineEnd();
        }
        if (polygonStarted) sink.polygonEnd(), polygonStarted = false;
        segments = polygon = null;
      },
      sphere: function() {
        sink.polygonStart();
        sink.lineStart();
        interpolate(null, null, 1, sink);
        sink.lineEnd();
        sink.polygonEnd();
      }
    };
    function point3(lambda, phi2) {
      if (pointVisible(lambda, phi2)) sink.point(lambda, phi2);
    }
    function pointLine(lambda, phi2) {
      line3.point(lambda, phi2);
    }
    function lineStart() {
      clip2.point = pointLine;
      line3.lineStart();
    }
    function lineEnd() {
      clip2.point = point3;
      line3.lineEnd();
    }
    function pointRing(lambda, phi2) {
      ring.push([lambda, phi2]);
      ringSink.point(lambda, phi2);
    }
    function ringStart() {
      ringSink.lineStart();
      ring = [];
    }
    function ringEnd() {
      pointRing(ring[0][0], ring[0][1]);
      ringSink.lineEnd();
      var clean = ringSink.clean(), ringSegments = ringBuffer.result(), i, n = ringSegments.length, m, segment, point4;
      ring.pop();
      polygon.push(ring);
      ring = null;
      if (!n) return;
      if (clean & 1) {
        segment = ringSegments[0];
        if ((m = segment.length - 1) > 0) {
          if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
          sink.lineStart();
          for (i = 0; i < m; ++i) sink.point((point4 = segment[i])[0], point4[1]);
          sink.lineEnd();
        }
        return;
      }
      if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));
      segments.push(ringSegments.filter(validSegment));
    }
    return clip2;
  };
}
function validSegment(segment) {
  return segment.length > 1;
}
function compareIntersection(a2, b) {
  return ((a2 = a2.x)[0] < 0 ? a2[1] - halfPi - epsilon5 : halfPi - a2[1]) - ((b = b.x)[0] < 0 ? b[1] - halfPi - epsilon5 : halfPi - b[1]);
}
var clipAntimeridian = clip(
  function() {
    return true;
  },
  clipAntimeridianLine,
  clipAntimeridianInterpolate,
  [-pi2, -halfPi]
);
function clipAntimeridianLine(stream) {
  var lambda0 = NaN, phi0 = NaN, sign0 = NaN, clean;
  return {
    lineStart: function() {
      stream.lineStart();
      clean = 1;
    },
    point: function(lambda1, phi1) {
      var sign1 = lambda1 > 0 ? pi2 : -pi2, delta = abs(lambda1 - lambda0);
      if (abs(delta - pi2) < epsilon5) {
        stream.point(lambda0, phi0 = (phi0 + phi1) / 2 > 0 ? halfPi : -halfPi);
        stream.point(sign0, phi0);
        stream.lineEnd();
        stream.lineStart();
        stream.point(sign1, phi0);
        stream.point(lambda1, phi0);
        clean = 0;
      } else if (sign0 !== sign1 && delta >= pi2) {
        if (abs(lambda0 - sign0) < epsilon5) lambda0 -= sign0 * epsilon5;
        if (abs(lambda1 - sign1) < epsilon5) lambda1 -= sign1 * epsilon5;
        phi0 = clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1);
        stream.point(sign0, phi0);
        stream.lineEnd();
        stream.lineStart();
        stream.point(sign1, phi0);
        clean = 0;
      }
      stream.point(lambda0 = lambda1, phi0 = phi1);
      sign0 = sign1;
    },
    lineEnd: function() {
      stream.lineEnd();
      lambda0 = phi0 = NaN;
    },
    clean: function() {
      return 2 - clean;
    }
  };
}
function clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1) {
  var cosPhi0, cosPhi1, sinLambda0Lambda1 = sin(lambda0 - lambda1);
  return abs(sinLambda0Lambda1) > epsilon5 ? atan((sin(phi0) * (cosPhi1 = cos(phi1)) * sin(lambda1) - sin(phi1) * (cosPhi0 = cos(phi0)) * sin(lambda0)) / (cosPhi0 * cosPhi1 * sinLambda0Lambda1)) : (phi0 + phi1) / 2;
}
function clipAntimeridianInterpolate(from, to, direction, stream) {
  var phi2;
  if (from == null) {
    phi2 = direction * halfPi;
    stream.point(-pi2, phi2);
    stream.point(0, phi2);
    stream.point(pi2, phi2);
    stream.point(pi2, 0);
    stream.point(pi2, -phi2);
    stream.point(0, -phi2);
    stream.point(-pi2, -phi2);
    stream.point(-pi2, 0);
    stream.point(-pi2, phi2);
  } else if (abs(from[0] - to[0]) > epsilon5) {
    var lambda = from[0] < to[0] ? pi2 : -pi2;
    phi2 = direction * lambda / 2;
    stream.point(-lambda, phi2);
    stream.point(0, phi2);
    stream.point(lambda, phi2);
  } else {
    stream.point(to[0], to[1]);
  }
}
function clipCircle(radius2) {
  var cr = cos(radius2), delta = 2 * radians2, smallRadius = cr > 0, notHemisphere = abs(cr) > epsilon5;
  function interpolate(from, to, direction, stream) {
    circleStream(stream, radius2, delta, direction, from, to);
  }
  function visible(lambda, phi2) {
    return cos(lambda) * cos(phi2) > cr;
  }
  function clipLine2(stream) {
    var point0, c0, v0, v00, clean;
    return {
      lineStart: function() {
        v00 = v0 = false;
        clean = 1;
      },
      point: function(lambda, phi2) {
        var point1 = [lambda, phi2], point22, v = visible(lambda, phi2), c3 = smallRadius ? v ? 0 : code(lambda, phi2) : v ? code(lambda + (lambda < 0 ? pi2 : -pi2), phi2) : 0;
        if (!point0 && (v00 = v0 = v)) stream.lineStart();
        if (v !== v0) {
          point22 = intersect(point0, point1);
          if (!point22 || pointEqual(point0, point22) || pointEqual(point1, point22))
            point1[2] = 1;
        }
        if (v !== v0) {
          clean = 0;
          if (v) {
            stream.lineStart();
            point22 = intersect(point1, point0);
            stream.point(point22[0], point22[1]);
          } else {
            point22 = intersect(point0, point1);
            stream.point(point22[0], point22[1], 2);
            stream.lineEnd();
          }
          point0 = point22;
        } else if (notHemisphere && point0 && smallRadius ^ v) {
          var t;
          if (!(c3 & c0) && (t = intersect(point1, point0, true))) {
            clean = 0;
            if (smallRadius) {
              stream.lineStart();
              stream.point(t[0][0], t[0][1]);
              stream.point(t[1][0], t[1][1]);
              stream.lineEnd();
            } else {
              stream.point(t[1][0], t[1][1]);
              stream.lineEnd();
              stream.lineStart();
              stream.point(t[0][0], t[0][1], 3);
            }
          }
        }
        if (v && (!point0 || !pointEqual(point0, point1))) {
          stream.point(point1[0], point1[1]);
        }
        point0 = point1, v0 = v, c0 = c3;
      },
      lineEnd: function() {
        if (v0) stream.lineEnd();
        point0 = null;
      },
      // Rejoin first and last segments if there were intersections and the first
      // and last points were visible.
      clean: function() {
        return clean | (v00 && v0) << 1;
      }
    };
  }
  function intersect(a2, b, two) {
    var pa = cartesian(a2), pb = cartesian(b);
    var n1 = [1, 0, 0], n2 = cartesianCross(pa, pb), n2n2 = cartesianDot(n2, n2), n1n2 = n2[0], determinant = n2n2 - n1n2 * n1n2;
    if (!determinant) return !two && a2;
    var c1 = cr * n2n2 / determinant, c22 = -cr * n1n2 / determinant, n1xn2 = cartesianCross(n1, n2), A5 = cartesianScale(n1, c1), B3 = cartesianScale(n2, c22);
    cartesianAddInPlace(A5, B3);
    var u2 = n1xn2, w = cartesianDot(A5, u2), uu = cartesianDot(u2, u2), t22 = w * w - uu * (cartesianDot(A5, A5) - 1);
    if (t22 < 0) return;
    var t = sqrt(t22), q = cartesianScale(u2, (-w - t) / uu);
    cartesianAddInPlace(q, A5);
    q = spherical(q);
    if (!two) return q;
    var lambda0 = a2[0], lambda1 = b[0], phi0 = a2[1], phi1 = b[1], z;
    if (lambda1 < lambda0) z = lambda0, lambda0 = lambda1, lambda1 = z;
    var delta2 = lambda1 - lambda0, polar = abs(delta2 - pi2) < epsilon5, meridian = polar || delta2 < epsilon5;
    if (!polar && phi1 < phi0) z = phi0, phi0 = phi1, phi1 = z;
    if (meridian ? polar ? phi0 + phi1 > 0 ^ q[1] < (abs(q[0] - lambda0) < epsilon5 ? phi0 : phi1) : phi0 <= q[1] && q[1] <= phi1 : delta2 > pi2 ^ (lambda0 <= q[0] && q[0] <= lambda1)) {
      var q1 = cartesianScale(u2, (-w + t) / uu);
      cartesianAddInPlace(q1, A5);
      return [q, spherical(q1)];
    }
  }
  function code(lambda, phi2) {
    var r = smallRadius ? radius2 : pi2 - radius2, code2 = 0;
    if (lambda < -r) code2 |= 1;
    else if (lambda > r) code2 |= 2;
    if (phi2 < -r) code2 |= 4;
    else if (phi2 > r) code2 |= 8;
    return code2;
  }
  return clip(visible, clipLine2, interpolate, smallRadius ? [0, -radius2] : [-pi2, radius2 - pi2]);
}
function clipLine(a2, b, x02, y02, x12, y12) {
  var ax = a2[0], ay = a2[1], bx = b[0], by = b[1], t03 = 0, t13 = 1, dx = bx - ax, dy = by - ay, r;
  r = x02 - ax;
  if (!dx && r > 0) return;
  r /= dx;
  if (dx < 0) {
    if (r < t03) return;
    if (r < t13) t13 = r;
  } else if (dx > 0) {
    if (r > t13) return;
    if (r > t03) t03 = r;
  }
  r = x12 - ax;
  if (!dx && r < 0) return;
  r /= dx;
  if (dx < 0) {
    if (r > t13) return;
    if (r > t03) t03 = r;
  } else if (dx > 0) {
    if (r < t03) return;
    if (r < t13) t13 = r;
  }
  r = y02 - ay;
  if (!dy && r > 0) return;
  r /= dy;
  if (dy < 0) {
    if (r < t03) return;
    if (r < t13) t13 = r;
  } else if (dy > 0) {
    if (r > t13) return;
    if (r > t03) t03 = r;
  }
  r = y12 - ay;
  if (!dy && r < 0) return;
  r /= dy;
  if (dy < 0) {
    if (r > t13) return;
    if (r > t03) t03 = r;
  } else if (dy > 0) {
    if (r < t03) return;
    if (r < t13) t13 = r;
  }
  if (t03 > 0) a2[0] = ax + t03 * dx, a2[1] = ay + t03 * dy;
  if (t13 < 1) b[0] = ax + t13 * dx, b[1] = ay + t13 * dy;
  return true;
}
var clipMax = 1e9;
var clipMin = -clipMax;
function clipRectangle(x02, y02, x12, y12) {
  function visible(x2, y2) {
    return x02 <= x2 && x2 <= x12 && y02 <= y2 && y2 <= y12;
  }
  function interpolate(from, to, direction, stream) {
    var a2 = 0, a1 = 0;
    if (from == null || (a2 = corner(from, direction)) !== (a1 = corner(to, direction)) || comparePoint(from, to) < 0 ^ direction > 0) {
      do
        stream.point(a2 === 0 || a2 === 3 ? x02 : x12, a2 > 1 ? y12 : y02);
      while ((a2 = (a2 + direction + 4) % 4) !== a1);
    } else {
      stream.point(to[0], to[1]);
    }
  }
  function corner(p, direction) {
    return abs(p[0] - x02) < epsilon5 ? direction > 0 ? 0 : 3 : abs(p[0] - x12) < epsilon5 ? direction > 0 ? 2 : 1 : abs(p[1] - y02) < epsilon5 ? direction > 0 ? 1 : 0 : direction > 0 ? 3 : 2;
  }
  function compareIntersection2(a2, b) {
    return comparePoint(a2.x, b.x);
  }
  function comparePoint(a2, b) {
    var ca = corner(a2, 1), cb = corner(b, 1);
    return ca !== cb ? ca - cb : ca === 0 ? b[1] - a2[1] : ca === 1 ? a2[0] - b[0] : ca === 2 ? a2[1] - b[1] : b[0] - a2[0];
  }
  return function(stream) {
    var activeStream = stream, bufferStream = clipBuffer(), segments, polygon, ring, x__, y__, v__, x_, y_, v_, first2, clean;
    var clipStream = {
      point: point3,
      lineStart,
      lineEnd,
      polygonStart,
      polygonEnd
    };
    function point3(x2, y2) {
      if (visible(x2, y2)) activeStream.point(x2, y2);
    }
    function polygonInside() {
      var winding = 0;
      for (var i = 0, n = polygon.length; i < n; ++i) {
        for (var ring2 = polygon[i], j = 1, m = ring2.length, point4 = ring2[0], a0, a1, b0 = point4[0], b1 = point4[1]; j < m; ++j) {
          a0 = b0, a1 = b1, point4 = ring2[j], b0 = point4[0], b1 = point4[1];
          if (a1 <= y12) {
            if (b1 > y12 && (b0 - a0) * (y12 - a1) > (b1 - a1) * (x02 - a0)) ++winding;
          } else {
            if (b1 <= y12 && (b0 - a0) * (y12 - a1) < (b1 - a1) * (x02 - a0)) --winding;
          }
        }
      }
      return winding;
    }
    function polygonStart() {
      activeStream = bufferStream, segments = [], polygon = [], clean = true;
    }
    function polygonEnd() {
      var startInside = polygonInside(), cleanInside = clean && startInside, visible2 = (segments = merge(segments)).length;
      if (cleanInside || visible2) {
        stream.polygonStart();
        if (cleanInside) {
          stream.lineStart();
          interpolate(null, null, 1, stream);
          stream.lineEnd();
        }
        if (visible2) {
          clipRejoin(segments, compareIntersection2, startInside, interpolate, stream);
        }
        stream.polygonEnd();
      }
      activeStream = stream, segments = polygon = ring = null;
    }
    function lineStart() {
      clipStream.point = linePoint;
      if (polygon) polygon.push(ring = []);
      first2 = true;
      v_ = false;
      x_ = y_ = NaN;
    }
    function lineEnd() {
      if (segments) {
        linePoint(x__, y__);
        if (v__ && v_) bufferStream.rejoin();
        segments.push(bufferStream.result());
      }
      clipStream.point = point3;
      if (v_) activeStream.lineEnd();
    }
    function linePoint(x2, y2) {
      var v = visible(x2, y2);
      if (polygon) ring.push([x2, y2]);
      if (first2) {
        x__ = x2, y__ = y2, v__ = v;
        first2 = false;
        if (v) {
          activeStream.lineStart();
          activeStream.point(x2, y2);
        }
      } else {
        if (v && v_) activeStream.point(x2, y2);
        else {
          var a2 = [x_ = Math.max(clipMin, Math.min(clipMax, x_)), y_ = Math.max(clipMin, Math.min(clipMax, y_))], b = [x2 = Math.max(clipMin, Math.min(clipMax, x2)), y2 = Math.max(clipMin, Math.min(clipMax, y2))];
          if (clipLine(a2, b, x02, y02, x12, y12)) {
            if (!v_) {
              activeStream.lineStart();
              activeStream.point(a2[0], a2[1]);
            }
            activeStream.point(b[0], b[1]);
            if (!v) activeStream.lineEnd();
            clean = false;
          } else if (v) {
            activeStream.lineStart();
            activeStream.point(x2, y2);
            clean = false;
          }
        }
      }
      x_ = x2, y_ = y2, v_ = v;
    }
    return clipStream;
  };
}
function graticuleX(y02, y12, dy) {
  var y2 = range(y02, y12 - epsilon5, dy).concat(y12);
  return function(x2) {
    return y2.map(function(y3) {
      return [x2, y3];
    });
  };
}
function graticuleY(x02, x12, dx) {
  var x2 = range(x02, x12 - epsilon5, dx).concat(x12);
  return function(y2) {
    return x2.map(function(x3) {
      return [x3, y2];
    });
  };
}
function graticule() {
  var x12, x02, X12, X02, y12, y02, Y12, Y02, dx = 10, dy = dx, DX = 90, DY = 360, x2, y2, X, Y, precision = 2.5;
  function graticule3() {
    return { type: "MultiLineString", coordinates: lines() };
  }
  function lines() {
    return range(ceil(X02 / DX) * DX, X12, DX).map(X).concat(range(ceil(Y02 / DY) * DY, Y12, DY).map(Y)).concat(range(ceil(x02 / dx) * dx, x12, dx).filter(function(x3) {
      return abs(x3 % DX) > epsilon5;
    }).map(x2)).concat(range(ceil(y02 / dy) * dy, y12, dy).filter(function(y3) {
      return abs(y3 % DY) > epsilon5;
    }).map(y2));
  }
  graticule3.lines = function() {
    return lines().map(function(coordinates) {
      return { type: "LineString", coordinates };
    });
  };
  graticule3.outline = function() {
    return {
      type: "Polygon",
      coordinates: [
        X(X02).concat(
          Y(Y12).slice(1),
          X(X12).reverse().slice(1),
          Y(Y02).reverse().slice(1)
        )
      ]
    };
  };
  graticule3.extent = function(_) {
    if (!arguments.length) return graticule3.extentMinor();
    return graticule3.extentMajor(_).extentMinor(_);
  };
  graticule3.extentMajor = function(_) {
    if (!arguments.length) return [[X02, Y02], [X12, Y12]];
    X02 = +_[0][0], X12 = +_[1][0];
    Y02 = +_[0][1], Y12 = +_[1][1];
    if (X02 > X12) _ = X02, X02 = X12, X12 = _;
    if (Y02 > Y12) _ = Y02, Y02 = Y12, Y12 = _;
    return graticule3.precision(precision);
  };
  graticule3.extentMinor = function(_) {
    if (!arguments.length) return [[x02, y02], [x12, y12]];
    x02 = +_[0][0], x12 = +_[1][0];
    y02 = +_[0][1], y12 = +_[1][1];
    if (x02 > x12) _ = x02, x02 = x12, x12 = _;
    if (y02 > y12) _ = y02, y02 = y12, y12 = _;
    return graticule3.precision(precision);
  };
  graticule3.step = function(_) {
    if (!arguments.length) return graticule3.stepMinor();
    return graticule3.stepMajor(_).stepMinor(_);
  };
  graticule3.stepMajor = function(_) {
    if (!arguments.length) return [DX, DY];
    DX = +_[0], DY = +_[1];
    return graticule3;
  };
  graticule3.stepMinor = function(_) {
    if (!arguments.length) return [dx, dy];
    dx = +_[0], dy = +_[1];
    return graticule3;
  };
  graticule3.precision = function(_) {
    if (!arguments.length) return precision;
    precision = +_;
    x2 = graticuleX(y02, y12, 90);
    y2 = graticuleY(x02, x12, precision);
    X = graticuleX(Y02, Y12, 90);
    Y = graticuleY(X02, X12, precision);
    return graticule3;
  };
  return graticule3.extentMajor([[-180, -90 + epsilon5], [180, 90 - epsilon5]]).extentMinor([[-180, -80 - epsilon5], [180, 80 + epsilon5]]);
}
function graticule10() {
  return graticule()();
}
var identity$1 = (x2) => x2;
var areaSum = new Adder();
var areaRingSum = new Adder();
var x00$2;
var y00$2;
var x0$3;
var y0$3;
var areaStream = {
  point: noop2,
  lineStart: noop2,
  lineEnd: noop2,
  polygonStart: function() {
    areaStream.lineStart = areaRingStart;
    areaStream.lineEnd = areaRingEnd;
  },
  polygonEnd: function() {
    areaStream.lineStart = areaStream.lineEnd = areaStream.point = noop2;
    areaSum.add(abs(areaRingSum));
    areaRingSum = new Adder();
  },
  result: function() {
    var area4 = areaSum / 2;
    areaSum = new Adder();
    return area4;
  }
};
function areaRingStart() {
  areaStream.point = areaPointFirst;
}
function areaPointFirst(x2, y2) {
  areaStream.point = areaPoint;
  x00$2 = x0$3 = x2, y00$2 = y0$3 = y2;
}
function areaPoint(x2, y2) {
  areaRingSum.add(y0$3 * x2 - x0$3 * y2);
  x0$3 = x2, y0$3 = y2;
}
function areaRingEnd() {
  areaPoint(x00$2, y00$2);
}
var x0$2 = Infinity;
var y0$2 = x0$2;
var x1 = -x0$2;
var y1 = x1;
var boundsStream = {
  point: boundsPoint,
  lineStart: noop2,
  lineEnd: noop2,
  polygonStart: noop2,
  polygonEnd: noop2,
  result: function() {
    var bounds = [[x0$2, y0$2], [x1, y1]];
    x1 = y1 = -(y0$2 = x0$2 = Infinity);
    return bounds;
  }
};
function boundsPoint(x2, y2) {
  if (x2 < x0$2) x0$2 = x2;
  if (x2 > x1) x1 = x2;
  if (y2 < y0$2) y0$2 = y2;
  if (y2 > y1) y1 = y2;
}
var X0 = 0;
var Y0 = 0;
var Z0 = 0;
var X1 = 0;
var Y1 = 0;
var Z1 = 0;
var X2 = 0;
var Y2 = 0;
var Z2 = 0;
var x00$1;
var y00$1;
var x0$1;
var y0$1;
var centroidStream = {
  point: centroidPoint,
  lineStart: centroidLineStart,
  lineEnd: centroidLineEnd,
  polygonStart: function() {
    centroidStream.lineStart = centroidRingStart;
    centroidStream.lineEnd = centroidRingEnd;
  },
  polygonEnd: function() {
    centroidStream.point = centroidPoint;
    centroidStream.lineStart = centroidLineStart;
    centroidStream.lineEnd = centroidLineEnd;
  },
  result: function() {
    var centroid3 = Z2 ? [X2 / Z2, Y2 / Z2] : Z1 ? [X1 / Z1, Y1 / Z1] : Z0 ? [X0 / Z0, Y0 / Z0] : [NaN, NaN];
    X0 = Y0 = Z0 = X1 = Y1 = Z1 = X2 = Y2 = Z2 = 0;
    return centroid3;
  }
};
function centroidPoint(x2, y2) {
  X0 += x2;
  Y0 += y2;
  ++Z0;
}
function centroidLineStart() {
  centroidStream.point = centroidPointFirstLine;
}
function centroidPointFirstLine(x2, y2) {
  centroidStream.point = centroidPointLine;
  centroidPoint(x0$1 = x2, y0$1 = y2);
}
function centroidPointLine(x2, y2) {
  var dx = x2 - x0$1, dy = y2 - y0$1, z = sqrt(dx * dx + dy * dy);
  X1 += z * (x0$1 + x2) / 2;
  Y1 += z * (y0$1 + y2) / 2;
  Z1 += z;
  centroidPoint(x0$1 = x2, y0$1 = y2);
}
function centroidLineEnd() {
  centroidStream.point = centroidPoint;
}
function centroidRingStart() {
  centroidStream.point = centroidPointFirstRing;
}
function centroidRingEnd() {
  centroidPointRing(x00$1, y00$1);
}
function centroidPointFirstRing(x2, y2) {
  centroidStream.point = centroidPointRing;
  centroidPoint(x00$1 = x0$1 = x2, y00$1 = y0$1 = y2);
}
function centroidPointRing(x2, y2) {
  var dx = x2 - x0$1, dy = y2 - y0$1, z = sqrt(dx * dx + dy * dy);
  X1 += z * (x0$1 + x2) / 2;
  Y1 += z * (y0$1 + y2) / 2;
  Z1 += z;
  z = y0$1 * x2 - x0$1 * y2;
  X2 += z * (x0$1 + x2);
  Y2 += z * (y0$1 + y2);
  Z2 += z * 3;
  centroidPoint(x0$1 = x2, y0$1 = y2);
}
function PathContext(context) {
  this._context = context;
}
PathContext.prototype = {
  _radius: 4.5,
  pointRadius: function(_) {
    return this._radius = _, this;
  },
  polygonStart: function() {
    this._line = 0;
  },
  polygonEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line === 0) this._context.closePath();
    this._point = NaN;
  },
  point: function(x2, y2) {
    switch (this._point) {
      case 0: {
        this._context.moveTo(x2, y2);
        this._point = 1;
        break;
      }
      case 1: {
        this._context.lineTo(x2, y2);
        break;
      }
      default: {
        this._context.moveTo(x2 + this._radius, y2);
        this._context.arc(x2, y2, this._radius, 0, tau3);
        break;
      }
    }
  },
  result: noop2
};
var lengthSum = new Adder();
var lengthRing;
var x00;
var y00;
var x0;
var y0;
var lengthStream = {
  point: noop2,
  lineStart: function() {
    lengthStream.point = lengthPointFirst;
  },
  lineEnd: function() {
    if (lengthRing) lengthPoint(x00, y00);
    lengthStream.point = noop2;
  },
  polygonStart: function() {
    lengthRing = true;
  },
  polygonEnd: function() {
    lengthRing = null;
  },
  result: function() {
    var length2 = +lengthSum;
    lengthSum = new Adder();
    return length2;
  }
};
function lengthPointFirst(x2, y2) {
  lengthStream.point = lengthPoint;
  x00 = x0 = x2, y00 = y0 = y2;
}
function lengthPoint(x2, y2) {
  x0 -= x2, y0 -= y2;
  lengthSum.add(sqrt(x0 * x0 + y0 * y0));
  x0 = x2, y0 = y2;
}
var cacheDigits;
var cacheAppend;
var cacheRadius;
var cacheCircle;
var PathString = class {
  constructor(digits) {
    this._append = digits == null ? append2 : appendRound2(digits);
    this._radius = 4.5;
    this._ = "";
  }
  pointRadius(_) {
    this._radius = +_;
    return this;
  }
  polygonStart() {
    this._line = 0;
  }
  polygonEnd() {
    this._line = NaN;
  }
  lineStart() {
    this._point = 0;
  }
  lineEnd() {
    if (this._line === 0) this._ += "Z";
    this._point = NaN;
  }
  point(x2, y2) {
    switch (this._point) {
      case 0: {
        this._append`M${x2},${y2}`;
        this._point = 1;
        break;
      }
      case 1: {
        this._append`L${x2},${y2}`;
        break;
      }
      default: {
        this._append`M${x2},${y2}`;
        if (this._radius !== cacheRadius || this._append !== cacheAppend) {
          const r = this._radius;
          const s2 = this._;
          this._ = "";
          this._append`m0,${r}a${r},${r} 0 1,1 0,${-2 * r}a${r},${r} 0 1,1 0,${2 * r}z`;
          cacheRadius = r;
          cacheAppend = this._append;
          cacheCircle = this._;
          this._ = s2;
        }
        this._ += cacheCircle;
        break;
      }
    }
  }
  result() {
    const result = this._;
    this._ = "";
    return result.length ? result : null;
  }
};
function append2(strings) {
  let i = 1;
  this._ += strings[0];
  for (const j = strings.length; i < j; ++i) {
    this._ += arguments[i] + strings[i];
  }
}
function appendRound2(digits) {
  const d = Math.floor(digits);
  if (!(d >= 0)) throw new RangeError(`invalid digits: ${digits}`);
  if (d > 15) return append2;
  if (d !== cacheDigits) {
    const k2 = 10 ** d;
    cacheDigits = d;
    cacheAppend = function append3(strings) {
      let i = 1;
      this._ += strings[0];
      for (const j = strings.length; i < j; ++i) {
        this._ += Math.round(arguments[i] * k2) / k2 + strings[i];
      }
    };
  }
  return cacheAppend;
}
function index(projection3, context) {
  let digits = 3, pointRadius = 4.5, projectionStream, contextStream;
  function path2(object2) {
    if (object2) {
      if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
      geoStream(object2, projectionStream(contextStream));
    }
    return contextStream.result();
  }
  path2.area = function(object2) {
    geoStream(object2, projectionStream(areaStream));
    return areaStream.result();
  };
  path2.measure = function(object2) {
    geoStream(object2, projectionStream(lengthStream));
    return lengthStream.result();
  };
  path2.bounds = function(object2) {
    geoStream(object2, projectionStream(boundsStream));
    return boundsStream.result();
  };
  path2.centroid = function(object2) {
    geoStream(object2, projectionStream(centroidStream));
    return centroidStream.result();
  };
  path2.projection = function(_) {
    if (!arguments.length) return projection3;
    projectionStream = _ == null ? (projection3 = null, identity$1) : (projection3 = _).stream;
    return path2;
  };
  path2.context = function(_) {
    if (!arguments.length) return context;
    contextStream = _ == null ? (context = null, new PathString(digits)) : new PathContext(context = _);
    if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
    return path2;
  };
  path2.pointRadius = function(_) {
    if (!arguments.length) return pointRadius;
    pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
    return path2;
  };
  path2.digits = function(_) {
    if (!arguments.length) return digits;
    if (_ == null) digits = null;
    else {
      const d = Math.floor(_);
      if (!(d >= 0)) throw new RangeError(`invalid digits: ${_}`);
      digits = d;
    }
    if (context === null) contextStream = new PathString(digits);
    return path2;
  };
  return path2.projection(projection3).digits(digits).context(context);
}
function transform(methods) {
  return {
    stream: transformer(methods)
  };
}
function transformer(methods) {
  return function(stream) {
    var s2 = new TransformStream();
    for (var key in methods) s2[key] = methods[key];
    s2.stream = stream;
    return s2;
  };
}
function TransformStream() {
}
TransformStream.prototype = {
  constructor: TransformStream,
  point: function(x2, y2) {
    this.stream.point(x2, y2);
  },
  sphere: function() {
    this.stream.sphere();
  },
  lineStart: function() {
    this.stream.lineStart();
  },
  lineEnd: function() {
    this.stream.lineEnd();
  },
  polygonStart: function() {
    this.stream.polygonStart();
  },
  polygonEnd: function() {
    this.stream.polygonEnd();
  }
};
function fit(projection3, fitBounds, object2) {
  var clip2 = projection3.clipExtent && projection3.clipExtent();
  projection3.scale(150).translate([0, 0]);
  if (clip2 != null) projection3.clipExtent(null);
  geoStream(object2, projection3.stream(boundsStream));
  fitBounds(boundsStream.result());
  if (clip2 != null) projection3.clipExtent(clip2);
  return projection3;
}
function fitExtent(projection3, extent3, object2) {
  return fit(projection3, function(b) {
    var w = extent3[1][0] - extent3[0][0], h = extent3[1][1] - extent3[0][1], k2 = Math.min(w / (b[1][0] - b[0][0]), h / (b[1][1] - b[0][1])), x2 = +extent3[0][0] + (w - k2 * (b[1][0] + b[0][0])) / 2, y2 = +extent3[0][1] + (h - k2 * (b[1][1] + b[0][1])) / 2;
    projection3.scale(150 * k2).translate([x2, y2]);
  }, object2);
}
function fitSize(projection3, size, object2) {
  return fitExtent(projection3, [[0, 0], size], object2);
}
function fitWidth(projection3, width, object2) {
  return fit(projection3, function(b) {
    var w = +width, k2 = w / (b[1][0] - b[0][0]), x2 = (w - k2 * (b[1][0] + b[0][0])) / 2, y2 = -k2 * b[0][1];
    projection3.scale(150 * k2).translate([x2, y2]);
  }, object2);
}
function fitHeight(projection3, height, object2) {
  return fit(projection3, function(b) {
    var h = +height, k2 = h / (b[1][1] - b[0][1]), x2 = -k2 * b[0][0], y2 = (h - k2 * (b[1][1] + b[0][1])) / 2;
    projection3.scale(150 * k2).translate([x2, y2]);
  }, object2);
}
var maxDepth = 16;
var cosMinDistance = cos(30 * radians2);
function resample(project2, delta2) {
  return +delta2 ? resample$1(project2, delta2) : resampleNone(project2);
}
function resampleNone(project2) {
  return transformer({
    point: function(x2, y2) {
      x2 = project2(x2, y2);
      this.stream.point(x2[0], x2[1]);
    }
  });
}
function resample$1(project2, delta2) {
  function resampleLineTo(x02, y02, lambda0, a0, b0, c0, x12, y12, lambda1, a1, b1, c1, depth, stream) {
    var dx = x12 - x02, dy = y12 - y02, d2 = dx * dx + dy * dy;
    if (d2 > 4 * delta2 && depth--) {
      var a2 = a0 + a1, b = b0 + b1, c3 = c0 + c1, m = sqrt(a2 * a2 + b * b + c3 * c3), phi2 = asin(c3 /= m), lambda2 = abs(abs(c3) - 1) < epsilon5 || abs(lambda0 - lambda1) < epsilon5 ? (lambda0 + lambda1) / 2 : atan2(b, a2), p = project2(lambda2, phi2), x2 = p[0], y2 = p[1], dx2 = x2 - x02, dy2 = y2 - y02, dz = dy * dx2 - dx * dy2;
      if (dz * dz / d2 > delta2 || abs((dx * dx2 + dy * dy2) / d2 - 0.5) > 0.3 || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) {
        resampleLineTo(x02, y02, lambda0, a0, b0, c0, x2, y2, lambda2, a2 /= m, b /= m, c3, depth, stream);
        stream.point(x2, y2);
        resampleLineTo(x2, y2, lambda2, a2, b, c3, x12, y12, lambda1, a1, b1, c1, depth, stream);
      }
    }
  }
  return function(stream) {
    var lambda002, x002, y002, a00, b00, c00, lambda0, x02, y02, a0, b0, c0;
    var resampleStream = {
      point: point3,
      lineStart,
      lineEnd,
      polygonStart: function() {
        stream.polygonStart();
        resampleStream.lineStart = ringStart;
      },
      polygonEnd: function() {
        stream.polygonEnd();
        resampleStream.lineStart = lineStart;
      }
    };
    function point3(x2, y2) {
      x2 = project2(x2, y2);
      stream.point(x2[0], x2[1]);
    }
    function lineStart() {
      x02 = NaN;
      resampleStream.point = linePoint;
      stream.lineStart();
    }
    function linePoint(lambda, phi2) {
      var c3 = cartesian([lambda, phi2]), p = project2(lambda, phi2);
      resampleLineTo(x02, y02, lambda0, a0, b0, c0, x02 = p[0], y02 = p[1], lambda0 = lambda, a0 = c3[0], b0 = c3[1], c0 = c3[2], maxDepth, stream);
      stream.point(x02, y02);
    }
    function lineEnd() {
      resampleStream.point = point3;
      stream.lineEnd();
    }
    function ringStart() {
      lineStart();
      resampleStream.point = ringPoint;
      resampleStream.lineEnd = ringEnd;
    }
    function ringPoint(lambda, phi2) {
      linePoint(lambda002 = lambda, phi2), x002 = x02, y002 = y02, a00 = a0, b00 = b0, c00 = c0;
      resampleStream.point = linePoint;
    }
    function ringEnd() {
      resampleLineTo(x02, y02, lambda0, a0, b0, c0, x002, y002, lambda002, a00, b00, c00, maxDepth, stream);
      resampleStream.lineEnd = lineEnd;
      lineEnd();
    }
    return resampleStream;
  };
}
var transformRadians = transformer({
  point: function(x2, y2) {
    this.stream.point(x2 * radians2, y2 * radians2);
  }
});
function transformRotate(rotate) {
  return transformer({
    point: function(x2, y2) {
      var r = rotate(x2, y2);
      return this.stream.point(r[0], r[1]);
    }
  });
}
function scaleTranslate(k2, dx, dy, sx, sy) {
  function transform2(x2, y2) {
    x2 *= sx;
    y2 *= sy;
    return [dx + k2 * x2, dy - k2 * y2];
  }
  transform2.invert = function(x2, y2) {
    return [(x2 - dx) / k2 * sx, (dy - y2) / k2 * sy];
  };
  return transform2;
}
function scaleTranslateRotate(k2, dx, dy, sx, sy, alpha) {
  if (!alpha) return scaleTranslate(k2, dx, dy, sx, sy);
  var cosAlpha = cos(alpha), sinAlpha = sin(alpha), a2 = cosAlpha * k2, b = sinAlpha * k2, ai = cosAlpha / k2, bi = sinAlpha / k2, ci = (sinAlpha * dy - cosAlpha * dx) / k2, fi = (sinAlpha * dx + cosAlpha * dy) / k2;
  function transform2(x2, y2) {
    x2 *= sx;
    y2 *= sy;
    return [a2 * x2 - b * y2 + dx, dy - b * x2 - a2 * y2];
  }
  transform2.invert = function(x2, y2) {
    return [sx * (ai * x2 - bi * y2 + ci), sy * (fi - bi * x2 - ai * y2)];
  };
  return transform2;
}
function projection(project2) {
  return projectionMutator(function() {
    return project2;
  })();
}
function projectionMutator(projectAt) {
  var project2, k2 = 150, x2 = 480, y2 = 250, lambda = 0, phi2 = 0, deltaLambda = 0, deltaPhi = 0, deltaGamma = 0, rotate, alpha = 0, sx = 1, sy = 1, theta = null, preclip = clipAntimeridian, x02 = null, y02, x12, y12, postclip = identity$1, delta2 = 0.5, projectResample, projectTransform, projectRotateTransform, cache, cacheStream;
  function projection3(point3) {
    return projectRotateTransform(point3[0] * radians2, point3[1] * radians2);
  }
  function invert(point3) {
    point3 = projectRotateTransform.invert(point3[0], point3[1]);
    return point3 && [point3[0] * degrees3, point3[1] * degrees3];
  }
  projection3.stream = function(stream) {
    return cache && cacheStream === stream ? cache : cache = transformRadians(transformRotate(rotate)(preclip(projectResample(postclip(cacheStream = stream)))));
  };
  projection3.preclip = function(_) {
    return arguments.length ? (preclip = _, theta = void 0, reset()) : preclip;
  };
  projection3.postclip = function(_) {
    return arguments.length ? (postclip = _, x02 = y02 = x12 = y12 = null, reset()) : postclip;
  };
  projection3.clipAngle = function(_) {
    return arguments.length ? (preclip = +_ ? clipCircle(theta = _ * radians2) : (theta = null, clipAntimeridian), reset()) : theta * degrees3;
  };
  projection3.clipExtent = function(_) {
    return arguments.length ? (postclip = _ == null ? (x02 = y02 = x12 = y12 = null, identity$1) : clipRectangle(x02 = +_[0][0], y02 = +_[0][1], x12 = +_[1][0], y12 = +_[1][1]), reset()) : x02 == null ? null : [[x02, y02], [x12, y12]];
  };
  projection3.scale = function(_) {
    return arguments.length ? (k2 = +_, recenter()) : k2;
  };
  projection3.translate = function(_) {
    return arguments.length ? (x2 = +_[0], y2 = +_[1], recenter()) : [x2, y2];
  };
  projection3.center = function(_) {
    return arguments.length ? (lambda = _[0] % 360 * radians2, phi2 = _[1] % 360 * radians2, recenter()) : [lambda * degrees3, phi2 * degrees3];
  };
  projection3.rotate = function(_) {
    return arguments.length ? (deltaLambda = _[0] % 360 * radians2, deltaPhi = _[1] % 360 * radians2, deltaGamma = _.length > 2 ? _[2] % 360 * radians2 : 0, recenter()) : [deltaLambda * degrees3, deltaPhi * degrees3, deltaGamma * degrees3];
  };
  projection3.angle = function(_) {
    return arguments.length ? (alpha = _ % 360 * radians2, recenter()) : alpha * degrees3;
  };
  projection3.reflectX = function(_) {
    return arguments.length ? (sx = _ ? -1 : 1, recenter()) : sx < 0;
  };
  projection3.reflectY = function(_) {
    return arguments.length ? (sy = _ ? -1 : 1, recenter()) : sy < 0;
  };
  projection3.precision = function(_) {
    return arguments.length ? (projectResample = resample(projectTransform, delta2 = _ * _), reset()) : sqrt(delta2);
  };
  projection3.fitExtent = function(extent3, object2) {
    return fitExtent(projection3, extent3, object2);
  };
  projection3.fitSize = function(size, object2) {
    return fitSize(projection3, size, object2);
  };
  projection3.fitWidth = function(width, object2) {
    return fitWidth(projection3, width, object2);
  };
  projection3.fitHeight = function(height, object2) {
    return fitHeight(projection3, height, object2);
  };
  function recenter() {
    var center2 = scaleTranslateRotate(k2, 0, 0, sx, sy, alpha).apply(null, project2(lambda, phi2)), transform2 = scaleTranslateRotate(k2, x2 - center2[0], y2 - center2[1], sx, sy, alpha);
    rotate = rotateRadians(deltaLambda, deltaPhi, deltaGamma);
    projectTransform = compose(project2, transform2);
    projectRotateTransform = compose(rotate, projectTransform);
    projectResample = resample(projectTransform, delta2);
    return reset();
  }
  function reset() {
    cache = cacheStream = null;
    return projection3;
  }
  return function() {
    project2 = projectAt.apply(this, arguments);
    projection3.invert = project2.invert && invert;
    return recenter();
  };
}
function conicProjection(projectAt) {
  var phi0 = 0, phi1 = pi2 / 3, m = projectionMutator(projectAt), p = m(phi0, phi1);
  p.parallels = function(_) {
    return arguments.length ? m(phi0 = _[0] * radians2, phi1 = _[1] * radians2) : [phi0 * degrees3, phi1 * degrees3];
  };
  return p;
}
function cylindricalEqualAreaRaw(phi0) {
  var cosPhi0 = cos(phi0);
  function forward(lambda, phi2) {
    return [lambda * cosPhi0, sin(phi2) / cosPhi0];
  }
  forward.invert = function(x2, y2) {
    return [x2 / cosPhi0, asin(y2 * cosPhi0)];
  };
  return forward;
}
function conicEqualAreaRaw(y02, y12) {
  var sy0 = sin(y02), n = (sy0 + sin(y12)) / 2;
  if (abs(n) < epsilon5) return cylindricalEqualAreaRaw(y02);
  var c3 = 1 + sy0 * (2 * n - sy0), r0 = sqrt(c3) / n;
  function project2(x2, y2) {
    var r = sqrt(c3 - 2 * n * sin(y2)) / n;
    return [r * sin(x2 *= n), r0 - r * cos(x2)];
  }
  project2.invert = function(x2, y2) {
    var r0y = r0 - y2, l = atan2(x2, abs(r0y)) * sign(r0y);
    if (r0y * n < 0)
      l -= pi2 * sign(x2) * sign(r0y);
    return [l / n, asin((c3 - (x2 * x2 + r0y * r0y) * n * n) / (2 * n))];
  };
  return project2;
}
function conicEqualArea() {
  return conicProjection(conicEqualAreaRaw).scale(155.424).center([0, 33.6442]);
}
function albers() {
  return conicEqualArea().parallels([29.5, 45.5]).scale(1070).translate([480, 250]).rotate([96, 0]).center([-0.6, 38.7]);
}
function multiplex(streams) {
  var n = streams.length;
  return {
    point: function(x2, y2) {
      var i = -1;
      while (++i < n) streams[i].point(x2, y2);
    },
    sphere: function() {
      var i = -1;
      while (++i < n) streams[i].sphere();
    },
    lineStart: function() {
      var i = -1;
      while (++i < n) streams[i].lineStart();
    },
    lineEnd: function() {
      var i = -1;
      while (++i < n) streams[i].lineEnd();
    },
    polygonStart: function() {
      var i = -1;
      while (++i < n) streams[i].polygonStart();
    },
    polygonEnd: function() {
      var i = -1;
      while (++i < n) streams[i].polygonEnd();
    }
  };
}
function albersUsa() {
  var cache, cacheStream, lower48 = albers(), lower48Point, alaska = conicEqualArea().rotate([154, 0]).center([-2, 58.5]).parallels([55, 65]), alaskaPoint, hawaii = conicEqualArea().rotate([157, 0]).center([-3, 19.9]).parallels([8, 18]), hawaiiPoint, point3, pointStream = { point: function(x2, y2) {
    point3 = [x2, y2];
  } };
  function albersUsa2(coordinates) {
    var x2 = coordinates[0], y2 = coordinates[1];
    return point3 = null, (lower48Point.point(x2, y2), point3) || (alaskaPoint.point(x2, y2), point3) || (hawaiiPoint.point(x2, y2), point3);
  }
  albersUsa2.invert = function(coordinates) {
    var k2 = lower48.scale(), t = lower48.translate(), x2 = (coordinates[0] - t[0]) / k2, y2 = (coordinates[1] - t[1]) / k2;
    return (y2 >= 0.12 && y2 < 0.234 && x2 >= -0.425 && x2 < -0.214 ? alaska : y2 >= 0.166 && y2 < 0.234 && x2 >= -0.214 && x2 < -0.115 ? hawaii : lower48).invert(coordinates);
  };
  albersUsa2.stream = function(stream) {
    return cache && cacheStream === stream ? cache : cache = multiplex([lower48.stream(cacheStream = stream), alaska.stream(stream), hawaii.stream(stream)]);
  };
  albersUsa2.precision = function(_) {
    if (!arguments.length) return lower48.precision();
    lower48.precision(_), alaska.precision(_), hawaii.precision(_);
    return reset();
  };
  albersUsa2.scale = function(_) {
    if (!arguments.length) return lower48.scale();
    lower48.scale(_), alaska.scale(_ * 0.35), hawaii.scale(_);
    return albersUsa2.translate(lower48.translate());
  };
  albersUsa2.translate = function(_) {
    if (!arguments.length) return lower48.translate();
    var k2 = lower48.scale(), x2 = +_[0], y2 = +_[1];
    lower48Point = lower48.translate(_).clipExtent([[x2 - 0.455 * k2, y2 - 0.238 * k2], [x2 + 0.455 * k2, y2 + 0.238 * k2]]).stream(pointStream);
    alaskaPoint = alaska.translate([x2 - 0.307 * k2, y2 + 0.201 * k2]).clipExtent([[x2 - 0.425 * k2 + epsilon5, y2 + 0.12 * k2 + epsilon5], [x2 - 0.214 * k2 - epsilon5, y2 + 0.234 * k2 - epsilon5]]).stream(pointStream);
    hawaiiPoint = hawaii.translate([x2 - 0.205 * k2, y2 + 0.212 * k2]).clipExtent([[x2 - 0.214 * k2 + epsilon5, y2 + 0.166 * k2 + epsilon5], [x2 - 0.115 * k2 - epsilon5, y2 + 0.234 * k2 - epsilon5]]).stream(pointStream);
    return reset();
  };
  albersUsa2.fitExtent = function(extent3, object2) {
    return fitExtent(albersUsa2, extent3, object2);
  };
  albersUsa2.fitSize = function(size, object2) {
    return fitSize(albersUsa2, size, object2);
  };
  albersUsa2.fitWidth = function(width, object2) {
    return fitWidth(albersUsa2, width, object2);
  };
  albersUsa2.fitHeight = function(height, object2) {
    return fitHeight(albersUsa2, height, object2);
  };
  function reset() {
    cache = cacheStream = null;
    return albersUsa2;
  }
  return albersUsa2.scale(1070);
}
function azimuthalRaw(scale2) {
  return function(x2, y2) {
    var cx = cos(x2), cy = cos(y2), k2 = scale2(cx * cy);
    if (k2 === Infinity) return [2, 0];
    return [
      k2 * cy * sin(x2),
      k2 * sin(y2)
    ];
  };
}
function azimuthalInvert(angle) {
  return function(x2, y2) {
    var z = sqrt(x2 * x2 + y2 * y2), c3 = angle(z), sc = sin(c3), cc = cos(c3);
    return [
      atan2(x2 * sc, z * cc),
      asin(z && y2 * sc / z)
    ];
  };
}
var azimuthalEqualAreaRaw = azimuthalRaw(function(cxcy) {
  return sqrt(2 / (1 + cxcy));
});
azimuthalEqualAreaRaw.invert = azimuthalInvert(function(z) {
  return 2 * asin(z / 2);
});
function azimuthalEqualArea() {
  return projection(azimuthalEqualAreaRaw).scale(124.75).clipAngle(180 - 1e-3);
}
var azimuthalEquidistantRaw = azimuthalRaw(function(c3) {
  return (c3 = acos(c3)) && c3 / sin(c3);
});
azimuthalEquidistantRaw.invert = azimuthalInvert(function(z) {
  return z;
});
function azimuthalEquidistant() {
  return projection(azimuthalEquidistantRaw).scale(79.4188).clipAngle(180 - 1e-3);
}
function mercatorRaw(lambda, phi2) {
  return [lambda, log(tan((halfPi + phi2) / 2))];
}
mercatorRaw.invert = function(x2, y2) {
  return [x2, 2 * atan(exp(y2)) - halfPi];
};
function mercator() {
  return mercatorProjection(mercatorRaw).scale(961 / tau3);
}
function mercatorProjection(project2) {
  var m = projection(project2), center2 = m.center, scale2 = m.scale, translate2 = m.translate, clipExtent = m.clipExtent, x02 = null, y02, x12, y12;
  m.scale = function(_) {
    return arguments.length ? (scale2(_), reclip()) : scale2();
  };
  m.translate = function(_) {
    return arguments.length ? (translate2(_), reclip()) : translate2();
  };
  m.center = function(_) {
    return arguments.length ? (center2(_), reclip()) : center2();
  };
  m.clipExtent = function(_) {
    return arguments.length ? (_ == null ? x02 = y02 = x12 = y12 = null : (x02 = +_[0][0], y02 = +_[0][1], x12 = +_[1][0], y12 = +_[1][1]), reclip()) : x02 == null ? null : [[x02, y02], [x12, y12]];
  };
  function reclip() {
    var k2 = pi2 * scale2(), t = m(rotation(m.rotate()).invert([0, 0]));
    return clipExtent(x02 == null ? [[t[0] - k2, t[1] - k2], [t[0] + k2, t[1] + k2]] : project2 === mercatorRaw ? [[Math.max(t[0] - k2, x02), y02], [Math.min(t[0] + k2, x12), y12]] : [[x02, Math.max(t[1] - k2, y02)], [x12, Math.min(t[1] + k2, y12)]]);
  }
  return reclip();
}
function tany(y2) {
  return tan((halfPi + y2) / 2);
}
function conicConformalRaw(y02, y12) {
  var cy0 = cos(y02), n = y02 === y12 ? sin(y02) : log(cy0 / cos(y12)) / log(tany(y12) / tany(y02)), f = cy0 * pow2(tany(y02), n) / n;
  if (!n) return mercatorRaw;
  function project2(x2, y2) {
    if (f > 0) {
      if (y2 < -halfPi + epsilon5) y2 = -halfPi + epsilon5;
    } else {
      if (y2 > halfPi - epsilon5) y2 = halfPi - epsilon5;
    }
    var r = f / pow2(tany(y2), n);
    return [r * sin(n * x2), f - r * cos(n * x2)];
  }
  project2.invert = function(x2, y2) {
    var fy = f - y2, r = sign(n) * sqrt(x2 * x2 + fy * fy), l = atan2(x2, abs(fy)) * sign(fy);
    if (fy * n < 0)
      l -= pi2 * sign(x2) * sign(fy);
    return [l / n, 2 * atan(pow2(f / r, 1 / n)) - halfPi];
  };
  return project2;
}
function conicConformal() {
  return conicProjection(conicConformalRaw).scale(109.5).parallels([30, 30]);
}
function equirectangularRaw(lambda, phi2) {
  return [lambda, phi2];
}
equirectangularRaw.invert = equirectangularRaw;
function equirectangular() {
  return projection(equirectangularRaw).scale(152.63);
}
function conicEquidistantRaw(y02, y12) {
  var cy0 = cos(y02), n = y02 === y12 ? sin(y02) : (cy0 - cos(y12)) / (y12 - y02), g = cy0 / n + y02;
  if (abs(n) < epsilon5) return equirectangularRaw;
  function project2(x2, y2) {
    var gy = g - y2, nx = n * x2;
    return [gy * sin(nx), g - gy * cos(nx)];
  }
  project2.invert = function(x2, y2) {
    var gy = g - y2, l = atan2(x2, abs(gy)) * sign(gy);
    if (gy * n < 0)
      l -= pi2 * sign(x2) * sign(gy);
    return [l / n, g - sign(n) * sqrt(x2 * x2 + gy * gy)];
  };
  return project2;
}
function conicEquidistant() {
  return conicProjection(conicEquidistantRaw).scale(131.154).center([0, 13.9389]);
}
var A1 = 1.340264;
var A2 = -0.081106;
var A3 = 893e-6;
var A4 = 3796e-6;
var M = sqrt(3) / 2;
var iterations = 12;
function equalEarthRaw(lambda, phi2) {
  var l = asin(M * sin(phi2)), l2 = l * l, l6 = l2 * l2 * l2;
  return [
    lambda * cos(l) / (M * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2))),
    l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2))
  ];
}
equalEarthRaw.invert = function(x2, y2) {
  var l = y2, l2 = l * l, l6 = l2 * l2 * l2;
  for (var i = 0, delta, fy, fpy; i < iterations; ++i) {
    fy = l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2)) - y2;
    fpy = A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2);
    l -= delta = fy / fpy, l2 = l * l, l6 = l2 * l2 * l2;
    if (abs(delta) < epsilon22) break;
  }
  return [
    M * x2 * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2)) / cos(l),
    asin(sin(l) / M)
  ];
};
function equalEarth() {
  return projection(equalEarthRaw).scale(177.158);
}
function gnomonicRaw(x2, y2) {
  var cy = cos(y2), k2 = cos(x2) * cy;
  return [cy * sin(x2) / k2, sin(y2) / k2];
}
gnomonicRaw.invert = azimuthalInvert(atan);
function gnomonic() {
  return projection(gnomonicRaw).scale(144.049).clipAngle(60);
}
function naturalEarth1Raw(lambda, phi2) {
  var phi22 = phi2 * phi2, phi4 = phi22 * phi22;
  return [
    lambda * (0.8707 - 0.131979 * phi22 + phi4 * (-0.013791 + phi4 * (3971e-6 * phi22 - 1529e-6 * phi4))),
    phi2 * (1.007226 + phi22 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi22 - 5916e-6 * phi4)))
  ];
}
naturalEarth1Raw.invert = function(x2, y2) {
  var phi2 = y2, i = 25, delta;
  do {
    var phi22 = phi2 * phi2, phi4 = phi22 * phi22;
    phi2 -= delta = (phi2 * (1.007226 + phi22 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi22 - 5916e-6 * phi4))) - y2) / (1.007226 + phi22 * (0.015085 * 3 + phi4 * (-0.044475 * 7 + 0.028874 * 9 * phi22 - 5916e-6 * 11 * phi4)));
  } while (abs(delta) > epsilon5 && --i > 0);
  return [
    x2 / (0.8707 + (phi22 = phi2 * phi2) * (-0.131979 + phi22 * (-0.013791 + phi22 * phi22 * phi22 * (3971e-6 - 1529e-6 * phi22)))),
    phi2
  ];
};
function orthographicRaw(x2, y2) {
  return [cos(y2) * sin(x2), sin(y2)];
}
orthographicRaw.invert = azimuthalInvert(asin);
function orthographic() {
  return projection(orthographicRaw).scale(249.5).clipAngle(90 + epsilon5);
}
function stereographicRaw(x2, y2) {
  var cy = cos(y2), k2 = 1 + cos(x2) * cy;
  return [cy * sin(x2) / k2, sin(y2) / k2];
}
stereographicRaw.invert = azimuthalInvert(function(z) {
  return 2 * atan(z);
});
function stereographic() {
  return projection(stereographicRaw).scale(250).clipAngle(142);
}
function transverseMercatorRaw(lambda, phi2) {
  return [log(tan((halfPi + phi2) / 2)), -lambda];
}
transverseMercatorRaw.invert = function(x2, y2) {
  return [-y2, 2 * atan(exp(x2)) - halfPi];
};
function transverseMercator() {
  var m = mercatorProjection(transverseMercatorRaw), center2 = m.center, rotate = m.rotate;
  m.center = function(_) {
    return arguments.length ? center2([-_[1], _[0]]) : (_ = center2(), [_[1], -_[0]]);
  };
  m.rotate = function(_) {
    return arguments.length ? rotate([_[0], _[1], _.length > 2 ? _[2] + 90 : 90]) : (_ = rotate(), [_[0], _[1], _[2] - 90]);
  };
  return rotate([0, 0, 90]).scale(159.155);
}

// node_modules/d3-hierarchy/dist/d3-hierarchy.mjs
function defaultSeparation$1(a2, b) {
  return a2.parent === b.parent ? 1 : 2;
}
function meanX(children2) {
  return children2.reduce(meanXReduce, 0) / children2.length;
}
function meanXReduce(x2, c3) {
  return x2 + c3.x;
}
function maxY(children2) {
  return 1 + children2.reduce(maxYReduce, 0);
}
function maxYReduce(y2, c3) {
  return Math.max(y2, c3.y);
}
function leafLeft(node) {
  var children2;
  while (children2 = node.children) node = children2[0];
  return node;
}
function leafRight(node) {
  var children2;
  while (children2 = node.children) node = children2[children2.length - 1];
  return node;
}
function cluster() {
  var separation = defaultSeparation$1, dx = 1, dy = 1, nodeSize = false;
  function cluster3(root2) {
    var previousNode, x2 = 0;
    root2.eachAfter(function(node) {
      var children2 = node.children;
      if (children2) {
        node.x = meanX(children2);
        node.y = maxY(children2);
      } else {
        node.x = previousNode ? x2 += separation(node, previousNode) : 0;
        node.y = 0;
        previousNode = node;
      }
    });
    var left2 = leafLeft(root2), right2 = leafRight(root2), x02 = left2.x - separation(left2, right2) / 2, x12 = right2.x + separation(right2, left2) / 2;
    return root2.eachAfter(nodeSize ? function(node) {
      node.x = (node.x - root2.x) * dx;
      node.y = (root2.y - node.y) * dy;
    } : function(node) {
      node.x = (node.x - x02) / (x12 - x02) * dx;
      node.y = (1 - (root2.y ? node.y / root2.y : 1)) * dy;
    });
  }
  cluster3.separation = function(x2) {
    return arguments.length ? (separation = x2, cluster3) : separation;
  };
  cluster3.size = function(x2) {
    return arguments.length ? (nodeSize = false, dx = +x2[0], dy = +x2[1], cluster3) : nodeSize ? null : [dx, dy];
  };
  cluster3.nodeSize = function(x2) {
    return arguments.length ? (nodeSize = true, dx = +x2[0], dy = +x2[1], cluster3) : nodeSize ? [dx, dy] : null;
  };
  return cluster3;
}
function count2(node) {
  var sum3 = 0, children2 = node.children, i = children2 && children2.length;
  if (!i) sum3 = 1;
  else while (--i >= 0) sum3 += children2[i].value;
  node.value = sum3;
}
function node_count() {
  return this.eachAfter(count2);
}
function node_each(callback, that) {
  let index2 = -1;
  for (const node of this) {
    callback.call(that, node, ++index2, this);
  }
  return this;
}
function node_eachBefore(callback, that) {
  var node = this, nodes = [node], children2, i, index2 = -1;
  while (node = nodes.pop()) {
    callback.call(that, node, ++index2, this);
    if (children2 = node.children) {
      for (i = children2.length - 1; i >= 0; --i) {
        nodes.push(children2[i]);
      }
    }
  }
  return this;
}
function node_eachAfter(callback, that) {
  var node = this, nodes = [node], next = [], children2, i, n, index2 = -1;
  while (node = nodes.pop()) {
    next.push(node);
    if (children2 = node.children) {
      for (i = 0, n = children2.length; i < n; ++i) {
        nodes.push(children2[i]);
      }
    }
  }
  while (node = next.pop()) {
    callback.call(that, node, ++index2, this);
  }
  return this;
}
function node_find(callback, that) {
  let index2 = -1;
  for (const node of this) {
    if (callback.call(that, node, ++index2, this)) {
      return node;
    }
  }
}
function node_sum(value2) {
  return this.eachAfter(function(node) {
    var sum3 = +value2(node.data) || 0, children2 = node.children, i = children2 && children2.length;
    while (--i >= 0) sum3 += children2[i].value;
    node.value = sum3;
  });
}
function node_sort(compare) {
  return this.eachBefore(function(node) {
    if (node.children) {
      node.children.sort(compare);
    }
  });
}
function node_path(end) {
  var start = this, ancestor = leastCommonAncestor(start, end), nodes = [start];
  while (start !== ancestor) {
    start = start.parent;
    nodes.push(start);
  }
  var k2 = nodes.length;
  while (end !== ancestor) {
    nodes.splice(k2, 0, end);
    end = end.parent;
  }
  return nodes;
}
function leastCommonAncestor(a2, b) {
  if (a2 === b) return a2;
  var aNodes = a2.ancestors(), bNodes = b.ancestors(), c3 = null;
  a2 = aNodes.pop();
  b = bNodes.pop();
  while (a2 === b) {
    c3 = a2;
    a2 = aNodes.pop();
    b = bNodes.pop();
  }
  return c3;
}
function node_ancestors() {
  var node = this, nodes = [node];
  while (node = node.parent) {
    nodes.push(node);
  }
  return nodes;
}
function node_descendants() {
  return Array.from(this);
}
function node_leaves() {
  var leaves = [];
  this.eachBefore(function(node) {
    if (!node.children) {
      leaves.push(node);
    }
  });
  return leaves;
}
function node_links() {
  var root2 = this, links = [];
  root2.each(function(node) {
    if (node !== root2) {
      links.push({ source: node.parent, target: node });
    }
  });
  return links;
}
function* node_iterator() {
  var node = this, current, next = [node], children2, i, n;
  do {
    current = next.reverse(), next = [];
    while (node = current.pop()) {
      yield node;
      if (children2 = node.children) {
        for (i = 0, n = children2.length; i < n; ++i) {
          next.push(children2[i]);
        }
      }
    }
  } while (next.length);
}
function hierarchy(data, children2) {
  if (data instanceof Map) {
    data = [void 0, data];
    if (children2 === void 0) children2 = mapChildren;
  } else if (children2 === void 0) {
    children2 = objectChildren;
  }
  var root2 = new Node$1(data), node, nodes = [root2], child, childs, i, n;
  while (node = nodes.pop()) {
    if ((childs = children2(node.data)) && (n = (childs = Array.from(childs)).length)) {
      node.children = childs;
      for (i = n - 1; i >= 0; --i) {
        nodes.push(child = childs[i] = new Node$1(childs[i]));
        child.parent = node;
        child.depth = node.depth + 1;
      }
    }
  }
  return root2.eachBefore(computeHeight);
}
function node_copy() {
  return hierarchy(this).eachBefore(copyData);
}
function objectChildren(d) {
  return d.children;
}
function mapChildren(d) {
  return Array.isArray(d) ? d[1] : null;
}
function copyData(node) {
  if (node.data.value !== void 0) node.value = node.data.value;
  node.data = node.data.data;
}
function computeHeight(node) {
  var height = 0;
  do
    node.height = height;
  while ((node = node.parent) && node.height < ++height);
}
function Node$1(data) {
  this.data = data;
  this.depth = this.height = 0;
  this.parent = null;
}
Node$1.prototype = hierarchy.prototype = {
  constructor: Node$1,
  count: node_count,
  each: node_each,
  eachAfter: node_eachAfter,
  eachBefore: node_eachBefore,
  find: node_find,
  sum: node_sum,
  sort: node_sort,
  path: node_path,
  ancestors: node_ancestors,
  descendants: node_descendants,
  leaves: node_leaves,
  links: node_links,
  copy: node_copy,
  [Symbol.iterator]: node_iterator
};
function optional(f) {
  return f == null ? null : required(f);
}
function required(f) {
  if (typeof f !== "function") throw new Error();
  return f;
}
function treemapDice(parent, x02, y02, x12, y12) {
  var nodes = parent.children, node, i = -1, n = nodes.length, k2 = parent.value && (x12 - x02) / parent.value;
  while (++i < n) {
    node = nodes[i], node.y0 = y02, node.y1 = y12;
    node.x0 = x02, node.x1 = x02 += node.value * k2;
  }
}
var preroot = { depth: -1 };
var ambiguous = {};
var imputed = {};
function defaultId(d) {
  return d.id;
}
function defaultParentId(d) {
  return d.parentId;
}
function stratify() {
  var id = defaultId, parentId = defaultParentId, path2;
  function stratify2(data) {
    var nodes = Array.from(data), currentId = id, currentParentId = parentId, n, d, i, root2, parent, node, nodeId, nodeKey, nodeByKey = /* @__PURE__ */ new Map();
    if (path2 != null) {
      const I = nodes.map((d2, i2) => normalize(path2(d2, i2, data)));
      const P = I.map(parentof);
      const S = new Set(I).add("");
      for (const i2 of P) {
        if (!S.has(i2)) {
          S.add(i2);
          I.push(i2);
          P.push(parentof(i2));
          nodes.push(imputed);
        }
      }
      currentId = (_, i2) => I[i2];
      currentParentId = (_, i2) => P[i2];
    }
    for (i = 0, n = nodes.length; i < n; ++i) {
      d = nodes[i], node = nodes[i] = new Node$1(d);
      if ((nodeId = currentId(d, i, data)) != null && (nodeId += "")) {
        nodeKey = node.id = nodeId;
        nodeByKey.set(nodeKey, nodeByKey.has(nodeKey) ? ambiguous : node);
      }
      if ((nodeId = currentParentId(d, i, data)) != null && (nodeId += "")) {
        node.parent = nodeId;
      }
    }
    for (i = 0; i < n; ++i) {
      node = nodes[i];
      if (nodeId = node.parent) {
        parent = nodeByKey.get(nodeId);
        if (!parent) throw new Error("missing: " + nodeId);
        if (parent === ambiguous) throw new Error("ambiguous: " + nodeId);
        if (parent.children) parent.children.push(node);
        else parent.children = [node];
        node.parent = parent;
      } else {
        if (root2) throw new Error("multiple roots");
        root2 = node;
      }
    }
    if (!root2) throw new Error("no root");
    if (path2 != null) {
      while (root2.data === imputed && root2.children.length === 1) {
        root2 = root2.children[0], --n;
      }
      for (let i2 = nodes.length - 1; i2 >= 0; --i2) {
        node = nodes[i2];
        if (node.data !== imputed) break;
        node.data = null;
      }
    }
    root2.parent = preroot;
    root2.eachBefore(function(node2) {
      node2.depth = node2.parent.depth + 1;
      --n;
    }).eachBefore(computeHeight);
    root2.parent = null;
    if (n > 0) throw new Error("cycle");
    return root2;
  }
  stratify2.id = function(x2) {
    return arguments.length ? (id = optional(x2), stratify2) : id;
  };
  stratify2.parentId = function(x2) {
    return arguments.length ? (parentId = optional(x2), stratify2) : parentId;
  };
  stratify2.path = function(x2) {
    return arguments.length ? (path2 = optional(x2), stratify2) : path2;
  };
  return stratify2;
}
function normalize(path2) {
  path2 = `${path2}`;
  let i = path2.length;
  if (slash(path2, i - 1) && !slash(path2, i - 2)) path2 = path2.slice(0, -1);
  return path2[0] === "/" ? path2 : `/${path2}`;
}
function parentof(path2) {
  let i = path2.length;
  if (i < 2) return "";
  while (--i > 1) if (slash(path2, i)) break;
  return path2.slice(0, i);
}
function slash(path2, i) {
  if (path2[i] === "/") {
    let k2 = 0;
    while (i > 0 && path2[--i] === "\\") ++k2;
    if ((k2 & 1) === 0) return true;
  }
  return false;
}
function defaultSeparation(a2, b) {
  return a2.parent === b.parent ? 1 : 2;
}
function nextLeft(v) {
  var children2 = v.children;
  return children2 ? children2[0] : v.t;
}
function nextRight(v) {
  var children2 = v.children;
  return children2 ? children2[children2.length - 1] : v.t;
}
function moveSubtree(wm, wp, shift) {
  var change = shift / (wp.i - wm.i);
  wp.c -= change;
  wp.s += shift;
  wm.c += change;
  wp.z += shift;
  wp.m += shift;
}
function executeShifts(v) {
  var shift = 0, change = 0, children2 = v.children, i = children2.length, w;
  while (--i >= 0) {
    w = children2[i];
    w.z += shift;
    w.m += shift;
    shift += w.s + (change += w.c);
  }
}
function nextAncestor(vim, v, ancestor) {
  return vim.a.parent === v.parent ? vim.a : ancestor;
}
function TreeNode(node, i) {
  this._ = node;
  this.parent = null;
  this.children = null;
  this.A = null;
  this.a = this;
  this.z = 0;
  this.m = 0;
  this.c = 0;
  this.s = 0;
  this.t = null;
  this.i = i;
}
TreeNode.prototype = Object.create(Node$1.prototype);
function treeRoot(root2) {
  var tree3 = new TreeNode(root2, 0), node, nodes = [tree3], child, children2, i, n;
  while (node = nodes.pop()) {
    if (children2 = node._.children) {
      node.children = new Array(n = children2.length);
      for (i = n - 1; i >= 0; --i) {
        nodes.push(child = node.children[i] = new TreeNode(children2[i], i));
        child.parent = node;
      }
    }
  }
  (tree3.parent = new TreeNode(null, 0)).children = [tree3];
  return tree3;
}
function tree() {
  var separation = defaultSeparation, dx = 1, dy = 1, nodeSize = null;
  function tree3(root2) {
    var t = treeRoot(root2);
    t.eachAfter(firstWalk), t.parent.m = -t.z;
    t.eachBefore(secondWalk);
    if (nodeSize) root2.eachBefore(sizeNode);
    else {
      var left2 = root2, right2 = root2, bottom2 = root2;
      root2.eachBefore(function(node) {
        if (node.x < left2.x) left2 = node;
        if (node.x > right2.x) right2 = node;
        if (node.depth > bottom2.depth) bottom2 = node;
      });
      var s2 = left2 === right2 ? 1 : separation(left2, right2) / 2, tx = s2 - left2.x, kx2 = dx / (right2.x + s2 + tx), ky2 = dy / (bottom2.depth || 1);
      root2.eachBefore(function(node) {
        node.x = (node.x + tx) * kx2;
        node.y = node.depth * ky2;
      });
    }
    return root2;
  }
  function firstWalk(v) {
    var children2 = v.children, siblings = v.parent.children, w = v.i ? siblings[v.i - 1] : null;
    if (children2) {
      executeShifts(v);
      var midpoint = (children2[0].z + children2[children2.length - 1].z) / 2;
      if (w) {
        v.z = w.z + separation(v._, w._);
        v.m = v.z - midpoint;
      } else {
        v.z = midpoint;
      }
    } else if (w) {
      v.z = w.z + separation(v._, w._);
    }
    v.parent.A = apportion(v, w, v.parent.A || siblings[0]);
  }
  function secondWalk(v) {
    v._.x = v.z + v.parent.m;
    v.m += v.parent.m;
  }
  function apportion(v, w, ancestor) {
    if (w) {
      var vip = v, vop = v, vim = w, vom = vip.parent.children[0], sip = vip.m, sop = vop.m, sim = vim.m, som = vom.m, shift;
      while (vim = nextRight(vim), vip = nextLeft(vip), vim && vip) {
        vom = nextLeft(vom);
        vop = nextRight(vop);
        vop.a = v;
        shift = vim.z + sim - vip.z - sip + separation(vim._, vip._);
        if (shift > 0) {
          moveSubtree(nextAncestor(vim, v, ancestor), v, shift);
          sip += shift;
          sop += shift;
        }
        sim += vim.m;
        sip += vip.m;
        som += vom.m;
        sop += vop.m;
      }
      if (vim && !nextRight(vop)) {
        vop.t = vim;
        vop.m += sim - sop;
      }
      if (vip && !nextLeft(vom)) {
        vom.t = vip;
        vom.m += sip - som;
        ancestor = v;
      }
    }
    return ancestor;
  }
  function sizeNode(node) {
    node.x *= dx;
    node.y = node.depth * dy;
  }
  tree3.separation = function(x2) {
    return arguments.length ? (separation = x2, tree3) : separation;
  };
  tree3.size = function(x2) {
    return arguments.length ? (nodeSize = false, dx = +x2[0], dy = +x2[1], tree3) : nodeSize ? null : [dx, dy];
  };
  tree3.nodeSize = function(x2) {
    return arguments.length ? (nodeSize = true, dx = +x2[0], dy = +x2[1], tree3) : nodeSize ? [dx, dy] : null;
  };
  return tree3;
}
function treemapSlice(parent, x02, y02, x12, y12) {
  var nodes = parent.children, node, i = -1, n = nodes.length, k2 = parent.value && (y12 - y02) / parent.value;
  while (++i < n) {
    node = nodes[i], node.x0 = x02, node.x1 = x12;
    node.y0 = y02, node.y1 = y02 += node.value * k2;
  }
}
var phi = (1 + Math.sqrt(5)) / 2;
function squarifyRatio(ratio, parent, x02, y02, x12, y12) {
  var rows = [], nodes = parent.children, row, nodeValue, i0 = 0, i1 = 0, n = nodes.length, dx, dy, value2 = parent.value, sumValue, minValue, maxValue, newRatio, minRatio, alpha, beta2;
  while (i0 < n) {
    dx = x12 - x02, dy = y12 - y02;
    do
      sumValue = nodes[i1++].value;
    while (!sumValue && i1 < n);
    minValue = maxValue = sumValue;
    alpha = Math.max(dy / dx, dx / dy) / (value2 * ratio);
    beta2 = sumValue * sumValue * alpha;
    minRatio = Math.max(maxValue / beta2, beta2 / minValue);
    for (; i1 < n; ++i1) {
      sumValue += nodeValue = nodes[i1].value;
      if (nodeValue < minValue) minValue = nodeValue;
      if (nodeValue > maxValue) maxValue = nodeValue;
      beta2 = sumValue * sumValue * alpha;
      newRatio = Math.max(maxValue / beta2, beta2 / minValue);
      if (newRatio > minRatio) {
        sumValue -= nodeValue;
        break;
      }
      minRatio = newRatio;
    }
    rows.push(row = { value: sumValue, dice: dx < dy, children: nodes.slice(i0, i1) });
    if (row.dice) treemapDice(row, x02, y02, x12, value2 ? y02 += dy * sumValue / value2 : y12);
    else treemapSlice(row, x02, y02, value2 ? x02 += dx * sumValue / value2 : x12, y12);
    value2 -= sumValue, i0 = i1;
  }
  return rows;
}
var squarify = (function custom(ratio) {
  function squarify2(parent, x02, y02, x12, y12) {
    squarifyRatio(ratio, parent, x02, y02, x12, y12);
  }
  squarify2.ratio = function(x2) {
    return custom((x2 = +x2) > 1 ? x2 : 1);
  };
  return squarify2;
})(phi);
var resquarify = (function custom2(ratio) {
  function resquarify2(parent, x02, y02, x12, y12) {
    if ((rows = parent._squarify) && rows.ratio === ratio) {
      var rows, row, nodes, i, j = -1, n, m = rows.length, value2 = parent.value;
      while (++j < m) {
        row = rows[j], nodes = row.children;
        for (i = row.value = 0, n = nodes.length; i < n; ++i) row.value += nodes[i].value;
        if (row.dice) treemapDice(row, x02, y02, x12, value2 ? y02 += (y12 - y02) * row.value / value2 : y12);
        else treemapSlice(row, x02, y02, value2 ? x02 += (x12 - x02) * row.value / value2 : x12, y12);
        value2 -= row.value;
      }
    } else {
      parent._squarify = rows = squarifyRatio(ratio, parent, x02, y02, x12, y12);
      rows.ratio = ratio;
    }
  }
  resquarify2.ratio = function(x2) {
    return custom2((x2 = +x2) > 1 ? x2 : 1);
  };
  return resquarify2;
})(phi);

// node_modules/d3-random/dist/d3-random.mjs
var defaultSource = Math.random;
var uniform = (function sourceRandomUniform(source) {
  function randomUniform(min3, max2) {
    min3 = min3 == null ? 0 : +min3;
    max2 = max2 == null ? 1 : +max2;
    if (arguments.length === 1) max2 = min3, min3 = 0;
    else max2 -= min3;
    return function() {
      return source() * max2 + min3;
    };
  }
  randomUniform.source = sourceRandomUniform;
  return randomUniform;
})(defaultSource);
var int = (function sourceRandomInt(source) {
  function randomInt(min3, max2) {
    if (arguments.length < 2) max2 = min3, min3 = 0;
    min3 = Math.floor(min3);
    max2 = Math.floor(max2) - min3;
    return function() {
      return Math.floor(source() * max2 + min3);
    };
  }
  randomInt.source = sourceRandomInt;
  return randomInt;
})(defaultSource);
var normal = (function sourceRandomNormal(source) {
  function randomNormal(mu, sigma) {
    var x2, r;
    mu = mu == null ? 0 : +mu;
    sigma = sigma == null ? 1 : +sigma;
    return function() {
      var y2;
      if (x2 != null) y2 = x2, x2 = null;
      else do {
        x2 = source() * 2 - 1;
        y2 = source() * 2 - 1;
        r = x2 * x2 + y2 * y2;
      } while (!r || r > 1);
      return mu + sigma * y2 * Math.sqrt(-2 * Math.log(r) / r);
    };
  }
  randomNormal.source = sourceRandomNormal;
  return randomNormal;
})(defaultSource);
var logNormal = (function sourceRandomLogNormal(source) {
  var N = normal.source(source);
  function randomLogNormal() {
    var randomNormal = N.apply(this, arguments);
    return function() {
      return Math.exp(randomNormal());
    };
  }
  randomLogNormal.source = sourceRandomLogNormal;
  return randomLogNormal;
})(defaultSource);
var irwinHall = (function sourceRandomIrwinHall(source) {
  function randomIrwinHall(n) {
    if ((n = +n) <= 0) return () => 0;
    return function() {
      for (var sum3 = 0, i = n; i > 1; --i) sum3 += source();
      return sum3 + i * source();
    };
  }
  randomIrwinHall.source = sourceRandomIrwinHall;
  return randomIrwinHall;
})(defaultSource);
var bates = (function sourceRandomBates(source) {
  var I = irwinHall.source(source);
  function randomBates(n) {
    if ((n = +n) === 0) return source;
    var randomIrwinHall = I(n);
    return function() {
      return randomIrwinHall() / n;
    };
  }
  randomBates.source = sourceRandomBates;
  return randomBates;
})(defaultSource);
var exponential2 = (function sourceRandomExponential(source) {
  function randomExponential(lambda) {
    return function() {
      return -Math.log1p(-source()) / lambda;
    };
  }
  randomExponential.source = sourceRandomExponential;
  return randomExponential;
})(defaultSource);
var pareto = (function sourceRandomPareto(source) {
  function randomPareto(alpha) {
    if ((alpha = +alpha) < 0) throw new RangeError("invalid alpha");
    alpha = 1 / -alpha;
    return function() {
      return Math.pow(1 - source(), alpha);
    };
  }
  randomPareto.source = sourceRandomPareto;
  return randomPareto;
})(defaultSource);
var bernoulli = (function sourceRandomBernoulli(source) {
  function randomBernoulli(p) {
    if ((p = +p) < 0 || p > 1) throw new RangeError("invalid p");
    return function() {
      return Math.floor(source() + p);
    };
  }
  randomBernoulli.source = sourceRandomBernoulli;
  return randomBernoulli;
})(defaultSource);
var geometric = (function sourceRandomGeometric(source) {
  function randomGeometric(p) {
    if ((p = +p) < 0 || p > 1) throw new RangeError("invalid p");
    if (p === 0) return () => Infinity;
    if (p === 1) return () => 1;
    p = Math.log1p(-p);
    return function() {
      return 1 + Math.floor(Math.log1p(-source()) / p);
    };
  }
  randomGeometric.source = sourceRandomGeometric;
  return randomGeometric;
})(defaultSource);
var gamma2 = (function sourceRandomGamma(source) {
  var randomNormal = normal.source(source)();
  function randomGamma(k2, theta) {
    if ((k2 = +k2) < 0) throw new RangeError("invalid k");
    if (k2 === 0) return () => 0;
    theta = theta == null ? 1 : +theta;
    if (k2 === 1) return () => -Math.log1p(-source()) * theta;
    var d = (k2 < 1 ? k2 + 1 : k2) - 1 / 3, c3 = 1 / (3 * Math.sqrt(d)), multiplier = k2 < 1 ? () => Math.pow(source(), 1 / k2) : () => 1;
    return function() {
      do {
        do {
          var x2 = randomNormal(), v = 1 + c3 * x2;
        } while (v <= 0);
        v *= v * v;
        var u2 = 1 - source();
      } while (u2 >= 1 - 0.0331 * x2 * x2 * x2 * x2 && Math.log(u2) >= 0.5 * x2 * x2 + d * (1 - v + Math.log(v)));
      return d * v * multiplier() * theta;
    };
  }
  randomGamma.source = sourceRandomGamma;
  return randomGamma;
})(defaultSource);
var beta = (function sourceRandomBeta(source) {
  var G = gamma2.source(source);
  function randomBeta(alpha, beta2) {
    var X = G(alpha), Y = G(beta2);
    return function() {
      var x2 = X();
      return x2 === 0 ? 0 : x2 / (x2 + Y());
    };
  }
  randomBeta.source = sourceRandomBeta;
  return randomBeta;
})(defaultSource);
var binomial = (function sourceRandomBinomial(source) {
  var G = geometric.source(source), B3 = beta.source(source);
  function randomBinomial(n, p) {
    n = +n;
    if ((p = +p) >= 1) return () => n;
    if (p <= 0) return () => 0;
    return function() {
      var acc = 0, nn = n, pp = p;
      while (nn * pp > 16 && nn * (1 - pp) > 16) {
        var i = Math.floor((nn + 1) * pp), y2 = B3(i, nn - i + 1)();
        if (y2 <= pp) {
          acc += i;
          nn -= i;
          pp = (pp - y2) / (1 - y2);
        } else {
          nn = i - 1;
          pp /= y2;
        }
      }
      var sign3 = pp < 0.5, pFinal = sign3 ? pp : 1 - pp, g = G(pFinal);
      for (var s2 = g(), k2 = 0; s2 <= nn; ++k2) s2 += g();
      return acc + (sign3 ? k2 : nn - k2);
    };
  }
  randomBinomial.source = sourceRandomBinomial;
  return randomBinomial;
})(defaultSource);
var weibull = (function sourceRandomWeibull(source) {
  function randomWeibull(k2, a2, b) {
    var outerFunc;
    if ((k2 = +k2) === 0) {
      outerFunc = (x2) => -Math.log(x2);
    } else {
      k2 = 1 / k2;
      outerFunc = (x2) => Math.pow(x2, k2);
    }
    a2 = a2 == null ? 0 : +a2;
    b = b == null ? 1 : +b;
    return function() {
      return a2 + b * outerFunc(-Math.log1p(-source()));
    };
  }
  randomWeibull.source = sourceRandomWeibull;
  return randomWeibull;
})(defaultSource);
var cauchy = (function sourceRandomCauchy(source) {
  function randomCauchy(a2, b) {
    a2 = a2 == null ? 0 : +a2;
    b = b == null ? 1 : +b;
    return function() {
      return a2 + b * Math.tan(Math.PI * source());
    };
  }
  randomCauchy.source = sourceRandomCauchy;
  return randomCauchy;
})(defaultSource);
var logistic = (function sourceRandomLogistic(source) {
  function randomLogistic(a2, b) {
    a2 = a2 == null ? 0 : +a2;
    b = b == null ? 1 : +b;
    return function() {
      var u2 = source();
      return a2 + b * Math.log(u2 / (1 - u2));
    };
  }
  randomLogistic.source = sourceRandomLogistic;
  return randomLogistic;
})(defaultSource);
var poisson = (function sourceRandomPoisson(source) {
  var G = gamma2.source(source), B3 = binomial.source(source);
  function randomPoisson(lambda) {
    return function() {
      var acc = 0, l = lambda;
      while (l > 16) {
        var n = Math.floor(0.875 * l), t = G(n)();
        if (t > l) return acc + B3(n - 1, l / t)();
        acc += n;
        l -= t;
      }
      for (var s2 = -Math.log1p(-source()), k2 = 0; s2 <= l; ++k2) s2 -= Math.log1p(-source());
      return acc + k2;
    };
  }
  randomPoisson.source = sourceRandomPoisson;
  return randomPoisson;
})(defaultSource);
var mul = 1664525;
var inc = 1013904223;
var eps = 1 / 4294967296;
function lcg(seed = Math.random()) {
  let state = (0 <= seed && seed < 1 ? seed / eps : Math.abs(seed)) | 0;
  return () => (state = mul * state + inc | 0, eps * (state >>> 0));
}

// node_modules/d3-time/dist/d3-time.mjs
var t02 = /* @__PURE__ */ new Date();
var t12 = /* @__PURE__ */ new Date();
function timeInterval(floori, offseti, count3, field2) {
  function interval(date3) {
    return floori(date3 = arguments.length === 0 ? /* @__PURE__ */ new Date() : /* @__PURE__ */ new Date(+date3)), date3;
  }
  interval.floor = (date3) => {
    return floori(date3 = /* @__PURE__ */ new Date(+date3)), date3;
  };
  interval.ceil = (date3) => {
    return floori(date3 = new Date(date3 - 1)), offseti(date3, 1), floori(date3), date3;
  };
  interval.round = (date3) => {
    const d0 = interval(date3), d1 = interval.ceil(date3);
    return date3 - d0 < d1 - date3 ? d0 : d1;
  };
  interval.offset = (date3, step2) => {
    return offseti(date3 = /* @__PURE__ */ new Date(+date3), step2 == null ? 1 : Math.floor(step2)), date3;
  };
  interval.range = (start, stop, step2) => {
    const range3 = [];
    start = interval.ceil(start);
    step2 = step2 == null ? 1 : Math.floor(step2);
    if (!(start < stop) || !(step2 > 0)) return range3;
    let previous;
    do
      range3.push(previous = /* @__PURE__ */ new Date(+start)), offseti(start, step2), floori(start);
    while (previous < start && start < stop);
    return range3;
  };
  interval.filter = (test) => {
    return timeInterval((date3) => {
      if (date3 >= date3) while (floori(date3), !test(date3)) date3.setTime(date3 - 1);
    }, (date3, step2) => {
      if (date3 >= date3) {
        if (step2 < 0) while (++step2 <= 0) {
          while (offseti(date3, -1), !test(date3)) {
          }
        }
        else while (--step2 >= 0) {
          while (offseti(date3, 1), !test(date3)) {
          }
        }
      }
    });
  };
  if (count3) {
    interval.count = (start, end) => {
      t02.setTime(+start), t12.setTime(+end);
      floori(t02), floori(t12);
      return Math.floor(count3(t02, t12));
    };
    interval.every = (step2) => {
      step2 = Math.floor(step2);
      return !isFinite(step2) || !(step2 > 0) ? null : !(step2 > 1) ? interval : interval.filter(field2 ? (d) => field2(d) % step2 === 0 : (d) => interval.count(0, d) % step2 === 0);
    };
  }
  return interval;
}
var millisecond = timeInterval(() => {
}, (date3, step2) => {
  date3.setTime(+date3 + step2);
}, (start, end) => {
  return end - start;
});
millisecond.every = (k2) => {
  k2 = Math.floor(k2);
  if (!isFinite(k2) || !(k2 > 0)) return null;
  if (!(k2 > 1)) return millisecond;
  return timeInterval((date3) => {
    date3.setTime(Math.floor(date3 / k2) * k2);
  }, (date3, step2) => {
    date3.setTime(+date3 + step2 * k2);
  }, (start, end) => {
    return (end - start) / k2;
  });
};
var milliseconds = millisecond.range;
var durationSecond = 1e3;
var durationMinute = durationSecond * 60;
var durationHour = durationMinute * 60;
var durationDay = durationHour * 24;
var durationWeek = durationDay * 7;
var durationMonth = durationDay * 30;
var durationYear = durationDay * 365;
var second = timeInterval((date3) => {
  date3.setTime(date3 - date3.getMilliseconds());
}, (date3, step2) => {
  date3.setTime(+date3 + step2 * durationSecond);
}, (start, end) => {
  return (end - start) / durationSecond;
}, (date3) => {
  return date3.getUTCSeconds();
});
var seconds = second.range;
var timeMinute = timeInterval((date3) => {
  date3.setTime(date3 - date3.getMilliseconds() - date3.getSeconds() * durationSecond);
}, (date3, step2) => {
  date3.setTime(+date3 + step2 * durationMinute);
}, (start, end) => {
  return (end - start) / durationMinute;
}, (date3) => {
  return date3.getMinutes();
});
var timeMinutes = timeMinute.range;
var utcMinute = timeInterval((date3) => {
  date3.setUTCSeconds(0, 0);
}, (date3, step2) => {
  date3.setTime(+date3 + step2 * durationMinute);
}, (start, end) => {
  return (end - start) / durationMinute;
}, (date3) => {
  return date3.getUTCMinutes();
});
var utcMinutes = utcMinute.range;
var timeHour = timeInterval((date3) => {
  date3.setTime(date3 - date3.getMilliseconds() - date3.getSeconds() * durationSecond - date3.getMinutes() * durationMinute);
}, (date3, step2) => {
  date3.setTime(+date3 + step2 * durationHour);
}, (start, end) => {
  return (end - start) / durationHour;
}, (date3) => {
  return date3.getHours();
});
var timeHours = timeHour.range;
var utcHour = timeInterval((date3) => {
  date3.setUTCMinutes(0, 0, 0);
}, (date3, step2) => {
  date3.setTime(+date3 + step2 * durationHour);
}, (start, end) => {
  return (end - start) / durationHour;
}, (date3) => {
  return date3.getUTCHours();
});
var utcHours = utcHour.range;
var timeDay = timeInterval(
  (date3) => date3.setHours(0, 0, 0, 0),
  (date3, step2) => date3.setDate(date3.getDate() + step2),
  (start, end) => (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay,
  (date3) => date3.getDate() - 1
);
var timeDays = timeDay.range;
var utcDay = timeInterval((date3) => {
  date3.setUTCHours(0, 0, 0, 0);
}, (date3, step2) => {
  date3.setUTCDate(date3.getUTCDate() + step2);
}, (start, end) => {
  return (end - start) / durationDay;
}, (date3) => {
  return date3.getUTCDate() - 1;
});
var utcDays = utcDay.range;
var unixDay = timeInterval((date3) => {
  date3.setUTCHours(0, 0, 0, 0);
}, (date3, step2) => {
  date3.setUTCDate(date3.getUTCDate() + step2);
}, (start, end) => {
  return (end - start) / durationDay;
}, (date3) => {
  return Math.floor(date3 / durationDay);
});
var unixDays = unixDay.range;
function timeWeekday(i) {
  return timeInterval((date3) => {
    date3.setDate(date3.getDate() - (date3.getDay() + 7 - i) % 7);
    date3.setHours(0, 0, 0, 0);
  }, (date3, step2) => {
    date3.setDate(date3.getDate() + step2 * 7);
  }, (start, end) => {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
  });
}
var timeSunday = timeWeekday(0);
var timeMonday = timeWeekday(1);
var timeTuesday = timeWeekday(2);
var timeWednesday = timeWeekday(3);
var timeThursday = timeWeekday(4);
var timeFriday = timeWeekday(5);
var timeSaturday = timeWeekday(6);
var timeSundays = timeSunday.range;
var timeMondays = timeMonday.range;
var timeTuesdays = timeTuesday.range;
var timeWednesdays = timeWednesday.range;
var timeThursdays = timeThursday.range;
var timeFridays = timeFriday.range;
var timeSaturdays = timeSaturday.range;
function utcWeekday(i) {
  return timeInterval((date3) => {
    date3.setUTCDate(date3.getUTCDate() - (date3.getUTCDay() + 7 - i) % 7);
    date3.setUTCHours(0, 0, 0, 0);
  }, (date3, step2) => {
    date3.setUTCDate(date3.getUTCDate() + step2 * 7);
  }, (start, end) => {
    return (end - start) / durationWeek;
  });
}
var utcSunday = utcWeekday(0);
var utcMonday = utcWeekday(1);
var utcTuesday = utcWeekday(2);
var utcWednesday = utcWeekday(3);
var utcThursday = utcWeekday(4);
var utcFriday = utcWeekday(5);
var utcSaturday = utcWeekday(6);
var utcSundays = utcSunday.range;
var utcMondays = utcMonday.range;
var utcTuesdays = utcTuesday.range;
var utcWednesdays = utcWednesday.range;
var utcThursdays = utcThursday.range;
var utcFridays = utcFriday.range;
var utcSaturdays = utcSaturday.range;
var timeMonth = timeInterval((date3) => {
  date3.setDate(1);
  date3.setHours(0, 0, 0, 0);
}, (date3, step2) => {
  date3.setMonth(date3.getMonth() + step2);
}, (start, end) => {
  return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
}, (date3) => {
  return date3.getMonth();
});
var timeMonths = timeMonth.range;
var utcMonth = timeInterval((date3) => {
  date3.setUTCDate(1);
  date3.setUTCHours(0, 0, 0, 0);
}, (date3, step2) => {
  date3.setUTCMonth(date3.getUTCMonth() + step2);
}, (start, end) => {
  return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
}, (date3) => {
  return date3.getUTCMonth();
});
var utcMonths = utcMonth.range;
var timeYear = timeInterval((date3) => {
  date3.setMonth(0, 1);
  date3.setHours(0, 0, 0, 0);
}, (date3, step2) => {
  date3.setFullYear(date3.getFullYear() + step2);
}, (start, end) => {
  return end.getFullYear() - start.getFullYear();
}, (date3) => {
  return date3.getFullYear();
});
timeYear.every = (k2) => {
  return !isFinite(k2 = Math.floor(k2)) || !(k2 > 0) ? null : timeInterval((date3) => {
    date3.setFullYear(Math.floor(date3.getFullYear() / k2) * k2);
    date3.setMonth(0, 1);
    date3.setHours(0, 0, 0, 0);
  }, (date3, step2) => {
    date3.setFullYear(date3.getFullYear() + step2 * k2);
  });
};
var timeYears = timeYear.range;
var utcYear = timeInterval((date3) => {
  date3.setUTCMonth(0, 1);
  date3.setUTCHours(0, 0, 0, 0);
}, (date3, step2) => {
  date3.setUTCFullYear(date3.getUTCFullYear() + step2);
}, (start, end) => {
  return end.getUTCFullYear() - start.getUTCFullYear();
}, (date3) => {
  return date3.getUTCFullYear();
});
utcYear.every = (k2) => {
  return !isFinite(k2 = Math.floor(k2)) || !(k2 > 0) ? null : timeInterval((date3) => {
    date3.setUTCFullYear(Math.floor(date3.getUTCFullYear() / k2) * k2);
    date3.setUTCMonth(0, 1);
    date3.setUTCHours(0, 0, 0, 0);
  }, (date3, step2) => {
    date3.setUTCFullYear(date3.getUTCFullYear() + step2 * k2);
  });
};
var utcYears = utcYear.range;
function ticker(year, month, week, day, hour, minute) {
  const tickIntervals2 = [
    [second, 1, durationSecond],
    [second, 5, 5 * durationSecond],
    [second, 15, 15 * durationSecond],
    [second, 30, 30 * durationSecond],
    [minute, 1, durationMinute],
    [minute, 5, 5 * durationMinute],
    [minute, 15, 15 * durationMinute],
    [minute, 30, 30 * durationMinute],
    [hour, 1, durationHour],
    [hour, 3, 3 * durationHour],
    [hour, 6, 6 * durationHour],
    [hour, 12, 12 * durationHour],
    [day, 1, durationDay],
    [day, 2, 2 * durationDay],
    [week, 1, durationWeek],
    [month, 1, durationMonth],
    [month, 3, 3 * durationMonth],
    [year, 1, durationYear]
  ];
  function ticks2(start, stop, count3) {
    const reverse3 = stop < start;
    if (reverse3) [start, stop] = [stop, start];
    const interval = count3 && typeof count3.range === "function" ? count3 : tickInterval(start, stop, count3);
    const ticks3 = interval ? interval.range(start, +stop + 1) : [];
    return reverse3 ? ticks3.reverse() : ticks3;
  }
  function tickInterval(start, stop, count3) {
    const target = Math.abs(stop - start) / count3;
    const i = bisector(([, , step3]) => step3).right(tickIntervals2, target);
    if (i === tickIntervals2.length) return year.every(tickStep(start / durationYear, stop / durationYear, count3));
    if (i === 0) return millisecond.every(Math.max(tickStep(start, stop, count3), 1));
    const [t, step2] = tickIntervals2[target / tickIntervals2[i - 1][2] < tickIntervals2[i][2] / target ? i - 1 : i];
    return t.every(step2);
  }
  return [ticks2, tickInterval];
}
var [utcTicks, utcTickInterval] = ticker(utcYear, utcMonth, utcSunday, unixDay, utcHour, utcMinute);
var [timeTicks, timeTickInterval] = ticker(timeYear, timeMonth, timeSunday, timeDay, timeHour, timeMinute);

// node_modules/d3-time-format/dist/d3-time-format.mjs
function localDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date3 = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
    date3.setFullYear(d.y);
    return date3;
  }
  return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
}
function utcDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date3 = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
    date3.setUTCFullYear(d.y);
    return date3;
  }
  return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
}
function newDate(y2, m, d) {
  return { y: y2, m, d, H: 0, M: 0, S: 0, L: 0 };
}
function formatLocale2(locale3) {
  var locale_dateTime = locale3.dateTime, locale_date = locale3.date, locale_time = locale3.time, locale_periods = locale3.periods, locale_weekdays = locale3.days, locale_shortWeekdays = locale3.shortDays, locale_months = locale3.months, locale_shortMonths = locale3.shortMonths;
  var periodRe = formatRe(locale_periods), periodLookup = formatLookup(locale_periods), weekdayRe = formatRe(locale_weekdays), weekdayLookup = formatLookup(locale_weekdays), shortWeekdayRe = formatRe(locale_shortWeekdays), shortWeekdayLookup = formatLookup(locale_shortWeekdays), monthRe = formatRe(locale_months), monthLookup = formatLookup(locale_months), shortMonthRe = formatRe(locale_shortMonths), shortMonthLookup = formatLookup(locale_shortMonths);
  var formats = {
    "a": formatShortWeekday,
    "A": formatWeekday2,
    "b": formatShortMonth,
    "B": formatMonth2,
    "c": null,
    "d": formatDayOfMonth,
    "e": formatDayOfMonth,
    "f": formatMicroseconds,
    "g": formatYearISO,
    "G": formatFullYearISO,
    "H": formatHour24,
    "I": formatHour12,
    "j": formatDayOfYear,
    "L": formatMilliseconds,
    "m": formatMonthNumber,
    "M": formatMinutes,
    "p": formatPeriod,
    "q": formatQuarter,
    "Q": formatUnixTimestamp,
    "s": formatUnixTimestampSeconds,
    "S": formatSeconds,
    "u": formatWeekdayNumberMonday,
    "U": formatWeekNumberSunday,
    "V": formatWeekNumberISO,
    "w": formatWeekdayNumberSunday,
    "W": formatWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatYear,
    "Y": formatFullYear,
    "Z": formatZone,
    "%": formatLiteralPercent
  };
  var utcFormats = {
    "a": formatUTCShortWeekday,
    "A": formatUTCWeekday,
    "b": formatUTCShortMonth,
    "B": formatUTCMonth,
    "c": null,
    "d": formatUTCDayOfMonth,
    "e": formatUTCDayOfMonth,
    "f": formatUTCMicroseconds,
    "g": formatUTCYearISO,
    "G": formatUTCFullYearISO,
    "H": formatUTCHour24,
    "I": formatUTCHour12,
    "j": formatUTCDayOfYear,
    "L": formatUTCMilliseconds,
    "m": formatUTCMonthNumber,
    "M": formatUTCMinutes,
    "p": formatUTCPeriod,
    "q": formatUTCQuarter,
    "Q": formatUnixTimestamp,
    "s": formatUnixTimestampSeconds,
    "S": formatUTCSeconds,
    "u": formatUTCWeekdayNumberMonday,
    "U": formatUTCWeekNumberSunday,
    "V": formatUTCWeekNumberISO,
    "w": formatUTCWeekdayNumberSunday,
    "W": formatUTCWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatUTCYear,
    "Y": formatUTCFullYear,
    "Z": formatUTCZone,
    "%": formatLiteralPercent
  };
  var parses = {
    "a": parseShortWeekday,
    "A": parseWeekday,
    "b": parseShortMonth,
    "B": parseMonth,
    "c": parseLocaleDateTime,
    "d": parseDayOfMonth,
    "e": parseDayOfMonth,
    "f": parseMicroseconds,
    "g": parseYear,
    "G": parseFullYear,
    "H": parseHour24,
    "I": parseHour24,
    "j": parseDayOfYear,
    "L": parseMilliseconds,
    "m": parseMonthNumber,
    "M": parseMinutes,
    "p": parsePeriod,
    "q": parseQuarter,
    "Q": parseUnixTimestamp,
    "s": parseUnixTimestampSeconds,
    "S": parseSeconds,
    "u": parseWeekdayNumberMonday,
    "U": parseWeekNumberSunday,
    "V": parseWeekNumberISO,
    "w": parseWeekdayNumberSunday,
    "W": parseWeekNumberMonday,
    "x": parseLocaleDate,
    "X": parseLocaleTime,
    "y": parseYear,
    "Y": parseFullYear,
    "Z": parseZone,
    "%": parseLiteralPercent
  };
  formats.x = newFormat(locale_date, formats);
  formats.X = newFormat(locale_time, formats);
  formats.c = newFormat(locale_dateTime, formats);
  utcFormats.x = newFormat(locale_date, utcFormats);
  utcFormats.X = newFormat(locale_time, utcFormats);
  utcFormats.c = newFormat(locale_dateTime, utcFormats);
  function newFormat(specifier, formats2) {
    return function(date3) {
      var string3 = [], i = -1, j = 0, n = specifier.length, c3, pad3, format3;
      if (!(date3 instanceof Date)) date3 = /* @__PURE__ */ new Date(+date3);
      while (++i < n) {
        if (specifier.charCodeAt(i) === 37) {
          string3.push(specifier.slice(j, i));
          if ((pad3 = pads[c3 = specifier.charAt(++i)]) != null) c3 = specifier.charAt(++i);
          else pad3 = c3 === "e" ? " " : "0";
          if (format3 = formats2[c3]) c3 = format3(date3, pad3);
          string3.push(c3);
          j = i + 1;
        }
      }
      string3.push(specifier.slice(j, i));
      return string3.join("");
    };
  }
  function newParse(specifier, Z) {
    return function(string3) {
      var d = newDate(1900, void 0, 1), i = parseSpecifier(d, specifier, string3 += "", 0), week, day;
      if (i != string3.length) return null;
      if ("Q" in d) return new Date(d.Q);
      if ("s" in d) return new Date(d.s * 1e3 + ("L" in d ? d.L : 0));
      if (Z && !("Z" in d)) d.Z = 0;
      if ("p" in d) d.H = d.H % 12 + d.p * 12;
      if (d.m === void 0) d.m = "q" in d ? d.q : 0;
      if ("V" in d) {
        if (d.V < 1 || d.V > 53) return null;
        if (!("w" in d)) d.w = 1;
        if ("Z" in d) {
          week = utcDate(newDate(d.y, 0, 1)), day = week.getUTCDay();
          week = day > 4 || day === 0 ? utcMonday.ceil(week) : utcMonday(week);
          week = utcDay.offset(week, (d.V - 1) * 7);
          d.y = week.getUTCFullYear();
          d.m = week.getUTCMonth();
          d.d = week.getUTCDate() + (d.w + 6) % 7;
        } else {
          week = localDate(newDate(d.y, 0, 1)), day = week.getDay();
          week = day > 4 || day === 0 ? timeMonday.ceil(week) : timeMonday(week);
          week = timeDay.offset(week, (d.V - 1) * 7);
          d.y = week.getFullYear();
          d.m = week.getMonth();
          d.d = week.getDate() + (d.w + 6) % 7;
        }
      } else if ("W" in d || "U" in d) {
        if (!("w" in d)) d.w = "u" in d ? d.u % 7 : "W" in d ? 1 : 0;
        day = "Z" in d ? utcDate(newDate(d.y, 0, 1)).getUTCDay() : localDate(newDate(d.y, 0, 1)).getDay();
        d.m = 0;
        d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day + 5) % 7 : d.w + d.U * 7 - (day + 6) % 7;
      }
      if ("Z" in d) {
        d.H += d.Z / 100 | 0;
        d.M += d.Z % 100;
        return utcDate(d);
      }
      return localDate(d);
    };
  }
  function parseSpecifier(d, specifier, string3, j) {
    var i = 0, n = specifier.length, m = string3.length, c3, parse2;
    while (i < n) {
      if (j >= m) return -1;
      c3 = specifier.charCodeAt(i++);
      if (c3 === 37) {
        c3 = specifier.charAt(i++);
        parse2 = parses[c3 in pads ? specifier.charAt(i++) : c3];
        if (!parse2 || (j = parse2(d, string3, j)) < 0) return -1;
      } else if (c3 != string3.charCodeAt(j++)) {
        return -1;
      }
    }
    return j;
  }
  function parsePeriod(d, string3, i) {
    var n = periodRe.exec(string3.slice(i));
    return n ? (d.p = periodLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }
  function parseShortWeekday(d, string3, i) {
    var n = shortWeekdayRe.exec(string3.slice(i));
    return n ? (d.w = shortWeekdayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }
  function parseWeekday(d, string3, i) {
    var n = weekdayRe.exec(string3.slice(i));
    return n ? (d.w = weekdayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }
  function parseShortMonth(d, string3, i) {
    var n = shortMonthRe.exec(string3.slice(i));
    return n ? (d.m = shortMonthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }
  function parseMonth(d, string3, i) {
    var n = monthRe.exec(string3.slice(i));
    return n ? (d.m = monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }
  function parseLocaleDateTime(d, string3, i) {
    return parseSpecifier(d, locale_dateTime, string3, i);
  }
  function parseLocaleDate(d, string3, i) {
    return parseSpecifier(d, locale_date, string3, i);
  }
  function parseLocaleTime(d, string3, i) {
    return parseSpecifier(d, locale_time, string3, i);
  }
  function formatShortWeekday(d) {
    return locale_shortWeekdays[d.getDay()];
  }
  function formatWeekday2(d) {
    return locale_weekdays[d.getDay()];
  }
  function formatShortMonth(d) {
    return locale_shortMonths[d.getMonth()];
  }
  function formatMonth2(d) {
    return locale_months[d.getMonth()];
  }
  function formatPeriod(d) {
    return locale_periods[+(d.getHours() >= 12)];
  }
  function formatQuarter(d) {
    return 1 + ~~(d.getMonth() / 3);
  }
  function formatUTCShortWeekday(d) {
    return locale_shortWeekdays[d.getUTCDay()];
  }
  function formatUTCWeekday(d) {
    return locale_weekdays[d.getUTCDay()];
  }
  function formatUTCShortMonth(d) {
    return locale_shortMonths[d.getUTCMonth()];
  }
  function formatUTCMonth(d) {
    return locale_months[d.getUTCMonth()];
  }
  function formatUTCPeriod(d) {
    return locale_periods[+(d.getUTCHours() >= 12)];
  }
  function formatUTCQuarter(d) {
    return 1 + ~~(d.getUTCMonth() / 3);
  }
  return {
    format: function(specifier) {
      var f = newFormat(specifier += "", formats);
      f.toString = function() {
        return specifier;
      };
      return f;
    },
    parse: function(specifier) {
      var p = newParse(specifier += "", false);
      p.toString = function() {
        return specifier;
      };
      return p;
    },
    utcFormat: function(specifier) {
      var f = newFormat(specifier += "", utcFormats);
      f.toString = function() {
        return specifier;
      };
      return f;
    },
    utcParse: function(specifier) {
      var p = newParse(specifier += "", true);
      p.toString = function() {
        return specifier;
      };
      return p;
    }
  };
}
var pads = { "-": "", "_": " ", "0": "0" };
var numberRe = /^\s*\d+/;
var percentRe = /^%/;
var requoteRe = /[\\^$*+?|[\]().{}]/g;
function pad(value2, fill, width) {
  var sign3 = value2 < 0 ? "-" : "", string3 = (sign3 ? -value2 : value2) + "", length2 = string3.length;
  return sign3 + (length2 < width ? new Array(width - length2 + 1).join(fill) + string3 : string3);
}
function requote(s2) {
  return s2.replace(requoteRe, "\\$&");
}
function formatRe(names) {
  return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
}
function formatLookup(names) {
  return new Map(names.map((name, i) => [name.toLowerCase(), i]));
}
function parseWeekdayNumberSunday(d, string3, i) {
  var n = numberRe.exec(string3.slice(i, i + 1));
  return n ? (d.w = +n[0], i + n[0].length) : -1;
}
function parseWeekdayNumberMonday(d, string3, i) {
  var n = numberRe.exec(string3.slice(i, i + 1));
  return n ? (d.u = +n[0], i + n[0].length) : -1;
}
function parseWeekNumberSunday(d, string3, i) {
  var n = numberRe.exec(string3.slice(i, i + 2));
  return n ? (d.U = +n[0], i + n[0].length) : -1;
}
function parseWeekNumberISO(d, string3, i) {
  var n = numberRe.exec(string3.slice(i, i + 2));
  return n ? (d.V = +n[0], i + n[0].length) : -1;
}
function parseWeekNumberMonday(d, string3, i) {
  var n = numberRe.exec(string3.slice(i, i + 2));
  return n ? (d.W = +n[0], i + n[0].length) : -1;
}
function parseFullYear(d, string3, i) {
  var n = numberRe.exec(string3.slice(i, i + 4));
  return n ? (d.y = +n[0], i + n[0].length) : -1;
}
function parseYear(d, string3, i) {
  var n = numberRe.exec(string3.slice(i, i + 2));
  return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2e3), i + n[0].length) : -1;
}
function parseZone(d, string3, i) {
  var n = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string3.slice(i, i + 6));
  return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
}
function parseQuarter(d, string3, i) {
  var n = numberRe.exec(string3.slice(i, i + 1));
  return n ? (d.q = n[0] * 3 - 3, i + n[0].length) : -1;
}
function parseMonthNumber(d, string3, i) {
  var n = numberRe.exec(string3.slice(i, i + 2));
  return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
}
function parseDayOfMonth(d, string3, i) {
  var n = numberRe.exec(string3.slice(i, i + 2));
  return n ? (d.d = +n[0], i + n[0].length) : -1;
}
function parseDayOfYear(d, string3, i) {
  var n = numberRe.exec(string3.slice(i, i + 3));
  return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
}
function parseHour24(d, string3, i) {
  var n = numberRe.exec(string3.slice(i, i + 2));
  return n ? (d.H = +n[0], i + n[0].length) : -1;
}
function parseMinutes(d, string3, i) {
  var n = numberRe.exec(string3.slice(i, i + 2));
  return n ? (d.M = +n[0], i + n[0].length) : -1;
}
function parseSeconds(d, string3, i) {
  var n = numberRe.exec(string3.slice(i, i + 2));
  return n ? (d.S = +n[0], i + n[0].length) : -1;
}
function parseMilliseconds(d, string3, i) {
  var n = numberRe.exec(string3.slice(i, i + 3));
  return n ? (d.L = +n[0], i + n[0].length) : -1;
}
function parseMicroseconds(d, string3, i) {
  var n = numberRe.exec(string3.slice(i, i + 6));
  return n ? (d.L = Math.floor(n[0] / 1e3), i + n[0].length) : -1;
}
function parseLiteralPercent(d, string3, i) {
  var n = percentRe.exec(string3.slice(i, i + 1));
  return n ? i + n[0].length : -1;
}
function parseUnixTimestamp(d, string3, i) {
  var n = numberRe.exec(string3.slice(i));
  return n ? (d.Q = +n[0], i + n[0].length) : -1;
}
function parseUnixTimestampSeconds(d, string3, i) {
  var n = numberRe.exec(string3.slice(i));
  return n ? (d.s = +n[0], i + n[0].length) : -1;
}
function formatDayOfMonth(d, p) {
  return pad(d.getDate(), p, 2);
}
function formatHour24(d, p) {
  return pad(d.getHours(), p, 2);
}
function formatHour12(d, p) {
  return pad(d.getHours() % 12 || 12, p, 2);
}
function formatDayOfYear(d, p) {
  return pad(1 + timeDay.count(timeYear(d), d), p, 3);
}
function formatMilliseconds(d, p) {
  return pad(d.getMilliseconds(), p, 3);
}
function formatMicroseconds(d, p) {
  return formatMilliseconds(d, p) + "000";
}
function formatMonthNumber(d, p) {
  return pad(d.getMonth() + 1, p, 2);
}
function formatMinutes(d, p) {
  return pad(d.getMinutes(), p, 2);
}
function formatSeconds(d, p) {
  return pad(d.getSeconds(), p, 2);
}
function formatWeekdayNumberMonday(d) {
  var day = d.getDay();
  return day === 0 ? 7 : day;
}
function formatWeekNumberSunday(d, p) {
  return pad(timeSunday.count(timeYear(d) - 1, d), p, 2);
}
function dISO(d) {
  var day = d.getDay();
  return day >= 4 || day === 0 ? timeThursday(d) : timeThursday.ceil(d);
}
function formatWeekNumberISO(d, p) {
  d = dISO(d);
  return pad(timeThursday.count(timeYear(d), d) + (timeYear(d).getDay() === 4), p, 2);
}
function formatWeekdayNumberSunday(d) {
  return d.getDay();
}
function formatWeekNumberMonday(d, p) {
  return pad(timeMonday.count(timeYear(d) - 1, d), p, 2);
}
function formatYear(d, p) {
  return pad(d.getFullYear() % 100, p, 2);
}
function formatYearISO(d, p) {
  d = dISO(d);
  return pad(d.getFullYear() % 100, p, 2);
}
function formatFullYear(d, p) {
  return pad(d.getFullYear() % 1e4, p, 4);
}
function formatFullYearISO(d, p) {
  var day = d.getDay();
  d = day >= 4 || day === 0 ? timeThursday(d) : timeThursday.ceil(d);
  return pad(d.getFullYear() % 1e4, p, 4);
}
function formatZone(d) {
  var z = d.getTimezoneOffset();
  return (z > 0 ? "-" : (z *= -1, "+")) + pad(z / 60 | 0, "0", 2) + pad(z % 60, "0", 2);
}
function formatUTCDayOfMonth(d, p) {
  return pad(d.getUTCDate(), p, 2);
}
function formatUTCHour24(d, p) {
  return pad(d.getUTCHours(), p, 2);
}
function formatUTCHour12(d, p) {
  return pad(d.getUTCHours() % 12 || 12, p, 2);
}
function formatUTCDayOfYear(d, p) {
  return pad(1 + utcDay.count(utcYear(d), d), p, 3);
}
function formatUTCMilliseconds(d, p) {
  return pad(d.getUTCMilliseconds(), p, 3);
}
function formatUTCMicroseconds(d, p) {
  return formatUTCMilliseconds(d, p) + "000";
}
function formatUTCMonthNumber(d, p) {
  return pad(d.getUTCMonth() + 1, p, 2);
}
function formatUTCMinutes(d, p) {
  return pad(d.getUTCMinutes(), p, 2);
}
function formatUTCSeconds(d, p) {
  return pad(d.getUTCSeconds(), p, 2);
}
function formatUTCWeekdayNumberMonday(d) {
  var dow = d.getUTCDay();
  return dow === 0 ? 7 : dow;
}
function formatUTCWeekNumberSunday(d, p) {
  return pad(utcSunday.count(utcYear(d) - 1, d), p, 2);
}
function UTCdISO(d) {
  var day = d.getUTCDay();
  return day >= 4 || day === 0 ? utcThursday(d) : utcThursday.ceil(d);
}
function formatUTCWeekNumberISO(d, p) {
  d = UTCdISO(d);
  return pad(utcThursday.count(utcYear(d), d) + (utcYear(d).getUTCDay() === 4), p, 2);
}
function formatUTCWeekdayNumberSunday(d) {
  return d.getUTCDay();
}
function formatUTCWeekNumberMonday(d, p) {
  return pad(utcMonday.count(utcYear(d) - 1, d), p, 2);
}
function formatUTCYear(d, p) {
  return pad(d.getUTCFullYear() % 100, p, 2);
}
function formatUTCYearISO(d, p) {
  d = UTCdISO(d);
  return pad(d.getUTCFullYear() % 100, p, 2);
}
function formatUTCFullYear(d, p) {
  return pad(d.getUTCFullYear() % 1e4, p, 4);
}
function formatUTCFullYearISO(d, p) {
  var day = d.getUTCDay();
  d = day >= 4 || day === 0 ? utcThursday(d) : utcThursday.ceil(d);
  return pad(d.getUTCFullYear() % 1e4, p, 4);
}
function formatUTCZone() {
  return "+0000";
}
function formatLiteralPercent() {
  return "%";
}
function formatUnixTimestamp(d) {
  return +d;
}
function formatUnixTimestampSeconds(d) {
  return Math.floor(+d / 1e3);
}
var locale2;
var timeFormat;
var timeParse;
var utcFormat;
var utcParse;
defaultLocale2({
  dateTime: "%x, %X",
  date: "%-m/%-d/%Y",
  time: "%-I:%M:%S %p",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});
function defaultLocale2(definition) {
  locale2 = formatLocale2(definition);
  timeFormat = locale2.format;
  timeParse = locale2.parse;
  utcFormat = locale2.utcFormat;
  utcParse = locale2.utcParse;
  return locale2;
}
var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";
function formatIsoNative(date3) {
  return date3.toISOString();
}
var formatIso = Date.prototype.toISOString ? formatIsoNative : utcFormat(isoSpecifier);
function parseIsoNative(string3) {
  var date3 = new Date(string3);
  return isNaN(date3) ? null : date3;
}
var parseIso = +/* @__PURE__ */ new Date("2000-01-01T00:00:00.000Z") ? parseIsoNative : utcParse(isoSpecifier);

// node_modules/d3-scale/dist/d3-scale.mjs
function initRange(domain, range3) {
  switch (arguments.length) {
    case 0:
      break;
    case 1:
      this.range(domain);
      break;
    default:
      this.range(range3).domain(domain);
      break;
  }
  return this;
}
function initInterpolator(domain, interpolator) {
  switch (arguments.length) {
    case 0:
      break;
    case 1: {
      if (typeof domain === "function") this.interpolator(domain);
      else this.range(domain);
      break;
    }
    default: {
      this.domain(domain);
      if (typeof interpolator === "function") this.interpolator(interpolator);
      else this.range(interpolator);
      break;
    }
  }
  return this;
}
var implicit = Symbol("implicit");
function ordinal() {
  var index2 = new InternMap(), domain = [], range3 = [], unknown = implicit;
  function scale2(d) {
    let i = index2.get(d);
    if (i === void 0) {
      if (unknown !== implicit) return unknown;
      index2.set(d, i = domain.push(d) - 1);
    }
    return range3[i % range3.length];
  }
  scale2.domain = function(_) {
    if (!arguments.length) return domain.slice();
    domain = [], index2 = new InternMap();
    for (const value2 of _) {
      if (index2.has(value2)) continue;
      index2.set(value2, domain.push(value2) - 1);
    }
    return scale2;
  };
  scale2.range = function(_) {
    return arguments.length ? (range3 = Array.from(_), scale2) : range3.slice();
  };
  scale2.unknown = function(_) {
    return arguments.length ? (unknown = _, scale2) : unknown;
  };
  scale2.copy = function() {
    return ordinal(domain, range3).unknown(unknown);
  };
  initRange.apply(scale2, arguments);
  return scale2;
}
function band() {
  var scale2 = ordinal().unknown(void 0), domain = scale2.domain, ordinalRange2 = scale2.range, r0 = 0, r1 = 1, step2, bandwidth, round3 = false, paddingInner = 0, paddingOuter = 0, align = 0.5;
  delete scale2.unknown;
  function rescale() {
    var n = domain().length, reverse3 = r1 < r0, start = reverse3 ? r1 : r0, stop = reverse3 ? r0 : r1;
    step2 = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2);
    if (round3) step2 = Math.floor(step2);
    start += (stop - start - step2 * (n - paddingInner)) * align;
    bandwidth = step2 * (1 - paddingInner);
    if (round3) start = Math.round(start), bandwidth = Math.round(bandwidth);
    var values2 = range(n).map(function(i) {
      return start + step2 * i;
    });
    return ordinalRange2(reverse3 ? values2.reverse() : values2);
  }
  scale2.domain = function(_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };
  scale2.range = function(_) {
    return arguments.length ? ([r0, r1] = _, r0 = +r0, r1 = +r1, rescale()) : [r0, r1];
  };
  scale2.rangeRound = function(_) {
    return [r0, r1] = _, r0 = +r0, r1 = +r1, round3 = true, rescale();
  };
  scale2.bandwidth = function() {
    return bandwidth;
  };
  scale2.step = function() {
    return step2;
  };
  scale2.round = function(_) {
    return arguments.length ? (round3 = !!_, rescale()) : round3;
  };
  scale2.padding = function(_) {
    return arguments.length ? (paddingInner = Math.min(1, paddingOuter = +_), rescale()) : paddingInner;
  };
  scale2.paddingInner = function(_) {
    return arguments.length ? (paddingInner = Math.min(1, _), rescale()) : paddingInner;
  };
  scale2.paddingOuter = function(_) {
    return arguments.length ? (paddingOuter = +_, rescale()) : paddingOuter;
  };
  scale2.align = function(_) {
    return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
  };
  scale2.copy = function() {
    return band(domain(), [r0, r1]).round(round3).paddingInner(paddingInner).paddingOuter(paddingOuter).align(align);
  };
  return initRange.apply(rescale(), arguments);
}
function pointish(scale2) {
  var copy2 = scale2.copy;
  scale2.padding = scale2.paddingOuter;
  delete scale2.paddingInner;
  delete scale2.paddingOuter;
  scale2.copy = function() {
    return pointish(copy2());
  };
  return scale2;
}
function point() {
  return pointish(band.apply(null, arguments).paddingInner(1));
}
function constants(x2) {
  return function() {
    return x2;
  };
}
function number$1(x2) {
  return +x2;
}
var unit = [0, 1];
function identity$12(x2) {
  return x2;
}
function normalize2(a2, b) {
  return (b -= a2 = +a2) ? function(x2) {
    return (x2 - a2) / b;
  } : constants(isNaN(b) ? NaN : 0.5);
}
function clamper(a2, b) {
  var t;
  if (a2 > b) t = a2, a2 = b, b = t;
  return function(x2) {
    return Math.max(a2, Math.min(b, x2));
  };
}
function bimap(domain, range3, interpolate) {
  var d0 = domain[0], d1 = domain[1], r0 = range3[0], r1 = range3[1];
  if (d1 < d0) d0 = normalize2(d1, d0), r0 = interpolate(r1, r0);
  else d0 = normalize2(d0, d1), r0 = interpolate(r0, r1);
  return function(x2) {
    return r0(d0(x2));
  };
}
function polymap(domain, range3, interpolate) {
  var j = Math.min(domain.length, range3.length) - 1, d = new Array(j), r = new Array(j), i = -1;
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse();
    range3 = range3.slice().reverse();
  }
  while (++i < j) {
    d[i] = normalize2(domain[i], domain[i + 1]);
    r[i] = interpolate(range3[i], range3[i + 1]);
  }
  return function(x2) {
    var i2 = bisectRight(domain, x2, 1, j) - 1;
    return r[i2](d[i2](x2));
  };
}
function copy$1(source, target) {
  return target.domain(source.domain()).range(source.range()).interpolate(source.interpolate()).clamp(source.clamp()).unknown(source.unknown());
}
function transformer$2() {
  var domain = unit, range3 = unit, interpolate$1 = value, transform2, untransform, unknown, clamp = identity$12, piecewise2, output, input;
  function rescale() {
    var n = Math.min(domain.length, range3.length);
    if (clamp !== identity$12) clamp = clamper(domain[0], domain[n - 1]);
    piecewise2 = n > 2 ? polymap : bimap;
    output = input = null;
    return scale2;
  }
  function scale2(x2) {
    return x2 == null || isNaN(x2 = +x2) ? unknown : (output || (output = piecewise2(domain.map(transform2), range3, interpolate$1)))(transform2(clamp(x2)));
  }
  scale2.invert = function(y2) {
    return clamp(untransform((input || (input = piecewise2(range3, domain.map(transform2), number3)))(y2)));
  };
  scale2.domain = function(_) {
    return arguments.length ? (domain = Array.from(_, number$1), rescale()) : domain.slice();
  };
  scale2.range = function(_) {
    return arguments.length ? (range3 = Array.from(_), rescale()) : range3.slice();
  };
  scale2.rangeRound = function(_) {
    return range3 = Array.from(_), interpolate$1 = round, rescale();
  };
  scale2.clamp = function(_) {
    return arguments.length ? (clamp = _ ? true : identity$12, rescale()) : clamp !== identity$12;
  };
  scale2.interpolate = function(_) {
    return arguments.length ? (interpolate$1 = _, rescale()) : interpolate$1;
  };
  scale2.unknown = function(_) {
    return arguments.length ? (unknown = _, scale2) : unknown;
  };
  return function(t, u2) {
    transform2 = t, untransform = u2;
    return rescale();
  };
}
function continuous() {
  return transformer$2()(identity$12, identity$12);
}
function tickFormat(start, stop, count3, specifier) {
  var step2 = tickStep(start, stop, count3), precision;
  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s": {
      var value2 = Math.max(Math.abs(start), Math.abs(stop));
      if (specifier.precision == null && !isNaN(precision = precisionPrefix(step2, value2))) specifier.precision = precision;
      return formatPrefix(specifier, value2);
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      if (specifier.precision == null && !isNaN(precision = precisionRound(step2, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
      break;
    }
    case "f":
    case "%": {
      if (specifier.precision == null && !isNaN(precision = precisionFixed(step2))) specifier.precision = precision - (specifier.type === "%") * 2;
      break;
    }
  }
  return format(specifier);
}
function linearish(scale2) {
  var domain = scale2.domain;
  scale2.ticks = function(count3) {
    var d = domain();
    return ticks(d[0], d[d.length - 1], count3 == null ? 10 : count3);
  };
  scale2.tickFormat = function(count3, specifier) {
    var d = domain();
    return tickFormat(d[0], d[d.length - 1], count3 == null ? 10 : count3, specifier);
  };
  scale2.nice = function(count3) {
    if (count3 == null) count3 = 10;
    var d = domain();
    var i0 = 0;
    var i1 = d.length - 1;
    var start = d[i0];
    var stop = d[i1];
    var prestep;
    var step2;
    var maxIter = 10;
    if (stop < start) {
      step2 = start, start = stop, stop = step2;
      step2 = i0, i0 = i1, i1 = step2;
    }
    while (maxIter-- > 0) {
      step2 = tickIncrement(start, stop, count3);
      if (step2 === prestep) {
        d[i0] = start;
        d[i1] = stop;
        return domain(d);
      } else if (step2 > 0) {
        start = Math.floor(start / step2) * step2;
        stop = Math.ceil(stop / step2) * step2;
      } else if (step2 < 0) {
        start = Math.ceil(start * step2) / step2;
        stop = Math.floor(stop * step2) / step2;
      } else {
        break;
      }
      prestep = step2;
    }
    return scale2;
  };
  return scale2;
}
function linear2() {
  var scale2 = continuous();
  scale2.copy = function() {
    return copy$1(scale2, linear2());
  };
  initRange.apply(scale2, arguments);
  return linearish(scale2);
}
function identity5(domain) {
  var unknown;
  function scale2(x2) {
    return x2 == null || isNaN(x2 = +x2) ? unknown : x2;
  }
  scale2.invert = scale2;
  scale2.domain = scale2.range = function(_) {
    return arguments.length ? (domain = Array.from(_, number$1), scale2) : domain.slice();
  };
  scale2.unknown = function(_) {
    return arguments.length ? (unknown = _, scale2) : unknown;
  };
  scale2.copy = function() {
    return identity5(domain).unknown(unknown);
  };
  domain = arguments.length ? Array.from(domain, number$1) : [0, 1];
  return linearish(scale2);
}
function nice2(domain, interval) {
  domain = domain.slice();
  var i0 = 0, i1 = domain.length - 1, x02 = domain[i0], x12 = domain[i1], t;
  if (x12 < x02) {
    t = i0, i0 = i1, i1 = t;
    t = x02, x02 = x12, x12 = t;
  }
  domain[i0] = interval.floor(x02);
  domain[i1] = interval.ceil(x12);
  return domain;
}
function transformLog(x2) {
  return Math.log(x2);
}
function transformExp(x2) {
  return Math.exp(x2);
}
function transformLogn(x2) {
  return -Math.log(-x2);
}
function transformExpn(x2) {
  return -Math.exp(-x2);
}
function pow10(x2) {
  return isFinite(x2) ? +("1e" + x2) : x2 < 0 ? 0 : x2;
}
function powp(base) {
  return base === 10 ? pow10 : base === Math.E ? Math.exp : (x2) => Math.pow(base, x2);
}
function logp(base) {
  return base === Math.E ? Math.log : base === 10 && Math.log10 || base === 2 && Math.log2 || (base = Math.log(base), (x2) => Math.log(x2) / base);
}
function reflect(f) {
  return (x2, k2) => -f(-x2, k2);
}
function loggish(transform2) {
  const scale2 = transform2(transformLog, transformExp);
  const domain = scale2.domain;
  let base = 10;
  let logs;
  let pows;
  function rescale() {
    logs = logp(base), pows = powp(base);
    if (domain()[0] < 0) {
      logs = reflect(logs), pows = reflect(pows);
      transform2(transformLogn, transformExpn);
    } else {
      transform2(transformLog, transformExp);
    }
    return scale2;
  }
  scale2.base = function(_) {
    return arguments.length ? (base = +_, rescale()) : base;
  };
  scale2.domain = function(_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };
  scale2.ticks = (count3) => {
    const d = domain();
    let u2 = d[0];
    let v = d[d.length - 1];
    const r = v < u2;
    if (r) [u2, v] = [v, u2];
    let i = logs(u2);
    let j = logs(v);
    let k2;
    let t;
    const n = count3 == null ? 10 : +count3;
    let z = [];
    if (!(base % 1) && j - i < n) {
      i = Math.floor(i), j = Math.ceil(j);
      if (u2 > 0) for (; i <= j; ++i) {
        for (k2 = 1; k2 < base; ++k2) {
          t = i < 0 ? k2 / pows(-i) : k2 * pows(i);
          if (t < u2) continue;
          if (t > v) break;
          z.push(t);
        }
      }
      else for (; i <= j; ++i) {
        for (k2 = base - 1; k2 >= 1; --k2) {
          t = i > 0 ? k2 / pows(-i) : k2 * pows(i);
          if (t < u2) continue;
          if (t > v) break;
          z.push(t);
        }
      }
      if (z.length * 2 < n) z = ticks(u2, v, n);
    } else {
      z = ticks(i, j, Math.min(j - i, n)).map(pows);
    }
    return r ? z.reverse() : z;
  };
  scale2.tickFormat = (count3, specifier) => {
    if (count3 == null) count3 = 10;
    if (specifier == null) specifier = base === 10 ? "s" : ",";
    if (typeof specifier !== "function") {
      if (!(base % 1) && (specifier = formatSpecifier(specifier)).precision == null) specifier.trim = true;
      specifier = format(specifier);
    }
    if (count3 === Infinity) return specifier;
    const k2 = Math.max(1, base * count3 / scale2.ticks().length);
    return (d) => {
      let i = d / pows(Math.round(logs(d)));
      if (i * base < base - 0.5) i *= base;
      return i <= k2 ? specifier(d) : "";
    };
  };
  scale2.nice = () => {
    return domain(nice2(domain(), {
      floor: (x2) => pows(Math.floor(logs(x2))),
      ceil: (x2) => pows(Math.ceil(logs(x2)))
    }));
  };
  return scale2;
}
function log2() {
  const scale2 = loggish(transformer$2()).domain([1, 10]);
  scale2.copy = () => copy$1(scale2, log2()).base(scale2.base());
  initRange.apply(scale2, arguments);
  return scale2;
}
function transformSymlog(c3) {
  return function(x2) {
    return Math.sign(x2) * Math.log1p(Math.abs(x2 / c3));
  };
}
function transformSymexp(c3) {
  return function(x2) {
    return Math.sign(x2) * Math.expm1(Math.abs(x2)) * c3;
  };
}
function symlogish(transform2) {
  var c3 = 1, scale2 = transform2(transformSymlog(c3), transformSymexp(c3));
  scale2.constant = function(_) {
    return arguments.length ? transform2(transformSymlog(c3 = +_), transformSymexp(c3)) : c3;
  };
  return linearish(scale2);
}
function symlog() {
  var scale2 = symlogish(transformer$2());
  scale2.copy = function() {
    return copy$1(scale2, symlog()).constant(scale2.constant());
  };
  return initRange.apply(scale2, arguments);
}
function transformPow(exponent2) {
  return function(x2) {
    return x2 < 0 ? -Math.pow(-x2, exponent2) : Math.pow(x2, exponent2);
  };
}
function transformSqrt(x2) {
  return x2 < 0 ? -Math.sqrt(-x2) : Math.sqrt(x2);
}
function transformSquare(x2) {
  return x2 < 0 ? -x2 * x2 : x2 * x2;
}
function powish(transform2) {
  var scale2 = transform2(identity$12, identity$12), exponent2 = 1;
  function rescale() {
    return exponent2 === 1 ? transform2(identity$12, identity$12) : exponent2 === 0.5 ? transform2(transformSqrt, transformSquare) : transform2(transformPow(exponent2), transformPow(1 / exponent2));
  }
  scale2.exponent = function(_) {
    return arguments.length ? (exponent2 = +_, rescale()) : exponent2;
  };
  return linearish(scale2);
}
function pow3() {
  var scale2 = powish(transformer$2());
  scale2.copy = function() {
    return copy$1(scale2, pow3()).exponent(scale2.exponent());
  };
  initRange.apply(scale2, arguments);
  return scale2;
}
function quantile2() {
  var domain = [], range3 = [], thresholds = [], unknown;
  function rescale() {
    var i = 0, n = Math.max(1, range3.length);
    thresholds = new Array(n - 1);
    while (++i < n) thresholds[i - 1] = quantileSorted(domain, i / n);
    return scale2;
  }
  function scale2(x2) {
    return x2 == null || isNaN(x2 = +x2) ? unknown : range3[bisectRight(thresholds, x2)];
  }
  scale2.invertExtent = function(y2) {
    var i = range3.indexOf(y2);
    return i < 0 ? [NaN, NaN] : [
      i > 0 ? thresholds[i - 1] : domain[0],
      i < thresholds.length ? thresholds[i] : domain[domain.length - 1]
    ];
  };
  scale2.domain = function(_) {
    if (!arguments.length) return domain.slice();
    domain = [];
    for (let d of _) if (d != null && !isNaN(d = +d)) domain.push(d);
    domain.sort(ascending);
    return rescale();
  };
  scale2.range = function(_) {
    return arguments.length ? (range3 = Array.from(_), rescale()) : range3.slice();
  };
  scale2.unknown = function(_) {
    return arguments.length ? (unknown = _, scale2) : unknown;
  };
  scale2.quantiles = function() {
    return thresholds.slice();
  };
  scale2.copy = function() {
    return quantile2().domain(domain).range(range3).unknown(unknown);
  };
  return initRange.apply(scale2, arguments);
}
function threshold() {
  var domain = [0.5], range3 = [0, 1], unknown, n = 1;
  function scale2(x2) {
    return x2 != null && x2 <= x2 ? range3[bisectRight(domain, x2, 0, n)] : unknown;
  }
  scale2.domain = function(_) {
    return arguments.length ? (domain = Array.from(_), n = Math.min(domain.length, range3.length - 1), scale2) : domain.slice();
  };
  scale2.range = function(_) {
    return arguments.length ? (range3 = Array.from(_), n = Math.min(domain.length, range3.length - 1), scale2) : range3.slice();
  };
  scale2.invertExtent = function(y2) {
    var i = range3.indexOf(y2);
    return [domain[i - 1], domain[i]];
  };
  scale2.unknown = function(_) {
    return arguments.length ? (unknown = _, scale2) : unknown;
  };
  scale2.copy = function() {
    return threshold().domain(domain).range(range3).unknown(unknown);
  };
  return initRange.apply(scale2, arguments);
}
function date2(t) {
  return new Date(t);
}
function number4(t) {
  return t instanceof Date ? +t : Math.round(t);
}
function calendar(ticks2, tickInterval, year, month, week, day, hour, minute, second3, format3) {
  var scale2 = continuous(), invert = scale2.invert, domain = scale2.domain;
  var formatMillisecond = format3(".%L"), formatSecond = format3(":%S"), formatMinute = format3("%I:%M"), formatHour = format3("%I %p"), formatDay = format3("%a %d"), formatWeek = format3("%b %d"), formatMonth2 = format3("%B"), formatYear3 = format3("%Y");
  function tickFormat2(date3) {
    return (second3(date3) < date3 ? formatMillisecond : minute(date3) < date3 ? formatSecond : hour(date3) < date3 ? formatMinute : day(date3) < date3 ? formatHour : month(date3) < date3 ? week(date3) < date3 ? formatDay : formatWeek : year(date3) < date3 ? formatMonth2 : formatYear3)(date3);
  }
  scale2.invert = function(y2) {
    return new Date(Math.round(invert(y2)));
  };
  scale2.domain = function(_) {
    return arguments.length ? domain(Array.from(_, number4)) : domain().map(date2);
  };
  scale2.ticks = function(interval) {
    var d = domain();
    return ticks2(d[0], d[d.length - 1], interval == null ? 10 : interval);
  };
  scale2.tickFormat = function(count3, specifier) {
    return specifier == null ? tickFormat2 : format3(specifier);
  };
  scale2.nice = function(interval) {
    var d = domain();
    if (!interval || typeof interval.range !== "function") interval = tickInterval(d[0], d[d.length - 1], interval == null ? 10 : interval);
    return interval ? domain(nice2(d, interval)) : scale2;
  };
  scale2.copy = function() {
    return copy$1(scale2, calendar(ticks2, tickInterval, year, month, week, day, hour, minute, second3, format3));
  };
  return scale2;
}
function time() {
  return initRange.apply(calendar(timeTicks, timeTickInterval, timeYear, timeMonth, timeSunday, timeDay, timeHour, timeMinute, second, timeFormat).domain([new Date(2e3, 0, 1), new Date(2e3, 0, 2)]), arguments);
}
function utcTime() {
  return initRange.apply(calendar(utcTicks, utcTickInterval, utcYear, utcMonth, utcSunday, utcDay, utcHour, utcMinute, second, utcFormat).domain([Date.UTC(2e3, 0, 1), Date.UTC(2e3, 0, 2)]), arguments);
}
function copy(source, target) {
  return target.domain(source.domain()).interpolator(source.interpolator()).clamp(source.clamp()).unknown(source.unknown());
}
function transformer2() {
  var x02 = 0, x12 = 0.5, x2 = 1, s2 = 1, t03, t13, t22, k10, k21, interpolator = identity$12, transform2, clamp = false, unknown;
  function scale2(x3) {
    return x3 == null || isNaN(x3 = +x3) ? unknown : (x3 = 0.5 + ((x3 = +transform2(x3)) - t13) * (s2 * x3 < s2 * t13 ? k10 : k21), interpolator(clamp ? Math.max(0, Math.min(1, x3)) : x3));
  }
  scale2.domain = function(_) {
    return arguments.length ? ([x02, x12, x2] = _, t03 = transform2(x02 = +x02), t13 = transform2(x12 = +x12), t22 = transform2(x2 = +x2), k10 = t03 === t13 ? 0 : 0.5 / (t13 - t03), k21 = t13 === t22 ? 0 : 0.5 / (t22 - t13), s2 = t13 < t03 ? -1 : 1, scale2) : [x02, x12, x2];
  };
  scale2.clamp = function(_) {
    return arguments.length ? (clamp = !!_, scale2) : clamp;
  };
  scale2.interpolator = function(_) {
    return arguments.length ? (interpolator = _, scale2) : interpolator;
  };
  function range3(interpolate) {
    return function(_) {
      var r0, r1, r2;
      return arguments.length ? ([r0, r1, r2] = _, interpolator = piecewise(interpolate, [r0, r1, r2]), scale2) : [interpolator(0), interpolator(0.5), interpolator(1)];
    };
  }
  scale2.range = range3(value);
  scale2.rangeRound = range3(round);
  scale2.unknown = function(_) {
    return arguments.length ? (unknown = _, scale2) : unknown;
  };
  return function(t) {
    transform2 = t, t03 = t(x02), t13 = t(x12), t22 = t(x2), k10 = t03 === t13 ? 0 : 0.5 / (t13 - t03), k21 = t13 === t22 ? 0 : 0.5 / (t22 - t13), s2 = t13 < t03 ? -1 : 1;
    return scale2;
  };
}
function diverging() {
  var scale2 = linearish(transformer2()(identity$12));
  scale2.copy = function() {
    return copy(scale2, diverging());
  };
  return initInterpolator.apply(scale2, arguments);
}
function divergingLog() {
  var scale2 = loggish(transformer2()).domain([0.1, 1, 10]);
  scale2.copy = function() {
    return copy(scale2, divergingLog()).base(scale2.base());
  };
  return initInterpolator.apply(scale2, arguments);
}
function divergingSymlog() {
  var scale2 = symlogish(transformer2());
  scale2.copy = function() {
    return copy(scale2, divergingSymlog()).constant(scale2.constant());
  };
  return initInterpolator.apply(scale2, arguments);
}
function divergingPow() {
  var scale2 = powish(transformer2());
  scale2.copy = function() {
    return copy(scale2, divergingPow()).exponent(scale2.exponent());
  };
  return initInterpolator.apply(scale2, arguments);
}

// node_modules/d3-scale-chromatic/dist/d3-scale-chromatic.mjs
function colors(specifier) {
  var n = specifier.length / 6 | 0, colors2 = new Array(n), i = 0;
  while (i < n) colors2[i] = "#" + specifier.slice(i * 6, ++i * 6);
  return colors2;
}
var category10 = colors("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");
var Accent = colors("7fc97fbeaed4fdc086ffff99386cb0f0027fbf5b17666666");
var Dark2 = colors("1b9e77d95f027570b3e7298a66a61ee6ab02a6761d666666");
var observable10 = colors("4269d0efb118ff725c6cc5b03ca951ff8ab7a463f297bbf59c6b4e9498a0");
var Paired = colors("a6cee31f78b4b2df8a33a02cfb9a99e31a1cfdbf6fff7f00cab2d66a3d9affff99b15928");
var Pastel1 = colors("fbb4aeb3cde3ccebc5decbe4fed9a6ffffcce5d8bdfddaecf2f2f2");
var Pastel2 = colors("b3e2cdfdcdaccbd5e8f4cae4e6f5c9fff2aef1e2cccccccc");
var Set1 = colors("e41a1c377eb84daf4a984ea3ff7f00ffff33a65628f781bf999999");
var Set2 = colors("66c2a5fc8d628da0cbe78ac3a6d854ffd92fe5c494b3b3b3");
var Set3 = colors("8dd3c7ffffb3bebadafb807280b1d3fdb462b3de69fccde5d9d9d9bc80bdccebc5ffed6f");
var Tableau10 = colors("4e79a7f28e2ce1575976b7b259a14fedc949af7aa1ff9da79c755fbab0ab");
var ramp$1 = (scheme2) => rgbBasis(scheme2[scheme2.length - 1]);
var scheme$q = new Array(3).concat(
  "d8b365f5f5f55ab4ac",
  "a6611adfc27d80cdc1018571",
  "a6611adfc27df5f5f580cdc1018571",
  "8c510ad8b365f6e8c3c7eae55ab4ac01665e",
  "8c510ad8b365f6e8c3f5f5f5c7eae55ab4ac01665e",
  "8c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e",
  "8c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e",
  "5430058c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e003c30",
  "5430058c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e003c30"
).map(colors);
var BrBG = ramp$1(scheme$q);
var scheme$p = new Array(3).concat(
  "af8dc3f7f7f77fbf7b",
  "7b3294c2a5cfa6dba0008837",
  "7b3294c2a5cff7f7f7a6dba0008837",
  "762a83af8dc3e7d4e8d9f0d37fbf7b1b7837",
  "762a83af8dc3e7d4e8f7f7f7d9f0d37fbf7b1b7837",
  "762a839970abc2a5cfe7d4e8d9f0d3a6dba05aae611b7837",
  "762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b7837",
  "40004b762a839970abc2a5cfe7d4e8d9f0d3a6dba05aae611b783700441b",
  "40004b762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b783700441b"
).map(colors);
var PRGn = ramp$1(scheme$p);
var scheme$o = new Array(3).concat(
  "e9a3c9f7f7f7a1d76a",
  "d01c8bf1b6dab8e1864dac26",
  "d01c8bf1b6daf7f7f7b8e1864dac26",
  "c51b7de9a3c9fde0efe6f5d0a1d76a4d9221",
  "c51b7de9a3c9fde0eff7f7f7e6f5d0a1d76a4d9221",
  "c51b7dde77aef1b6dafde0efe6f5d0b8e1867fbc414d9221",
  "c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221",
  "8e0152c51b7dde77aef1b6dafde0efe6f5d0b8e1867fbc414d9221276419",
  "8e0152c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221276419"
).map(colors);
var PiYG = ramp$1(scheme$o);
var scheme$n = new Array(3).concat(
  "998ec3f7f7f7f1a340",
  "5e3c99b2abd2fdb863e66101",
  "5e3c99b2abd2f7f7f7fdb863e66101",
  "542788998ec3d8daebfee0b6f1a340b35806",
  "542788998ec3d8daebf7f7f7fee0b6f1a340b35806",
  "5427888073acb2abd2d8daebfee0b6fdb863e08214b35806",
  "5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b35806",
  "2d004b5427888073acb2abd2d8daebfee0b6fdb863e08214b358067f3b08",
  "2d004b5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b358067f3b08"
).map(colors);
var PuOr = ramp$1(scheme$n);
var scheme$m = new Array(3).concat(
  "ef8a62f7f7f767a9cf",
  "ca0020f4a58292c5de0571b0",
  "ca0020f4a582f7f7f792c5de0571b0",
  "b2182bef8a62fddbc7d1e5f067a9cf2166ac",
  "b2182bef8a62fddbc7f7f7f7d1e5f067a9cf2166ac",
  "b2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac",
  "b2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac",
  "67001fb2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac053061",
  "67001fb2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac053061"
).map(colors);
var RdBu = ramp$1(scheme$m);
var scheme$l = new Array(3).concat(
  "ef8a62ffffff999999",
  "ca0020f4a582bababa404040",
  "ca0020f4a582ffffffbababa404040",
  "b2182bef8a62fddbc7e0e0e09999994d4d4d",
  "b2182bef8a62fddbc7ffffffe0e0e09999994d4d4d",
  "b2182bd6604df4a582fddbc7e0e0e0bababa8787874d4d4d",
  "b2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d",
  "67001fb2182bd6604df4a582fddbc7e0e0e0bababa8787874d4d4d1a1a1a",
  "67001fb2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d1a1a1a"
).map(colors);
var RdGy = ramp$1(scheme$l);
var scheme$k = new Array(3).concat(
  "fc8d59ffffbf91bfdb",
  "d7191cfdae61abd9e92c7bb6",
  "d7191cfdae61ffffbfabd9e92c7bb6",
  "d73027fc8d59fee090e0f3f891bfdb4575b4",
  "d73027fc8d59fee090ffffbfe0f3f891bfdb4575b4",
  "d73027f46d43fdae61fee090e0f3f8abd9e974add14575b4",
  "d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4",
  "a50026d73027f46d43fdae61fee090e0f3f8abd9e974add14575b4313695",
  "a50026d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4313695"
).map(colors);
var RdYlBu = ramp$1(scheme$k);
var scheme$j = new Array(3).concat(
  "fc8d59ffffbf91cf60",
  "d7191cfdae61a6d96a1a9641",
  "d7191cfdae61ffffbfa6d96a1a9641",
  "d73027fc8d59fee08bd9ef8b91cf601a9850",
  "d73027fc8d59fee08bffffbfd9ef8b91cf601a9850",
  "d73027f46d43fdae61fee08bd9ef8ba6d96a66bd631a9850",
  "d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850",
  "a50026d73027f46d43fdae61fee08bd9ef8ba6d96a66bd631a9850006837",
  "a50026d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850006837"
).map(colors);
var RdYlGn = ramp$1(scheme$j);
var scheme$i = new Array(3).concat(
  "fc8d59ffffbf99d594",
  "d7191cfdae61abdda42b83ba",
  "d7191cfdae61ffffbfabdda42b83ba",
  "d53e4ffc8d59fee08be6f59899d5943288bd",
  "d53e4ffc8d59fee08bffffbfe6f59899d5943288bd",
  "d53e4ff46d43fdae61fee08be6f598abdda466c2a53288bd",
  "d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd",
  "9e0142d53e4ff46d43fdae61fee08be6f598abdda466c2a53288bd5e4fa2",
  "9e0142d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd5e4fa2"
).map(colors);
var Spectral = ramp$1(scheme$i);
var scheme$h = new Array(3).concat(
  "e5f5f999d8c92ca25f",
  "edf8fbb2e2e266c2a4238b45",
  "edf8fbb2e2e266c2a42ca25f006d2c",
  "edf8fbccece699d8c966c2a42ca25f006d2c",
  "edf8fbccece699d8c966c2a441ae76238b45005824",
  "f7fcfde5f5f9ccece699d8c966c2a441ae76238b45005824",
  "f7fcfde5f5f9ccece699d8c966c2a441ae76238b45006d2c00441b"
).map(colors);
var BuGn = ramp$1(scheme$h);
var scheme$g = new Array(3).concat(
  "e0ecf49ebcda8856a7",
  "edf8fbb3cde38c96c688419d",
  "edf8fbb3cde38c96c68856a7810f7c",
  "edf8fbbfd3e69ebcda8c96c68856a7810f7c",
  "edf8fbbfd3e69ebcda8c96c68c6bb188419d6e016b",
  "f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d6e016b",
  "f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d810f7c4d004b"
).map(colors);
var BuPu = ramp$1(scheme$g);
var scheme$f = new Array(3).concat(
  "e0f3dba8ddb543a2ca",
  "f0f9e8bae4bc7bccc42b8cbe",
  "f0f9e8bae4bc7bccc443a2ca0868ac",
  "f0f9e8ccebc5a8ddb57bccc443a2ca0868ac",
  "f0f9e8ccebc5a8ddb57bccc44eb3d32b8cbe08589e",
  "f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe08589e",
  "f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe0868ac084081"
).map(colors);
var GnBu = ramp$1(scheme$f);
var scheme$e = new Array(3).concat(
  "fee8c8fdbb84e34a33",
  "fef0d9fdcc8afc8d59d7301f",
  "fef0d9fdcc8afc8d59e34a33b30000",
  "fef0d9fdd49efdbb84fc8d59e34a33b30000",
  "fef0d9fdd49efdbb84fc8d59ef6548d7301f990000",
  "fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301f990000",
  "fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301fb300007f0000"
).map(colors);
var OrRd = ramp$1(scheme$e);
var scheme$d = new Array(3).concat(
  "ece2f0a6bddb1c9099",
  "f6eff7bdc9e167a9cf02818a",
  "f6eff7bdc9e167a9cf1c9099016c59",
  "f6eff7d0d1e6a6bddb67a9cf1c9099016c59",
  "f6eff7d0d1e6a6bddb67a9cf3690c002818a016450",
  "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016450",
  "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016c59014636"
).map(colors);
var PuBuGn = ramp$1(scheme$d);
var scheme$c = new Array(3).concat(
  "ece7f2a6bddb2b8cbe",
  "f1eef6bdc9e174a9cf0570b0",
  "f1eef6bdc9e174a9cf2b8cbe045a8d",
  "f1eef6d0d1e6a6bddb74a9cf2b8cbe045a8d",
  "f1eef6d0d1e6a6bddb74a9cf3690c00570b0034e7b",
  "fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0034e7b",
  "fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0045a8d023858"
).map(colors);
var PuBu = ramp$1(scheme$c);
var scheme$b = new Array(3).concat(
  "e7e1efc994c7dd1c77",
  "f1eef6d7b5d8df65b0ce1256",
  "f1eef6d7b5d8df65b0dd1c77980043",
  "f1eef6d4b9dac994c7df65b0dd1c77980043",
  "f1eef6d4b9dac994c7df65b0e7298ace125691003f",
  "f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125691003f",
  "f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125698004367001f"
).map(colors);
var PuRd = ramp$1(scheme$b);
var scheme$a = new Array(3).concat(
  "fde0ddfa9fb5c51b8a",
  "feebe2fbb4b9f768a1ae017e",
  "feebe2fbb4b9f768a1c51b8a7a0177",
  "feebe2fcc5c0fa9fb5f768a1c51b8a7a0177",
  "feebe2fcc5c0fa9fb5f768a1dd3497ae017e7a0177",
  "fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a0177",
  "fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a017749006a"
).map(colors);
var RdPu = ramp$1(scheme$a);
var scheme$9 = new Array(3).concat(
  "edf8b17fcdbb2c7fb8",
  "ffffcca1dab441b6c4225ea8",
  "ffffcca1dab441b6c42c7fb8253494",
  "ffffccc7e9b47fcdbb41b6c42c7fb8253494",
  "ffffccc7e9b47fcdbb41b6c41d91c0225ea80c2c84",
  "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea80c2c84",
  "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea8253494081d58"
).map(colors);
var YlGnBu = ramp$1(scheme$9);
var scheme$8 = new Array(3).concat(
  "f7fcb9addd8e31a354",
  "ffffccc2e69978c679238443",
  "ffffccc2e69978c67931a354006837",
  "ffffccd9f0a3addd8e78c67931a354006837",
  "ffffccd9f0a3addd8e78c67941ab5d238443005a32",
  "ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443005a32",
  "ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443006837004529"
).map(colors);
var YlGn = ramp$1(scheme$8);
var scheme$7 = new Array(3).concat(
  "fff7bcfec44fd95f0e",
  "ffffd4fed98efe9929cc4c02",
  "ffffd4fed98efe9929d95f0e993404",
  "ffffd4fee391fec44ffe9929d95f0e993404",
  "ffffd4fee391fec44ffe9929ec7014cc4c028c2d04",
  "ffffe5fff7bcfee391fec44ffe9929ec7014cc4c028c2d04",
  "ffffe5fff7bcfee391fec44ffe9929ec7014cc4c02993404662506"
).map(colors);
var YlOrBr = ramp$1(scheme$7);
var scheme$6 = new Array(3).concat(
  "ffeda0feb24cf03b20",
  "ffffb2fecc5cfd8d3ce31a1c",
  "ffffb2fecc5cfd8d3cf03b20bd0026",
  "ffffb2fed976feb24cfd8d3cf03b20bd0026",
  "ffffb2fed976feb24cfd8d3cfc4e2ae31a1cb10026",
  "ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cb10026",
  "ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cbd0026800026"
).map(colors);
var YlOrRd = ramp$1(scheme$6);
var scheme$5 = new Array(3).concat(
  "deebf79ecae13182bd",
  "eff3ffbdd7e76baed62171b5",
  "eff3ffbdd7e76baed63182bd08519c",
  "eff3ffc6dbef9ecae16baed63182bd08519c",
  "eff3ffc6dbef9ecae16baed64292c62171b5084594",
  "f7fbffdeebf7c6dbef9ecae16baed64292c62171b5084594",
  "f7fbffdeebf7c6dbef9ecae16baed64292c62171b508519c08306b"
).map(colors);
var Blues = ramp$1(scheme$5);
var scheme$4 = new Array(3).concat(
  "e5f5e0a1d99b31a354",
  "edf8e9bae4b374c476238b45",
  "edf8e9bae4b374c47631a354006d2c",
  "edf8e9c7e9c0a1d99b74c47631a354006d2c",
  "edf8e9c7e9c0a1d99b74c47641ab5d238b45005a32",
  "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45005a32",
  "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45006d2c00441b"
).map(colors);
var Greens = ramp$1(scheme$4);
var scheme$3 = new Array(3).concat(
  "f0f0f0bdbdbd636363",
  "f7f7f7cccccc969696525252",
  "f7f7f7cccccc969696636363252525",
  "f7f7f7d9d9d9bdbdbd969696636363252525",
  "f7f7f7d9d9d9bdbdbd969696737373525252252525",
  "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525",
  "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525000000"
).map(colors);
var Greys = ramp$1(scheme$3);
var scheme$2 = new Array(3).concat(
  "efedf5bcbddc756bb1",
  "f2f0f7cbc9e29e9ac86a51a3",
  "f2f0f7cbc9e29e9ac8756bb154278f",
  "f2f0f7dadaebbcbddc9e9ac8756bb154278f",
  "f2f0f7dadaebbcbddc9e9ac8807dba6a51a34a1486",
  "fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a34a1486",
  "fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a354278f3f007d"
).map(colors);
var Purples = ramp$1(scheme$2);
var scheme$1 = new Array(3).concat(
  "fee0d2fc9272de2d26",
  "fee5d9fcae91fb6a4acb181d",
  "fee5d9fcae91fb6a4ade2d26a50f15",
  "fee5d9fcbba1fc9272fb6a4ade2d26a50f15",
  "fee5d9fcbba1fc9272fb6a4aef3b2ccb181d99000d",
  "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181d99000d",
  "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181da50f1567000d"
).map(colors);
var Reds = ramp$1(scheme$1);
var scheme = new Array(3).concat(
  "fee6cefdae6be6550d",
  "feeddefdbe85fd8d3cd94701",
  "feeddefdbe85fd8d3ce6550da63603",
  "feeddefdd0a2fdae6bfd8d3ce6550da63603",
  "feeddefdd0a2fdae6bfd8d3cf16913d948018c2d04",
  "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d948018c2d04",
  "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d94801a636037f2704"
).map(colors);
var Oranges = ramp$1(scheme);
function cividis(t) {
  t = Math.max(0, Math.min(1, t));
  return "rgb(" + Math.max(0, Math.min(255, Math.round(-4.54 - t * (35.34 - t * (2381.73 - t * (6402.7 - t * (7024.72 - t * 2710.57))))))) + ", " + Math.max(0, Math.min(255, Math.round(32.49 + t * (170.73 + t * (52.82 - t * (131.46 - t * (176.58 - t * 67.37))))))) + ", " + Math.max(0, Math.min(255, Math.round(81.24 + t * (442.36 - t * (2482.43 - t * (6167.24 - t * (6614.94 - t * 2475.67))))))) + ")";
}
var cubehelix3 = cubehelixLong(cubehelix(300, 0.5, 0), cubehelix(-240, 0.5, 1));
var warm = cubehelixLong(cubehelix(-100, 0.75, 0.35), cubehelix(80, 1.5, 0.8));
var cool = cubehelixLong(cubehelix(260, 0.75, 0.35), cubehelix(80, 1.5, 0.8));
var c$1 = cubehelix();
function rainbow(t) {
  if (t < 0 || t > 1) t -= Math.floor(t);
  var ts = Math.abs(t - 0.5);
  c$1.h = 360 * t - 100;
  c$1.s = 1.5 - 1.5 * ts;
  c$1.l = 0.8 - 0.9 * ts;
  return c$1 + "";
}
var c = rgb();
var pi_1_3 = Math.PI / 3;
var pi_2_3 = Math.PI * 2 / 3;
function sinebow(t) {
  var x2;
  t = (0.5 - t) * Math.PI;
  c.r = 255 * (x2 = Math.sin(t)) * x2;
  c.g = 255 * (x2 = Math.sin(t + pi_1_3)) * x2;
  c.b = 255 * (x2 = Math.sin(t + pi_2_3)) * x2;
  return c + "";
}
function turbo(t) {
  t = Math.max(0, Math.min(1, t));
  return "rgb(" + Math.max(0, Math.min(255, Math.round(34.61 + t * (1172.33 - t * (10793.56 - t * (33300.12 - t * (38394.49 - t * 14825.05))))))) + ", " + Math.max(0, Math.min(255, Math.round(23.31 + t * (557.33 + t * (1225.33 - t * (3574.96 - t * (1073.77 + t * 707.56))))))) + ", " + Math.max(0, Math.min(255, Math.round(27.2 + t * (3211.1 - t * (15327.97 - t * (27814 - t * (22569.18 - t * 6838.66))))))) + ")";
}
function ramp(range3) {
  var n = range3.length;
  return function(t) {
    return range3[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
  };
}
var viridis = ramp(colors("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));
var magma = ramp(colors("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));
var inferno = ramp(colors("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));
var plasma = ramp(colors("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

// node_modules/d3-shape/dist/d3-shape.mjs
function constant4(x2) {
  return function constant6() {
    return x2;
  };
}
var cos2 = Math.cos;
var min2 = Math.min;
var sin2 = Math.sin;
var sqrt2 = Math.sqrt;
var epsilon6 = 1e-12;
var pi3 = Math.PI;
var halfPi2 = pi3 / 2;
var tau4 = 2 * pi3;
function withPath(shape) {
  let digits = 3;
  shape.digits = function(_) {
    if (!arguments.length) return digits;
    if (_ == null) {
      digits = null;
    } else {
      const d = Math.floor(_);
      if (!(d >= 0)) throw new RangeError(`invalid digits: ${_}`);
      digits = d;
    }
    return shape;
  };
  return () => new Path(digits);
}
var slice3 = Array.prototype.slice;
function array4(x2) {
  return typeof x2 === "object" && "length" in x2 ? x2 : Array.from(x2);
}
function Linear(context) {
  this._context = context;
}
Linear.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x2, y2) : this._context.moveTo(x2, y2);
        break;
      case 1:
        this._point = 2;
      // falls through
      default:
        this._context.lineTo(x2, y2);
        break;
    }
  }
};
function curveLinear(context) {
  return new Linear(context);
}
function x(p) {
  return p[0];
}
function y(p) {
  return p[1];
}
function line(x$1, y$1) {
  var defined2 = constant4(true), context = null, curve = curveLinear, output = null, path2 = withPath(line3);
  x$1 = typeof x$1 === "function" ? x$1 : x$1 === void 0 ? x : constant4(x$1);
  y$1 = typeof y$1 === "function" ? y$1 : y$1 === void 0 ? y : constant4(y$1);
  function line3(data) {
    var i, n = (data = array4(data)).length, d, defined0 = false, buffer;
    if (context == null) output = curve(buffer = path2());
    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined2(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) output.lineStart();
        else output.lineEnd();
      }
      if (defined0) output.point(+x$1(d, i, data), +y$1(d, i, data));
    }
    if (buffer) return output = null, buffer + "" || null;
  }
  line3.x = function(_) {
    return arguments.length ? (x$1 = typeof _ === "function" ? _ : constant4(+_), line3) : x$1;
  };
  line3.y = function(_) {
    return arguments.length ? (y$1 = typeof _ === "function" ? _ : constant4(+_), line3) : y$1;
  };
  line3.defined = function(_) {
    return arguments.length ? (defined2 = typeof _ === "function" ? _ : constant4(!!_), line3) : defined2;
  };
  line3.curve = function(_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), line3) : curve;
  };
  line3.context = function(_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line3) : context;
  };
  return line3;
}
function area2(x02, y02, y12) {
  var x12 = null, defined2 = constant4(true), context = null, curve = curveLinear, output = null, path2 = withPath(area4);
  x02 = typeof x02 === "function" ? x02 : x02 === void 0 ? x : constant4(+x02);
  y02 = typeof y02 === "function" ? y02 : y02 === void 0 ? constant4(0) : constant4(+y02);
  y12 = typeof y12 === "function" ? y12 : y12 === void 0 ? y : constant4(+y12);
  function area4(data) {
    var i, j, k2, n = (data = array4(data)).length, d, defined0 = false, buffer, x0z = new Array(n), y0z = new Array(n);
    if (context == null) output = curve(buffer = path2());
    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined2(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) {
          j = i;
          output.areaStart();
          output.lineStart();
        } else {
          output.lineEnd();
          output.lineStart();
          for (k2 = i - 1; k2 >= j; --k2) {
            output.point(x0z[k2], y0z[k2]);
          }
          output.lineEnd();
          output.areaEnd();
        }
      }
      if (defined0) {
        x0z[i] = +x02(d, i, data), y0z[i] = +y02(d, i, data);
        output.point(x12 ? +x12(d, i, data) : x0z[i], y12 ? +y12(d, i, data) : y0z[i]);
      }
    }
    if (buffer) return output = null, buffer + "" || null;
  }
  function arealine() {
    return line().defined(defined2).curve(curve).context(context);
  }
  area4.x = function(_) {
    return arguments.length ? (x02 = typeof _ === "function" ? _ : constant4(+_), x12 = null, area4) : x02;
  };
  area4.x0 = function(_) {
    return arguments.length ? (x02 = typeof _ === "function" ? _ : constant4(+_), area4) : x02;
  };
  area4.x1 = function(_) {
    return arguments.length ? (x12 = _ == null ? null : typeof _ === "function" ? _ : constant4(+_), area4) : x12;
  };
  area4.y = function(_) {
    return arguments.length ? (y02 = typeof _ === "function" ? _ : constant4(+_), y12 = null, area4) : y02;
  };
  area4.y0 = function(_) {
    return arguments.length ? (y02 = typeof _ === "function" ? _ : constant4(+_), area4) : y02;
  };
  area4.y1 = function(_) {
    return arguments.length ? (y12 = _ == null ? null : typeof _ === "function" ? _ : constant4(+_), area4) : y12;
  };
  area4.lineX0 = area4.lineY0 = function() {
    return arealine().x(x02).y(y02);
  };
  area4.lineY1 = function() {
    return arealine().x(x02).y(y12);
  };
  area4.lineX1 = function() {
    return arealine().x(x12).y(y02);
  };
  area4.defined = function(_) {
    return arguments.length ? (defined2 = typeof _ === "function" ? _ : constant4(!!_), area4) : defined2;
  };
  area4.curve = function(_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), area4) : curve;
  };
  area4.context = function(_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), area4) : context;
  };
  return area4;
}
var curveRadialLinear = curveRadial(curveLinear);
function Radial(curve) {
  this._curve = curve;
}
Radial.prototype = {
  areaStart: function() {
    this._curve.areaStart();
  },
  areaEnd: function() {
    this._curve.areaEnd();
  },
  lineStart: function() {
    this._curve.lineStart();
  },
  lineEnd: function() {
    this._curve.lineEnd();
  },
  point: function(a2, r) {
    this._curve.point(r * Math.sin(a2), r * -Math.cos(a2));
  }
};
function curveRadial(curve) {
  function radial(context) {
    return new Radial(curve(context));
  }
  radial._curve = curve;
  return radial;
}
var Bump = class {
  constructor(context, x2) {
    this._context = context;
    this._x = x2;
  }
  areaStart() {
    this._line = 0;
  }
  areaEnd() {
    this._line = NaN;
  }
  lineStart() {
    this._point = 0;
  }
  lineEnd() {
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  }
  point(x2, y2) {
    x2 = +x2, y2 = +y2;
    switch (this._point) {
      case 0: {
        this._point = 1;
        if (this._line) this._context.lineTo(x2, y2);
        else this._context.moveTo(x2, y2);
        break;
      }
      case 1:
        this._point = 2;
      // falls through
      default: {
        if (this._x) this._context.bezierCurveTo(this._x0 = (this._x0 + x2) / 2, this._y0, this._x0, y2, x2, y2);
        else this._context.bezierCurveTo(this._x0, this._y0 = (this._y0 + y2) / 2, x2, this._y0, x2, y2);
        break;
      }
    }
    this._x0 = x2, this._y0 = y2;
  }
};
function bumpX(context) {
  return new Bump(context, true);
}
function bumpY(context) {
  return new Bump(context, false);
}
var sqrt3$2 = sqrt2(3);
var asterisk = {
  draw(context, size) {
    const r = sqrt2(size + min2(size / 28, 0.75)) * 0.59436;
    const t = r / 2;
    const u2 = t * sqrt3$2;
    context.moveTo(0, r);
    context.lineTo(0, -r);
    context.moveTo(-u2, -t);
    context.lineTo(u2, t);
    context.moveTo(-u2, t);
    context.lineTo(u2, -t);
  }
};
var circle = {
  draw(context, size) {
    const r = sqrt2(size / pi3);
    context.moveTo(r, 0);
    context.arc(0, 0, r, 0, tau4);
  }
};
var cross2 = {
  draw(context, size) {
    const r = sqrt2(size / 5) / 2;
    context.moveTo(-3 * r, -r);
    context.lineTo(-r, -r);
    context.lineTo(-r, -3 * r);
    context.lineTo(r, -3 * r);
    context.lineTo(r, -r);
    context.lineTo(3 * r, -r);
    context.lineTo(3 * r, r);
    context.lineTo(r, r);
    context.lineTo(r, 3 * r);
    context.lineTo(-r, 3 * r);
    context.lineTo(-r, r);
    context.lineTo(-3 * r, r);
    context.closePath();
  }
};
var tan30 = sqrt2(1 / 3);
var tan30_2 = tan30 * 2;
var diamond = {
  draw(context, size) {
    const y2 = sqrt2(size / tan30_2);
    const x2 = y2 * tan30;
    context.moveTo(0, -y2);
    context.lineTo(x2, 0);
    context.lineTo(0, y2);
    context.lineTo(-x2, 0);
    context.closePath();
  }
};
var diamond2 = {
  draw(context, size) {
    const r = sqrt2(size) * 0.62625;
    context.moveTo(0, -r);
    context.lineTo(r, 0);
    context.lineTo(0, r);
    context.lineTo(-r, 0);
    context.closePath();
  }
};
var plus = {
  draw(context, size) {
    const r = sqrt2(size - min2(size / 7, 2)) * 0.87559;
    context.moveTo(-r, 0);
    context.lineTo(r, 0);
    context.moveTo(0, r);
    context.lineTo(0, -r);
  }
};
var square = {
  draw(context, size) {
    const w = sqrt2(size);
    const x2 = -w / 2;
    context.rect(x2, x2, w, w);
  }
};
var square2 = {
  draw(context, size) {
    const r = sqrt2(size) * 0.4431;
    context.moveTo(r, r);
    context.lineTo(r, -r);
    context.lineTo(-r, -r);
    context.lineTo(-r, r);
    context.closePath();
  }
};
var ka = 0.8908130915292852;
var kr = sin2(pi3 / 10) / sin2(7 * pi3 / 10);
var kx = sin2(tau4 / 10) * kr;
var ky = -cos2(tau4 / 10) * kr;
var star = {
  draw(context, size) {
    const r = sqrt2(size * ka);
    const x2 = kx * r;
    const y2 = ky * r;
    context.moveTo(0, -r);
    context.lineTo(x2, y2);
    for (let i = 1; i < 5; ++i) {
      const a2 = tau4 * i / 5;
      const c3 = cos2(a2);
      const s2 = sin2(a2);
      context.lineTo(s2 * r, -c3 * r);
      context.lineTo(c3 * x2 - s2 * y2, s2 * x2 + c3 * y2);
    }
    context.closePath();
  }
};
var sqrt3$1 = sqrt2(3);
var triangle = {
  draw(context, size) {
    const y2 = -sqrt2(size / (sqrt3$1 * 3));
    context.moveTo(0, y2 * 2);
    context.lineTo(-sqrt3$1 * y2, -y2);
    context.lineTo(sqrt3$1 * y2, -y2);
    context.closePath();
  }
};
var sqrt3 = sqrt2(3);
var triangle2 = {
  draw(context, size) {
    const s2 = sqrt2(size) * 0.6824;
    const t = s2 / 2;
    const u2 = s2 * sqrt3 / 2;
    context.moveTo(0, -s2);
    context.lineTo(u2, t);
    context.lineTo(-u2, t);
    context.closePath();
  }
};
var c2 = -0.5;
var s = sqrt2(3) / 2;
var k = 1 / sqrt2(12);
var a = (k / 2 + 1) * 3;
var wye = {
  draw(context, size) {
    const r = sqrt2(size / a);
    const x02 = r / 2, y02 = r * k;
    const x12 = x02, y12 = r * k + r;
    const x2 = -x12, y2 = y12;
    context.moveTo(x02, y02);
    context.lineTo(x12, y12);
    context.lineTo(x2, y2);
    context.lineTo(c2 * x02 - s * y02, s * x02 + c2 * y02);
    context.lineTo(c2 * x12 - s * y12, s * x12 + c2 * y12);
    context.lineTo(c2 * x2 - s * y2, s * x2 + c2 * y2);
    context.lineTo(c2 * x02 + s * y02, c2 * y02 - s * x02);
    context.lineTo(c2 * x12 + s * y12, c2 * y12 - s * x12);
    context.lineTo(c2 * x2 + s * y2, c2 * y2 - s * x2);
    context.closePath();
  }
};
var times = {
  draw(context, size) {
    const r = sqrt2(size - min2(size / 6, 1.7)) * 0.6189;
    context.moveTo(-r, -r);
    context.lineTo(r, r);
    context.moveTo(-r, r);
    context.lineTo(r, -r);
  }
};
var symbolsFill = [
  circle,
  cross2,
  diamond,
  square,
  star,
  triangle,
  wye
];
var symbolsStroke = [
  circle,
  plus,
  times,
  triangle2,
  asterisk,
  square2,
  diamond2
];
function noop3() {
}
function point$3(that, x2, y2) {
  that._context.bezierCurveTo(
    (2 * that._x0 + that._x1) / 3,
    (2 * that._y0 + that._y1) / 3,
    (that._x0 + 2 * that._x1) / 3,
    (that._y0 + 2 * that._y1) / 3,
    (that._x0 + 4 * that._x1 + x2) / 6,
    (that._y0 + 4 * that._y1 + y2) / 6
  );
}
function Basis(context) {
  this._context = context;
}
Basis.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 3:
        point$3(this, this._x1, this._y1);
      // falls through
      case 2:
        this._context.lineTo(this._x1, this._y1);
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x2, y2) : this._context.moveTo(x2, y2);
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6);
      // falls through
      default:
        point$3(this, x2, y2);
        break;
    }
    this._x0 = this._x1, this._x1 = x2;
    this._y0 = this._y1, this._y1 = y2;
  }
};
function basis2(context) {
  return new Basis(context);
}
function BasisClosed(context) {
  this._context = context;
}
BasisClosed.prototype = {
  areaStart: noop3,
  areaEnd: noop3,
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x2, this._y2);
        this._context.closePath();
        break;
      }
      case 2: {
        this._context.moveTo((this._x2 + 2 * this._x3) / 3, (this._y2 + 2 * this._y3) / 3);
        this._context.lineTo((this._x3 + 2 * this._x2) / 3, (this._y3 + 2 * this._y2) / 3);
        this._context.closePath();
        break;
      }
      case 3: {
        this.point(this._x2, this._y2);
        this.point(this._x3, this._y3);
        this.point(this._x4, this._y4);
        break;
      }
    }
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._x2 = x2, this._y2 = y2;
        break;
      case 1:
        this._point = 2;
        this._x3 = x2, this._y3 = y2;
        break;
      case 2:
        this._point = 3;
        this._x4 = x2, this._y4 = y2;
        this._context.moveTo((this._x0 + 4 * this._x1 + x2) / 6, (this._y0 + 4 * this._y1 + y2) / 6);
        break;
      default:
        point$3(this, x2, y2);
        break;
    }
    this._x0 = this._x1, this._x1 = x2;
    this._y0 = this._y1, this._y1 = y2;
  }
};
function basisClosed2(context) {
  return new BasisClosed(context);
}
function BasisOpen(context) {
  this._context = context;
}
BasisOpen.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    switch (this._point) {
      case 0:
        this._point = 1;
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        var x02 = (this._x0 + 4 * this._x1 + x2) / 6, y02 = (this._y0 + 4 * this._y1 + y2) / 6;
        this._line ? this._context.lineTo(x02, y02) : this._context.moveTo(x02, y02);
        break;
      case 3:
        this._point = 4;
      // falls through
      default:
        point$3(this, x2, y2);
        break;
    }
    this._x0 = this._x1, this._x1 = x2;
    this._y0 = this._y1, this._y1 = y2;
  }
};
function basisOpen(context) {
  return new BasisOpen(context);
}
function Bundle(context, beta2) {
  this._basis = new Basis(context);
  this._beta = beta2;
}
Bundle.prototype = {
  lineStart: function() {
    this._x = [];
    this._y = [];
    this._basis.lineStart();
  },
  lineEnd: function() {
    var x2 = this._x, y2 = this._y, j = x2.length - 1;
    if (j > 0) {
      var x02 = x2[0], y02 = y2[0], dx = x2[j] - x02, dy = y2[j] - y02, i = -1, t;
      while (++i <= j) {
        t = i / j;
        this._basis.point(
          this._beta * x2[i] + (1 - this._beta) * (x02 + t * dx),
          this._beta * y2[i] + (1 - this._beta) * (y02 + t * dy)
        );
      }
    }
    this._x = this._y = null;
    this._basis.lineEnd();
  },
  point: function(x2, y2) {
    this._x.push(+x2);
    this._y.push(+y2);
  }
};
var bundle = (function custom3(beta2) {
  function bundle2(context) {
    return beta2 === 1 ? new Basis(context) : new Bundle(context, beta2);
  }
  bundle2.beta = function(beta3) {
    return custom3(+beta3);
  };
  return bundle2;
})(0.85);
function point$2(that, x2, y2) {
  that._context.bezierCurveTo(
    that._x1 + that._k * (that._x2 - that._x0),
    that._y1 + that._k * (that._y2 - that._y0),
    that._x2 + that._k * (that._x1 - x2),
    that._y2 + that._k * (that._y1 - y2),
    that._x2,
    that._y2
  );
}
function Cardinal(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}
Cardinal.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2);
        break;
      case 3:
        point$2(this, this._x1, this._y1);
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x2, y2) : this._context.moveTo(x2, y2);
        break;
      case 1:
        this._point = 2;
        this._x1 = x2, this._y1 = y2;
        break;
      case 2:
        this._point = 3;
      // falls through
      default:
        point$2(this, x2, y2);
        break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x2;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y2;
  }
};
var cardinal = (function custom4(tension) {
  function cardinal2(context) {
    return new Cardinal(context, tension);
  }
  cardinal2.tension = function(tension2) {
    return custom4(+tension2);
  };
  return cardinal2;
})(0);
function CardinalClosed(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}
CardinalClosed.prototype = {
  areaStart: noop3,
  areaEnd: noop3,
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 2: {
        this._context.lineTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 3: {
        this.point(this._x3, this._y3);
        this.point(this._x4, this._y4);
        this.point(this._x5, this._y5);
        break;
      }
    }
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._x3 = x2, this._y3 = y2;
        break;
      case 1:
        this._point = 2;
        this._context.moveTo(this._x4 = x2, this._y4 = y2);
        break;
      case 2:
        this._point = 3;
        this._x5 = x2, this._y5 = y2;
        break;
      default:
        point$2(this, x2, y2);
        break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x2;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y2;
  }
};
var cardinalClosed = (function custom5(tension) {
  function cardinal2(context) {
    return new CardinalClosed(context, tension);
  }
  cardinal2.tension = function(tension2) {
    return custom5(+tension2);
  };
  return cardinal2;
})(0);
function CardinalOpen(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}
CardinalOpen.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    switch (this._point) {
      case 0:
        this._point = 1;
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);
        break;
      case 3:
        this._point = 4;
      // falls through
      default:
        point$2(this, x2, y2);
        break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x2;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y2;
  }
};
var cardinalOpen = (function custom6(tension) {
  function cardinal2(context) {
    return new CardinalOpen(context, tension);
  }
  cardinal2.tension = function(tension2) {
    return custom6(+tension2);
  };
  return cardinal2;
})(0);
function point$1(that, x2, y2) {
  var x12 = that._x1, y12 = that._y1, x22 = that._x2, y22 = that._y2;
  if (that._l01_a > epsilon6) {
    var a2 = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a, n = 3 * that._l01_a * (that._l01_a + that._l12_a);
    x12 = (x12 * a2 - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n;
    y12 = (y12 * a2 - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n;
  }
  if (that._l23_a > epsilon6) {
    var b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a, m = 3 * that._l23_a * (that._l23_a + that._l12_a);
    x22 = (x22 * b + that._x1 * that._l23_2a - x2 * that._l12_2a) / m;
    y22 = (y22 * b + that._y1 * that._l23_2a - y2 * that._l12_2a) / m;
  }
  that._context.bezierCurveTo(x12, y12, x22, y22, that._x2, that._y2);
}
function CatmullRom(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}
CatmullRom.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2);
        break;
      case 3:
        this.point(this._x2, this._y2);
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    if (this._point) {
      var x23 = this._x2 - x2, y23 = this._y2 - y2;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x2, y2) : this._context.moveTo(x2, y2);
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
      // falls through
      default:
        point$1(this, x2, y2);
        break;
    }
    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x2;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y2;
  }
};
var catmullRom = (function custom7(alpha) {
  function catmullRom2(context) {
    return alpha ? new CatmullRom(context, alpha) : new Cardinal(context, 0);
  }
  catmullRom2.alpha = function(alpha2) {
    return custom7(+alpha2);
  };
  return catmullRom2;
})(0.5);
function CatmullRomClosed(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}
CatmullRomClosed.prototype = {
  areaStart: noop3,
  areaEnd: noop3,
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 2: {
        this._context.lineTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 3: {
        this.point(this._x3, this._y3);
        this.point(this._x4, this._y4);
        this.point(this._x5, this._y5);
        break;
      }
    }
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    if (this._point) {
      var x23 = this._x2 - x2, y23 = this._y2 - y2;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }
    switch (this._point) {
      case 0:
        this._point = 1;
        this._x3 = x2, this._y3 = y2;
        break;
      case 1:
        this._point = 2;
        this._context.moveTo(this._x4 = x2, this._y4 = y2);
        break;
      case 2:
        this._point = 3;
        this._x5 = x2, this._y5 = y2;
        break;
      default:
        point$1(this, x2, y2);
        break;
    }
    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x2;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y2;
  }
};
var catmullRomClosed = (function custom8(alpha) {
  function catmullRom2(context) {
    return alpha ? new CatmullRomClosed(context, alpha) : new CardinalClosed(context, 0);
  }
  catmullRom2.alpha = function(alpha2) {
    return custom8(+alpha2);
  };
  return catmullRom2;
})(0.5);
function CatmullRomOpen(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}
CatmullRomOpen.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    if (this._point) {
      var x23 = this._x2 - x2, y23 = this._y2 - y2;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }
    switch (this._point) {
      case 0:
        this._point = 1;
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);
        break;
      case 3:
        this._point = 4;
      // falls through
      default:
        point$1(this, x2, y2);
        break;
    }
    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x2;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y2;
  }
};
var catmullRomOpen = (function custom9(alpha) {
  function catmullRom2(context) {
    return alpha ? new CatmullRomOpen(context, alpha) : new CardinalOpen(context, 0);
  }
  catmullRom2.alpha = function(alpha2) {
    return custom9(+alpha2);
  };
  return catmullRom2;
})(0.5);
function LinearClosed(context) {
  this._context = context;
}
LinearClosed.prototype = {
  areaStart: noop3,
  areaEnd: noop3,
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._point) this._context.closePath();
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    if (this._point) this._context.lineTo(x2, y2);
    else this._point = 1, this._context.moveTo(x2, y2);
  }
};
function linearClosed(context) {
  return new LinearClosed(context);
}
function sign2(x2) {
  return x2 < 0 ? -1 : 1;
}
function slope3(that, x2, y2) {
  var h0 = that._x1 - that._x0, h1 = x2 - that._x1, s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0), s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0), p = (s0 * h1 + s1 * h0) / (h0 + h1);
  return (sign2(s0) + sign2(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
}
function slope2(that, t) {
  var h = that._x1 - that._x0;
  return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
}
function point2(that, t03, t13) {
  var x02 = that._x0, y02 = that._y0, x12 = that._x1, y12 = that._y1, dx = (x12 - x02) / 3;
  that._context.bezierCurveTo(x02 + dx, y02 + dx * t03, x12 - dx, y12 - dx * t13, x12, y12);
}
function MonotoneX(context) {
  this._context = context;
}
MonotoneX.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x1, this._y1);
        break;
      case 3:
        point2(this, this._t0, slope2(this, this._t0));
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    var t13 = NaN;
    x2 = +x2, y2 = +y2;
    if (x2 === this._x1 && y2 === this._y1) return;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x2, y2) : this._context.moveTo(x2, y2);
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        point2(this, slope2(this, t13 = slope3(this, x2, y2)), t13);
        break;
      default:
        point2(this, this._t0, t13 = slope3(this, x2, y2));
        break;
    }
    this._x0 = this._x1, this._x1 = x2;
    this._y0 = this._y1, this._y1 = y2;
    this._t0 = t13;
  }
};
function MonotoneY(context) {
  this._context = new ReflectContext(context);
}
(MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function(x2, y2) {
  MonotoneX.prototype.point.call(this, y2, x2);
};
function ReflectContext(context) {
  this._context = context;
}
ReflectContext.prototype = {
  moveTo: function(x2, y2) {
    this._context.moveTo(y2, x2);
  },
  closePath: function() {
    this._context.closePath();
  },
  lineTo: function(x2, y2) {
    this._context.lineTo(y2, x2);
  },
  bezierCurveTo: function(x12, y12, x2, y2, x3, y3) {
    this._context.bezierCurveTo(y12, x12, y2, x2, y3, x3);
  }
};
function monotoneX(context) {
  return new MonotoneX(context);
}
function monotoneY(context) {
  return new MonotoneY(context);
}
function Natural(context) {
  this._context = context;
}
Natural.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x = [];
    this._y = [];
  },
  lineEnd: function() {
    var x2 = this._x, y2 = this._y, n = x2.length;
    if (n) {
      this._line ? this._context.lineTo(x2[0], y2[0]) : this._context.moveTo(x2[0], y2[0]);
      if (n === 2) {
        this._context.lineTo(x2[1], y2[1]);
      } else {
        var px = controlPoints(x2), py = controlPoints(y2);
        for (var i0 = 0, i1 = 1; i1 < n; ++i0, ++i1) {
          this._context.bezierCurveTo(px[0][i0], py[0][i0], px[1][i0], py[1][i0], x2[i1], y2[i1]);
        }
      }
    }
    if (this._line || this._line !== 0 && n === 1) this._context.closePath();
    this._line = 1 - this._line;
    this._x = this._y = null;
  },
  point: function(x2, y2) {
    this._x.push(+x2);
    this._y.push(+y2);
  }
};
function controlPoints(x2) {
  var i, n = x2.length - 1, m, a2 = new Array(n), b = new Array(n), r = new Array(n);
  a2[0] = 0, b[0] = 2, r[0] = x2[0] + 2 * x2[1];
  for (i = 1; i < n - 1; ++i) a2[i] = 1, b[i] = 4, r[i] = 4 * x2[i] + 2 * x2[i + 1];
  a2[n - 1] = 2, b[n - 1] = 7, r[n - 1] = 8 * x2[n - 1] + x2[n];
  for (i = 1; i < n; ++i) m = a2[i] / b[i - 1], b[i] -= m, r[i] -= m * r[i - 1];
  a2[n - 1] = r[n - 1] / b[n - 1];
  for (i = n - 2; i >= 0; --i) a2[i] = (r[i] - a2[i + 1]) / b[i];
  b[n - 1] = (x2[n] + a2[n - 1]) / 2;
  for (i = 0; i < n - 1; ++i) b[i] = 2 * x2[i + 1] - a2[i + 1];
  return [a2, b];
}
function natural(context) {
  return new Natural(context);
}
function Step(context, t) {
  this._context = context;
  this._t = t;
}
Step.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x = this._y = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    if (this._line >= 0) this._t = 1 - this._t, this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x2, y2) : this._context.moveTo(x2, y2);
        break;
      case 1:
        this._point = 2;
      // falls through
      default: {
        if (this._t <= 0) {
          this._context.lineTo(this._x, y2);
          this._context.lineTo(x2, y2);
        } else {
          var x12 = this._x * (1 - this._t) + x2 * this._t;
          this._context.lineTo(x12, this._y);
          this._context.lineTo(x12, y2);
        }
        break;
      }
    }
    this._x = x2, this._y = y2;
  }
};
function step(context) {
  return new Step(context, 0.5);
}
function stepBefore(context) {
  return new Step(context, 0);
}
function stepAfter(context) {
  return new Step(context, 1);
}

// node_modules/@observablehq/plot/dist/plot.js
var version = "0.6.19";
function defined(x2) {
  return x2 != null && !Number.isNaN(x2);
}
function ascendingDefined2(a2, b) {
  return +defined(b) - +defined(a2) || ascending(a2, b);
}
function descendingDefined(a2, b) {
  return +defined(b) - +defined(a2) || descending(a2, b);
}
function nonempty(x2) {
  return x2 != null && `${x2}` !== "";
}
function finite$1(x2) {
  return isFinite(x2) ? x2 : NaN;
}
function positive(x2) {
  return x2 > 0 && isFinite(x2) ? x2 : NaN;
}
function negative(x2) {
  return x2 < 0 && isFinite(x2) ? x2 : NaN;
}
function format2(date3, fallback) {
  if (!(date3 instanceof Date)) date3 = /* @__PURE__ */ new Date(+date3);
  if (isNaN(date3)) return typeof fallback === "function" ? fallback(date3) : fallback;
  const hours = date3.getUTCHours();
  const minutes = date3.getUTCMinutes();
  const seconds2 = date3.getUTCSeconds();
  const milliseconds2 = date3.getUTCMilliseconds();
  return `${formatYear2(date3.getUTCFullYear())}-${pad2(date3.getUTCMonth() + 1, 2)}-${pad2(date3.getUTCDate(), 2)}${hours || minutes || seconds2 || milliseconds2 ? `T${pad2(hours, 2)}:${pad2(minutes, 2)}${seconds2 || milliseconds2 ? `:${pad2(seconds2, 2)}${milliseconds2 ? `.${pad2(milliseconds2, 3)}` : ``}` : ``}Z` : ``}`;
}
function formatYear2(year) {
  return year < 0 ? `-${pad2(-year, 6)}` : year > 9999 ? `+${pad2(year, 6)}` : pad2(year, 4);
}
function pad2(value2, width) {
  return `${value2}`.padStart(width, "0");
}
var re2 = /^(?:[-+]\d{2})?\d{4}(?:-\d{2}(?:-\d{2})?)?(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[-+]\d{2}:?\d{2})?)?$/;
function parse(string3, fallback) {
  if (!re2.test(string3 += "")) return typeof fallback === "function" ? fallback(string3) : fallback;
  return new Date(string3);
}
function orderof(values2) {
  if (values2 == null) return;
  const first2 = values2[0];
  const last = values2[values2.length - 1];
  return descending(first2, last);
}
var durationSecond2 = 1e3;
var durationMinute2 = durationSecond2 * 60;
var durationHour2 = durationMinute2 * 60;
var durationDay2 = durationHour2 * 24;
var durationWeek2 = durationDay2 * 7;
var durationMonth2 = durationDay2 * 30;
var durationYear2 = durationDay2 * 365;
var tickIntervals = [
  ["millisecond", 1],
  ["2 milliseconds", 2],
  ["5 milliseconds", 5],
  ["10 milliseconds", 10],
  ["20 milliseconds", 20],
  ["50 milliseconds", 50],
  ["100 milliseconds", 100],
  ["200 milliseconds", 200],
  ["500 milliseconds", 500],
  ["second", durationSecond2],
  ["5 seconds", 5 * durationSecond2],
  ["15 seconds", 15 * durationSecond2],
  ["30 seconds", 30 * durationSecond2],
  ["minute", durationMinute2],
  ["5 minutes", 5 * durationMinute2],
  ["15 minutes", 15 * durationMinute2],
  ["30 minutes", 30 * durationMinute2],
  ["hour", durationHour2],
  ["3 hours", 3 * durationHour2],
  ["6 hours", 6 * durationHour2],
  ["12 hours", 12 * durationHour2],
  ["day", durationDay2],
  ["2 days", 2 * durationDay2],
  ["week", durationWeek2],
  ["2 weeks", 2 * durationWeek2],
  // https://github.com/d3/d3-time/issues/46
  ["month", durationMonth2],
  ["3 months", 3 * durationMonth2],
  ["6 months", 6 * durationMonth2],
  // https://github.com/d3/d3-time/issues/46
  ["year", durationYear2],
  ["2 years", 2 * durationYear2],
  ["5 years", 5 * durationYear2],
  ["10 years", 10 * durationYear2],
  ["20 years", 20 * durationYear2],
  ["50 years", 50 * durationYear2],
  ["100 years", 100 * durationYear2]
  // TODO generalize to longer time scales
];
var durations = /* @__PURE__ */ new Map([
  ["second", durationSecond2],
  ["minute", durationMinute2],
  ["hour", durationHour2],
  ["day", durationDay2],
  ["monday", durationWeek2],
  ["tuesday", durationWeek2],
  ["wednesday", durationWeek2],
  ["thursday", durationWeek2],
  ["friday", durationWeek2],
  ["saturday", durationWeek2],
  ["sunday", durationWeek2],
  ["week", durationWeek2],
  ["month", durationMonth2],
  ["year", durationYear2]
]);
var timeIntervals = /* @__PURE__ */ new Map([
  ["second", second],
  ["minute", timeMinute],
  ["hour", timeHour],
  ["day", timeDay],
  // https://github.com/d3/d3-time/issues/62
  ["monday", timeMonday],
  ["tuesday", timeTuesday],
  ["wednesday", timeWednesday],
  ["thursday", timeThursday],
  ["friday", timeFriday],
  ["saturday", timeSaturday],
  ["sunday", timeSunday],
  ["week", timeSunday],
  ["month", timeMonth],
  ["year", timeYear]
]);
var utcIntervals = /* @__PURE__ */ new Map([
  ["second", second],
  ["minute", utcMinute],
  ["hour", utcHour],
  ["day", unixDay],
  ["monday", utcMonday],
  ["tuesday", utcTuesday],
  ["wednesday", utcWednesday],
  ["thursday", utcThursday],
  ["friday", utcFriday],
  ["saturday", utcSaturday],
  ["sunday", utcSunday],
  ["week", utcSunday],
  ["month", utcMonth],
  ["year", utcYear]
]);
var intervalDuration = Symbol("intervalDuration");
var intervalType = Symbol("intervalType");
for (const [name, interval] of timeIntervals) {
  interval[intervalDuration] = durations.get(name);
  interval[intervalType] = "time";
}
for (const [name, interval] of utcIntervals) {
  interval[intervalDuration] = durations.get(name);
  interval[intervalType] = "utc";
}
var utcFormatIntervals = [
  ["year", utcYear, "utc"],
  ["month", utcMonth, "utc"],
  ["day", unixDay, "utc", 6 * durationMonth2],
  ["hour", utcHour, "utc", 3 * durationDay2],
  ["minute", utcMinute, "utc", 6 * durationHour2],
  ["second", second, "utc", 30 * durationMinute2]
];
var timeFormatIntervals = [
  ["year", timeYear, "time"],
  ["month", timeMonth, "time"],
  ["day", timeDay, "time", 6 * durationMonth2],
  ["hour", timeHour, "time", 3 * durationDay2],
  ["minute", timeMinute, "time", 6 * durationHour2],
  ["second", second, "time", 30 * durationMinute2]
];
var formatIntervals = [
  utcFormatIntervals[0],
  timeFormatIntervals[0],
  utcFormatIntervals[1],
  timeFormatIntervals[1],
  utcFormatIntervals[2],
  timeFormatIntervals[2],
  // Below day, local time typically has an hourly offset from UTC and hence the
  // two are aligned and indistinguishable; therefore, we only consider UTC, and
  // we don’t consider these if the domain only has a single value.
  ...utcFormatIntervals.slice(3)
];
function parseTimeInterval(input) {
  let name = `${input}`.toLowerCase();
  if (name.endsWith("s")) name = name.slice(0, -1);
  let period = 1;
  const match = /^(?:(\d+)\s+)/.exec(name);
  if (match) {
    name = name.slice(match[0].length);
    period = +match[1];
  }
  switch (name) {
    case "quarter":
      name = "month";
      period *= 3;
      break;
    case "half":
      name = "month";
      period *= 6;
      break;
  }
  let interval = utcIntervals.get(name);
  if (!interval) throw new Error(`unknown interval: ${input}`);
  if (period > 1 && !interval.every) throw new Error(`non-periodic interval: ${name}`);
  return [name, period];
}
function timeInterval2(input) {
  return asInterval(parseTimeInterval(input), "time");
}
function utcInterval(input) {
  return asInterval(parseTimeInterval(input), "utc");
}
function asInterval([name, period], type) {
  let interval = (type === "time" ? timeIntervals : utcIntervals).get(name);
  if (period > 1) {
    interval = interval.every(period);
    interval[intervalDuration] = durations.get(name) * period;
    interval[intervalType] = type;
  }
  return interval;
}
function generalizeTimeInterval(interval, n) {
  if (!(n > 1)) return;
  const duration = interval[intervalDuration];
  if (!tickIntervals.some(([, d]) => d === duration)) return;
  if (duration % durationDay2 === 0 && durationDay2 < duration && duration < durationMonth2) return;
  const [i] = tickIntervals[bisector(([, step2]) => Math.log(step2)).center(tickIntervals, Math.log(duration * n))];
  return (interval[intervalType] === "time" ? timeInterval2 : utcInterval)(i);
}
function formatTimeInterval(name, type, anchor) {
  const format3 = type === "time" ? timeFormat : utcFormat;
  if (anchor == null) {
    return format3(
      name === "year" ? "%Y" : name === "month" ? "%Y-%m" : name === "day" ? "%Y-%m-%d" : name === "hour" || name === "minute" ? "%Y-%m-%dT%H:%M" : name === "second" ? "%Y-%m-%dT%H:%M:%S" : "%Y-%m-%dT%H:%M:%S.%L"
    );
  }
  const template2 = getTimeTemplate(anchor);
  switch (name) {
    case "millisecond":
      return formatConditional(format3(".%L"), format3(":%M:%S"), template2);
    case "second":
      return formatConditional(format3(":%S"), format3("%-I:%M"), template2);
    case "minute":
      return formatConditional(format3("%-I:%M"), format3("%p"), template2);
    case "hour":
      return formatConditional(format3("%-I %p"), format3("%b %-d"), template2);
    case "day":
      return formatConditional(format3("%-d"), format3("%b"), template2);
    case "month":
      return formatConditional(format3("%b"), format3("%Y"), template2);
    case "year":
      return format3("%Y");
  }
  throw new Error("unable to format time ticks");
}
function getTimeTemplate(anchor) {
  return anchor === "left" || anchor === "right" ? (f1, f2) => `
${f1}
${f2}` : anchor === "top" ? (f1, f2) => `${f2}
${f1}` : (f1, f2) => `${f1}
${f2}`;
}
function getFormatIntervals(type) {
  return type === "time" ? timeFormatIntervals : type === "utc" ? utcFormatIntervals : formatIntervals;
}
function inferTimeFormat(type, dates, anchor) {
  const step2 = max(pairs(dates, (a2, b) => Math.abs(b - a2)));
  if (step2 < 1e3) return formatTimeInterval("millisecond", "utc", anchor);
  for (const [name, interval, intervalType2, maxStep] of getFormatIntervals(type)) {
    if (step2 > maxStep) break;
    if (name === "hour" && !step2) break;
    if (dates.every((d) => interval.floor(d) >= d)) return formatTimeInterval(name, intervalType2, anchor);
  }
}
function formatConditional(format1, format22, template2) {
  return (x2, i, X) => {
    const f1 = format1(x2, i);
    const f2 = format22(x2, i);
    const j = i - orderof(X);
    return i !== j && X[j] !== void 0 && f2 === format22(X[j], j) ? f1 : template2(f1, f2);
  };
}
var TypedArray = Object.getPrototypeOf(Uint8Array);
var objectToString = Object.prototype.toString;
function isArray(value2) {
  return value2 instanceof Array || value2 instanceof TypedArray;
}
function isNumberArray2(value2) {
  return value2 instanceof TypedArray && !isBigIntArray(value2);
}
function isNumberType(type) {
  return type?.prototype instanceof TypedArray && !isBigIntType(type);
}
function isBigIntArray(value2) {
  return value2 instanceof BigInt64Array || value2 instanceof BigUint64Array;
}
function isBigIntType(type) {
  return type === BigInt64Array || type === BigUint64Array;
}
var reindex = Symbol("reindex");
function valueof(data, value2, type) {
  const valueType = typeof value2;
  return valueType === "string" ? isArrowTable(data) ? maybeTypedArrowify(data.getChild(value2), type) : maybeTypedMap(data, field(value2), type) : valueType === "function" ? maybeTypedMap(data, value2, type) : valueType === "number" || value2 instanceof Date || valueType === "boolean" ? map$1(data, constant5(value2), type) : typeof value2?.transform === "function" ? maybeTypedArrayify(value2.transform(data), type) : maybeTake(maybeTypedArrayify(value2, type), data?.[reindex]);
}
function maybeTake(values2, index2) {
  return values2 != null && index2 ? take(values2, index2) : values2;
}
function maybeTypedMap(data, f, type) {
  return map$1(data, isNumberType(type) ? (d, i) => coerceNumber(f(d, i)) : f, type);
}
function maybeTypedArrayify(data, type) {
  return type === void 0 ? arrayify2(data) : isArrowVector(data) ? maybeTypedArrowify(data, type) : data instanceof type ? data : type.from(data, isNumberType(type) && !isNumberArray2(data) ? coerceNumber : void 0);
}
function maybeTypedArrowify(vector2, type) {
  return vector2 == null ? vector2 : (type === void 0 || type === Array) && isArrowDateType(vector2.type) ? coerceDates(vectorToArray(vector2)) : maybeTypedArrayify(vectorToArray(vector2), type);
}
function vectorToArray(vector2) {
  return vector2.nullCount ? vector2.toJSON() : vector2.toArray();
}
var singleton = [null];
var field = (name) => (d) => {
  const v = d[name];
  return v === void 0 && d.type === "Feature" ? d.properties?.[name] : v;
};
var indexOf = { transform: range2 };
var identity$13 = { transform: (d) => d };
var one2 = () => 1;
var yes = () => true;
var string2 = (x2) => x2 == null ? x2 : `${x2}`;
var number$12 = (x2) => x2 == null ? x2 : +x2;
var first = (x2) => x2 ? x2[0] : void 0;
var second2 = (x2) => x2 ? x2[1] : void 0;
var third = (x2) => x2 ? x2[2] : void 0;
var constant5 = (x2) => () => x2;
function percentile(reduce) {
  const p = +`${reduce}`.slice(1) / 100;
  return (I, f) => quantile(I, p, f);
}
function coerceNumbers(values2) {
  return isNumberArray2(values2) ? values2 : map$1(values2, coerceNumber, Float64Array);
}
function coerceNumber(x2) {
  return x2 == null ? NaN : Number(x2);
}
function coerceDates(values2) {
  return map$1(values2, coerceDate);
}
function coerceDate(x2) {
  return x2 instanceof Date && !isNaN(x2) ? x2 : typeof x2 === "string" ? parse(x2) : x2 == null || isNaN(x2 = Number(x2)) ? void 0 : new Date(x2);
}
function maybeColorChannel(value2, defaultValue) {
  if (value2 === void 0) value2 = defaultValue;
  return value2 === null ? [void 0, "none"] : isColor(value2) ? [void 0, value2] : [value2, void 0];
}
function maybeNumberChannel(value2, defaultValue) {
  if (value2 === void 0) value2 = defaultValue;
  return value2 === null || typeof value2 === "number" ? [void 0, value2] : [value2, void 0];
}
function maybeKeyword(input, name, allowed) {
  if (input != null) return keyword(input, name, allowed);
}
function keyword(input, name, allowed) {
  const i = `${input}`.toLowerCase();
  if (!allowed.includes(i)) throw new Error(`invalid ${name}: ${input}`);
  return i;
}
function dataify(data) {
  return isArrowTable(data) ? data : arrayify2(data);
}
function arrayify2(values2) {
  if (values2 == null || isArray(values2)) return values2;
  if (isArrowVector(values2)) return maybeTypedArrowify(values2);
  if (isGeoJSON(values2)) {
    switch (values2.type) {
      case "FeatureCollection":
        return values2.features;
      case "GeometryCollection":
        return values2.geometries;
      default:
        return [values2];
    }
  }
  return Array.from(values2);
}
function isGeoJSON(x2) {
  switch (x2?.type) {
    case "FeatureCollection":
    case "GeometryCollection":
    case "Feature":
    case "LineString":
    case "MultiLineString":
    case "MultiPoint":
    case "MultiPolygon":
    case "Point":
    case "Polygon":
    case "Sphere":
      return true;
    default:
      return false;
  }
}
function map$1(values2, f, type = Array) {
  return values2 == null ? values2 : values2 instanceof type ? values2.map(f) : type.from(values2, f);
}
function slice4(values2, type = Array) {
  return values2 instanceof type ? values2.slice() : type.from(values2);
}
function hasX(options) {
  return options?.x !== void 0 || options?.x1 !== void 0 || options?.x2 !== void 0;
}
function hasY(options) {
  return options?.y !== void 0 || options?.y1 !== void 0 || options?.y2 !== void 0;
}
function hasXY(options) {
  return hasX(options) || hasY(options) || options?.interval !== void 0;
}
function isObject(option) {
  return option?.toString === objectToString;
}
function isScaleOptions(option) {
  return isObject(option) && (option.type !== void 0 || option.domain !== void 0);
}
function isOptions(option) {
  return isObject(option) && typeof option.transform !== "function";
}
function isDomainSort(sort3) {
  return isOptions(sort3) && sort3.value === void 0 && sort3.channel === void 0;
}
function maybeZero(x2, x12, x22, x3 = identity$13) {
  if (x12 === void 0 && x22 === void 0) {
    x12 = 0, x22 = x2 === void 0 ? x3 : x2;
  } else if (x12 === void 0) {
    x12 = x2 === void 0 ? 0 : x2;
  } else if (x22 === void 0) {
    x22 = x2 === void 0 ? 0 : x2;
  }
  return [x12, x22];
}
function maybeTuple(x2, y2) {
  return x2 === void 0 && y2 === void 0 ? [first, second2] : [x2, y2];
}
function maybeZ({ z, fill, stroke } = {}) {
  if (z === void 0) [z] = maybeColorChannel(fill);
  if (z === void 0) [z] = maybeColorChannel(stroke);
  return z;
}
function lengthof(data) {
  return isArray(data) ? data.length : data?.numRows;
}
function range2(data) {
  const n = lengthof(data);
  const r = new Uint32Array(n);
  for (let i = 0; i < n; ++i) r[i] = i;
  return r;
}
function take(values2, index2) {
  return isArray(values2) ? map$1(index2, (i) => values2[i], values2.constructor) : map$1(index2, (i) => values2.at(i));
}
function taker(f) {
  return f.length === 1 ? (index2, values2) => f(take(values2, index2)) : f;
}
function subarray(I, i, j) {
  return I.subarray ? I.subarray(i, j) : I.slice(i, j);
}
function keyof2(value2) {
  return value2 !== null && typeof value2 === "object" ? value2.valueOf() : value2;
}
function maybeInput(key, options) {
  if (options[key] !== void 0) return options[key];
  switch (key) {
    case "x1":
    case "x2":
      key = "x";
      break;
    case "y1":
    case "y2":
      key = "y";
      break;
  }
  return options[key];
}
function column(source) {
  let value2;
  return [
    {
      transform: () => value2,
      label: labelof(source)
    },
    (v) => value2 = v
  ];
}
function maybeColumn(source) {
  return source == null ? [source] : column(source);
}
function labelof(value2, defaultValue) {
  return typeof value2 === "string" ? value2 : value2 && value2.label !== void 0 ? value2.label : defaultValue;
}
function mid(x12, x2) {
  return {
    transform(data) {
      const X12 = x12.transform(data);
      const X22 = x2.transform(data);
      return isTemporal(X12) || isTemporal(X22) ? map$1(X12, (_, i) => new Date((+X12[i] + +X22[i]) / 2)) : map$1(X12, (_, i) => (+X12[i] + +X22[i]) / 2, Float64Array);
    },
    label: x12.label
  };
}
function maybeApplyInterval(V, scale2) {
  const t = maybeIntervalTransform(scale2?.interval, scale2?.type);
  return t ? map$1(V, t) : V;
}
function maybeIntervalTransform(interval, type) {
  const i = maybeInterval(interval, type);
  return i && ((v) => defined(v) ? i.floor(v) : v);
}
function maybeInterval(interval, type) {
  if (interval == null) return;
  if (typeof interval === "number") return numberInterval(interval);
  if (typeof interval === "string") return (type === "time" ? timeInterval2 : utcInterval)(interval);
  if (typeof interval.floor !== "function") throw new Error("invalid interval; missing floor method");
  if (typeof interval.offset !== "function") throw new Error("invalid interval; missing offset method");
  return interval;
}
function numberInterval(interval) {
  interval = +interval;
  if (0 < interval && interval < 1 && Number.isInteger(1 / interval)) interval = -1 / interval;
  const n = Math.abs(interval);
  return interval < 0 ? {
    floor: (d) => Math.floor(d * n) / n,
    offset: (d, s2 = 1) => (d * n + Math.floor(s2)) / n,
    range: (lo, hi) => range(Math.ceil(lo * n), hi * n).map((x2) => x2 / n)
  } : {
    floor: (d) => Math.floor(d / n) * n,
    offset: (d, s2 = 1) => d + n * Math.floor(s2),
    range: (lo, hi) => range(Math.ceil(lo / n), hi / n).map((x2) => x2 * n)
  };
}
function maybeRangeInterval(interval, type) {
  interval = maybeInterval(interval, type);
  if (interval && typeof interval.range !== "function") throw new Error("invalid interval: missing range method");
  return interval;
}
function maybeNiceInterval(interval, type) {
  interval = maybeRangeInterval(interval, type);
  if (interval && typeof interval.ceil !== "function") throw new Error("invalid interval: missing ceil method");
  return interval;
}
function isTimeInterval(t) {
  return isInterval(t) && typeof t?.floor === "function" && t.floor() instanceof Date;
}
function isInterval(t) {
  return typeof t?.range === "function";
}
function maybeValue(value2) {
  return value2 === void 0 || isOptions(value2) ? value2 : { value: value2 };
}
function numberChannel(source) {
  return source == null ? null : {
    transform: (data) => valueof(data, source, Float64Array),
    label: labelof(source)
  };
}
function isTuples(data) {
  if (!isIterable(data)) return false;
  for (const d of data) {
    if (d == null) continue;
    return typeof d === "object" && "0" in d && "1" in d;
  }
}
function isIterable(value2) {
  return value2 && typeof value2[Symbol.iterator] === "function";
}
function isTextual(values2) {
  for (const value2 of values2) {
    if (value2 == null) continue;
    return typeof value2 !== "object" || value2 instanceof Date;
  }
}
function isOrdinal(values2) {
  for (const value2 of values2) {
    if (value2 == null) continue;
    const type = typeof value2;
    return type === "string" || type === "boolean";
  }
}
function isTemporal(values2) {
  for (const value2 of values2) {
    if (value2 == null) continue;
    return value2 instanceof Date;
  }
}
function isTemporalString(values2) {
  for (const value2 of values2) {
    if (value2 == null) continue;
    return typeof value2 === "string" && isNaN(value2) && parse(value2);
  }
}
function isNumericString(values2) {
  for (const value2 of values2) {
    if (value2 == null) continue;
    if (typeof value2 !== "string") return false;
    if (!value2.trim()) continue;
    return !isNaN(value2);
  }
}
function isNumeric(values2) {
  for (const value2 of values2) {
    if (value2 == null) continue;
    return typeof value2 === "number";
  }
}
function isYearIntegers(values2) {
  return isEvery(values2, isYearInteger);
}
function isYearInteger(value2) {
  return typeof value2 === "number" && Number.isInteger(value2) && 1500 <= value2 && value2 <= 2500;
}
function isEvery(values2, is) {
  let every;
  for (const value2 of values2) {
    if (value2 == null) continue;
    if (!is(value2)) return false;
    every = true;
  }
  return every;
}
var namedColors = new Set("none,currentcolor,transparent,aliceblue,antiquewhite,aqua,aquamarine,azure,beige,bisque,black,blanchedalmond,blue,blueviolet,brown,burlywood,cadetblue,chartreuse,chocolate,coral,cornflowerblue,cornsilk,crimson,cyan,darkblue,darkcyan,darkgoldenrod,darkgray,darkgreen,darkgrey,darkkhaki,darkmagenta,darkolivegreen,darkorange,darkorchid,darkred,darksalmon,darkseagreen,darkslateblue,darkslategray,darkslategrey,darkturquoise,darkviolet,deeppink,deepskyblue,dimgray,dimgrey,dodgerblue,firebrick,floralwhite,forestgreen,fuchsia,gainsboro,ghostwhite,gold,goldenrod,gray,green,greenyellow,grey,honeydew,hotpink,indianred,indigo,ivory,khaki,lavender,lavenderblush,lawngreen,lemonchiffon,lightblue,lightcoral,lightcyan,lightgoldenrodyellow,lightgray,lightgreen,lightgrey,lightpink,lightsalmon,lightseagreen,lightskyblue,lightslategray,lightslategrey,lightsteelblue,lightyellow,lime,limegreen,linen,magenta,maroon,mediumaquamarine,mediumblue,mediumorchid,mediumpurple,mediumseagreen,mediumslateblue,mediumspringgreen,mediumturquoise,mediumvioletred,midnightblue,mintcream,mistyrose,moccasin,navajowhite,navy,oldlace,olive,olivedrab,orange,orangered,orchid,palegoldenrod,palegreen,paleturquoise,palevioletred,papayawhip,peachpuff,peru,pink,plum,powderblue,purple,rebeccapurple,red,rosybrown,royalblue,saddlebrown,salmon,sandybrown,seagreen,seashell,sienna,silver,skyblue,slateblue,slategray,slategrey,snow,springgreen,steelblue,tan,teal,thistle,tomato,turquoise,violet,wheat,white,whitesmoke,yellow".split(","));
function isColor(value2) {
  if (typeof value2 !== "string") return false;
  value2 = value2.toLowerCase().trim();
  return /^#[0-9a-f]{3,8}$/.test(value2) || // hex rgb, rgba, rrggbb, rrggbbaa
  /^(?:url|var|rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(.*\)$/.test(value2) || // <funciri>, CSS variable, color, etc.
  namedColors.has(value2);
}
function isOpacity(value2) {
  return typeof value2 === "number" && (0 <= value2 && value2 <= 1 || isNaN(value2));
}
function isNoneish(value2) {
  return value2 == null || isNone(value2);
}
function isNone(value2) {
  return /^\s*none\s*$/i.test(value2);
}
function isRound(value2) {
  return /^\s*round\s*$/i.test(value2);
}
function maybeAnchor$3(value2, name) {
  return maybeKeyword(value2, name, [
    "middle",
    "top-left",
    "top",
    "top-right",
    "right",
    "bottom-right",
    "bottom",
    "bottom-left",
    "left"
  ]);
}
function maybeFrameAnchor(value2 = "middle") {
  return maybeAnchor$3(value2, "frameAnchor");
}
function inherit(options = {}, ...rest) {
  let o = options;
  for (const defaults2 of rest) {
    for (const key in defaults2) {
      if (o[key] === void 0) {
        const value2 = defaults2[key];
        if (o === options) o = { ...o, [key]: value2 };
        else o[key] = value2;
      }
    }
  }
  return o;
}
function named2(things) {
  console.warn("named iterables are deprecated; please use an object instead");
  const names = /* @__PURE__ */ new Set();
  return Object.fromEntries(
    Array.from(things, (thing) => {
      const { name } = thing;
      if (name == null) throw new Error("missing name");
      const key = `${name}`;
      if (key === "__proto__") throw new Error(`illegal name: ${key}`);
      if (names.has(key)) throw new Error(`duplicate name: ${key}`);
      names.add(key);
      return [name, thing];
    })
  );
}
function maybeNamed(things) {
  return isIterable(things) ? named2(things) : things;
}
function maybeClip(clip2) {
  if (clip2 === true) clip2 = "frame";
  else if (clip2 === false) clip2 = null;
  else if (!isGeoJSON(clip2) && clip2 != null) {
    clip2 = keyword(clip2, "clip", ["frame", "sphere"]);
    if (clip2 === "sphere") clip2 = { type: "Sphere" };
  }
  return clip2;
}
function isArrowTable(value2) {
  return value2 && typeof value2.getChild === "function" && typeof value2.toArray === "function" && value2.schema && Array.isArray(value2.schema.fields);
}
function isArrowVector(value2) {
  return value2 && typeof value2.toArray === "function" && value2.type;
}
function isArrowDateType(type) {
  return type && (type.typeId === 8 || // date
  type.typeId === 10) && // timestamp
  type.unit === 1;
}
var position$1 = Symbol("position");
var color2 = Symbol("color");
var radius = Symbol("radius");
var length = Symbol("length");
var opacity = Symbol("opacity");
var symbol = Symbol("symbol");
var projection2 = Symbol("projection");
var registry = /* @__PURE__ */ new Map([
  ["x", position$1],
  ["y", position$1],
  ["fx", position$1],
  ["fy", position$1],
  ["r", radius],
  ["color", color2],
  ["opacity", opacity],
  ["symbol", symbol],
  ["length", length],
  ["projection", projection2]
]);
function isPosition(kind) {
  return kind === position$1 || kind === projection2;
}
function hasNumericRange(kind) {
  return kind === position$1 || kind === radius || kind === length || kind === opacity;
}
var sqrt32 = Math.sqrt(3);
var sqrt4_3 = 2 / sqrt32;
var symbolHexagon = {
  draw(context, size) {
    const rx = Math.sqrt(size / Math.PI), ry = rx * sqrt4_3, hy = ry / 2;
    context.moveTo(0, ry);
    context.lineTo(rx, hy);
    context.lineTo(rx, -hy);
    context.lineTo(0, -ry);
    context.lineTo(-rx, -hy);
    context.lineTo(-rx, hy);
    context.closePath();
  }
};
var symbols = /* @__PURE__ */ new Map([
  ["asterisk", asterisk],
  ["circle", circle],
  ["cross", cross2],
  ["diamond", diamond],
  ["diamond2", diamond2],
  ["hexagon", symbolHexagon],
  ["plus", plus],
  ["square", square],
  ["square2", square2],
  ["star", star],
  ["times", times],
  ["triangle", triangle],
  ["triangle2", triangle2],
  ["wye", wye]
]);
function isSymbolObject(value2) {
  return value2 && typeof value2.draw === "function";
}
function isSymbol(value2) {
  if (isSymbolObject(value2)) return true;
  if (typeof value2 !== "string") return false;
  return symbols.has(value2.toLowerCase());
}
function maybeSymbol(symbol2) {
  if (symbol2 == null || isSymbolObject(symbol2)) return symbol2;
  const value2 = symbols.get(`${symbol2}`.toLowerCase());
  if (value2) return value2;
  throw new Error(`invalid symbol: ${symbol2}`);
}
function maybeSymbolChannel(symbol2) {
  if (symbol2 == null || isSymbolObject(symbol2)) return [void 0, symbol2];
  if (typeof symbol2 === "string") {
    const value2 = symbols.get(`${symbol2}`.toLowerCase());
    if (value2) return [void 0, value2];
  }
  return [symbol2, void 0];
}
function basic({ filter: f1, sort: s1, reverse: r1, transform: t13, initializer: i1, ...options } = {}, transform2) {
  if (t13 === void 0) {
    if (f1 != null) t13 = filterTransform(f1);
    if (s1 != null && !isDomainSort(s1)) t13 = composeTransform(t13, sortTransform(s1));
    if (r1) t13 = composeTransform(t13, reverseTransform);
  }
  if (transform2 != null && i1 != null) throw new Error("transforms cannot be applied after initializers");
  return {
    ...options,
    ...(s1 === null || isDomainSort(s1)) && { sort: s1 },
    transform: composeTransform(t13, transform2)
  };
}
function initializer({ filter: f1, sort: s1, reverse: r1, initializer: i1, ...options } = {}, initializer2) {
  if (i1 === void 0) {
    if (f1 != null) i1 = filterTransform(f1);
    if (s1 != null && !isDomainSort(s1)) i1 = composeInitializer(i1, sortTransform(s1));
    if (r1) i1 = composeInitializer(i1, reverseTransform);
  }
  return {
    ...options,
    ...(s1 === null || isDomainSort(s1)) && { sort: s1 },
    initializer: composeInitializer(i1, initializer2)
  };
}
function composeTransform(t13, t22) {
  if (t13 == null) return t22 === null ? void 0 : t22;
  if (t22 == null) return t13 === null ? void 0 : t13;
  return function(data, facets, plotOptions) {
    ({ data, facets } = t13.call(this, data, facets, plotOptions));
    return t22.call(this, dataify(data), facets, plotOptions);
  };
}
function composeInitializer(i1, i2) {
  if (i1 == null) return i2 === null ? void 0 : i2;
  if (i2 == null) return i1 === null ? void 0 : i1;
  return function(data, facets, channels, ...args) {
    let c1, d1, f1, c22, d2, f2;
    ({ data: d1 = data, facets: f1 = facets, channels: c1 } = i1.call(this, data, facets, channels, ...args));
    ({ data: d2 = d1, facets: f2 = f1, channels: c22 } = i2.call(this, d1, f1, { ...channels, ...c1 }, ...args));
    return { data: d2, facets: f2, channels: { ...c1, ...c22 } };
  };
}
function apply(options, t) {
  return (options.initializer != null ? initializer : basic)(options, t);
}
function filter2(test, options) {
  return apply(options, filterTransform(test));
}
function filterTransform(value2) {
  return (data, facets) => {
    const V = valueof(data, value2);
    return { data, facets: facets.map((I) => I.filter((i) => V[i])) };
  };
}
function reverse2({ sort: sort3, ...options } = {}) {
  return {
    ...apply(options, reverseTransform),
    sort: isDomainSort(sort3) ? sort3 : null
  };
}
function reverseTransform(data, facets) {
  return { data, facets: facets.map((I) => I.slice().reverse()) };
}
function shuffle2({ seed, sort: sort3, ...options } = {}) {
  return {
    ...apply(options, sortValue(seed == null ? Math.random : lcg(seed))),
    sort: isDomainSort(sort3) ? sort3 : null
  };
}
function sort2(order, { sort: sort3, ...options } = {}) {
  return {
    ...(isOptions(order) && order.channel !== void 0 ? initializer : apply)(options, sortTransform(order)),
    sort: isDomainSort(sort3) ? sort3 : null
  };
}
function sortTransform(value2) {
  return (typeof value2 === "function" && value2.length !== 1 ? sortData : sortValue)(value2);
}
function sortData(compare) {
  return (data, facets) => {
    const compareData = isArray(data) ? (i, j) => compare(data[i], data[j]) : (i, j) => compare(data.get(i), data.get(j));
    return { data, facets: facets.map((I) => I.slice().sort(compareData)) };
  };
}
function sortValue(value2) {
  let channel, order;
  ({ channel, value: value2, order } = { ...maybeValue(value2) });
  const negate = channel?.startsWith("-");
  if (negate) channel = channel.slice(1);
  if (order === void 0) order = negate ? descendingDefined : ascendingDefined2;
  if (typeof order !== "function") {
    switch (`${order}`.toLowerCase()) {
      case "ascending":
        order = ascendingDefined2;
        break;
      case "descending":
        order = descendingDefined;
        break;
      default:
        throw new Error(`invalid order: ${order}`);
    }
  }
  return (data, facets, channels) => {
    let V;
    if (channel === void 0) {
      V = valueof(data, value2);
    } else {
      if (channels === void 0) throw new Error("channel sort requires an initializer");
      V = channels[channel];
      if (!V) return {};
      V = V.value;
    }
    const compareValue = (i, j) => order(V[i], V[j]);
    return { data, facets: facets.map((I) => I.slice().sort(compareValue)) };
  };
}
function groupZ$1(outputs, options) {
  return groupn(null, null, outputs, options);
}
function groupX(outputs = { y: "count" }, options = {}) {
  const { x: x2 = identity$13 } = options;
  if (x2 == null) throw new Error("missing channel: x");
  return groupn(x2, null, outputs, options);
}
function groupY(outputs = { x: "count" }, options = {}) {
  const { y: y2 = identity$13 } = options;
  if (y2 == null) throw new Error("missing channel: y");
  return groupn(null, y2, outputs, options);
}
function group2(outputs = { fill: "count" }, options = {}) {
  let { x: x2, y: y2 } = options;
  [x2, y2] = maybeTuple(x2, y2);
  if (x2 == null) throw new Error("missing channel: x");
  if (y2 == null) throw new Error("missing channel: y");
  return groupn(x2, y2, outputs, options);
}
function groupn(x2, y2, {
  data: reduceData = reduceIdentity,
  filter: filter3,
  sort: sort3,
  reverse: reverse3,
  ...outputs
  // output channel definitions
} = {}, inputs = {}) {
  outputs = maybeGroupOutputs(outputs, inputs);
  reduceData = maybeGroupReduce(reduceData, identity$13);
  sort3 = sort3 == null ? void 0 : maybeGroupOutput("sort", sort3, inputs);
  filter3 = filter3 == null ? void 0 : maybeGroupEvaluator("filter", filter3, inputs);
  const [GX, setGX] = maybeColumn(x2);
  const [GY, setGY] = maybeColumn(y2);
  const {
    z,
    fill,
    stroke,
    x1: x12,
    x2: x22,
    // consumed if x is an output
    y1: y12,
    y2: y22,
    // consumed if y is an output
    ...options
  } = inputs;
  const [GZ, setGZ] = maybeColumn(z);
  const [vfill] = maybeColorChannel(fill);
  const [vstroke] = maybeColorChannel(stroke);
  const [GF, setGF] = maybeColumn(vfill);
  const [GS, setGS] = maybeColumn(vstroke);
  return {
    ..."z" in inputs && { z: GZ || z },
    ..."fill" in inputs && { fill: GF || fill },
    ..."stroke" in inputs && { stroke: GS || stroke },
    ...basic(options, (data, facets, plotOptions) => {
      const X = maybeApplyInterval(valueof(data, x2), plotOptions?.x);
      const Y = maybeApplyInterval(valueof(data, y2), plotOptions?.y);
      const Z = valueof(data, z);
      const F = valueof(data, vfill);
      const S = valueof(data, vstroke);
      const G = maybeSubgroup(outputs, { z: Z, fill: F, stroke: S });
      const groupFacets = [];
      const groupData = [];
      const GX2 = X && setGX([]);
      const GY2 = Y && setGY([]);
      const GZ2 = Z && setGZ([]);
      const GF2 = F && setGF([]);
      const GS2 = S && setGS([]);
      let i = 0;
      for (const o of outputs) o.initialize(data);
      if (sort3) sort3.initialize(data);
      if (filter3) filter3.initialize(data);
      for (const facet of facets) {
        const groupFacet = [];
        for (const o of outputs) o.scope("facet", facet);
        if (sort3) sort3.scope("facet", facet);
        if (filter3) filter3.scope("facet", facet);
        for (const [f, I] of maybeGroup(facet, G)) {
          for (const [y3, gg] of maybeGroup(I, Y)) {
            for (const [x3, g] of maybeGroup(gg, X)) {
              const extent3 = { data };
              if (X) extent3.x = x3;
              if (Y) extent3.y = y3;
              if (G) extent3.z = f;
              if (filter3 && !filter3.reduce(g, extent3)) continue;
              groupFacet.push(i++);
              groupData.push(reduceData.reduceIndex(g, data, extent3));
              if (X) GX2.push(x3);
              if (Y) GY2.push(y3);
              if (Z) GZ2.push(G === Z ? f : Z[g[0]]);
              if (F) GF2.push(G === F ? f : F[g[0]]);
              if (S) GS2.push(G === S ? f : S[g[0]]);
              for (const o of outputs) o.reduce(g, extent3);
              if (sort3) sort3.reduce(g, extent3);
            }
          }
        }
        groupFacets.push(groupFacet);
      }
      maybeSort(groupFacets, sort3, reverse3);
      return { data: groupData, facets: groupFacets };
    }),
    ...!hasOutput(outputs, "x") && (GX ? { x: GX } : { x1: x12, x2: x22 }),
    ...!hasOutput(outputs, "y") && (GY ? { y: GY } : { y1: y12, y2: y22 }),
    ...Object.fromEntries(outputs.map(({ name, output }) => [name, output]))
  };
}
function hasOutput(outputs, ...names) {
  for (const { name } of outputs) {
    if (names.includes(name)) {
      return true;
    }
  }
  return false;
}
function maybeOutputs(outputs, inputs, asOutput = maybeOutput) {
  const entries = Object.entries(outputs);
  if (inputs.title != null && outputs.title === void 0) entries.push(["title", reduceTitle]);
  if (inputs.href != null && outputs.href === void 0) entries.push(["href", reduceFirst$1]);
  return entries.filter(([, reduce]) => reduce !== void 0).map(([name, reduce]) => reduce === null ? nullOutput(name) : asOutput(name, reduce, inputs));
}
function maybeOutput(name, reduce, inputs, asEvaluator = maybeEvaluator) {
  let scale2;
  if (isObject(reduce) && "reduce" in reduce) scale2 = reduce.scale, reduce = reduce.reduce;
  const evaluator = asEvaluator(name, reduce, inputs);
  const [output, setOutput] = column(evaluator.label);
  let O;
  return {
    name,
    output: scale2 === void 0 ? output : { value: output, scale: scale2 },
    initialize(data) {
      evaluator.initialize(data);
      O = setOutput([]);
    },
    scope(scope, I) {
      evaluator.scope(scope, I);
    },
    reduce(I, extent3) {
      O.push(evaluator.reduce(I, extent3));
    }
  };
}
function nullOutput(name) {
  return { name, initialize() {
  }, scope() {
  }, reduce() {
  } };
}
function maybeEvaluator(name, reduce, inputs, asReduce = maybeReduce$1) {
  const input = maybeInput(name, inputs);
  const reducer2 = asReduce(reduce, input);
  let V, context;
  return {
    label: labelof(reducer2 === reduceCount ? null : input, reducer2.label),
    initialize(data) {
      V = input === void 0 ? data : valueof(data, input);
      if (reducer2.scope === "data") {
        context = reducer2.reduceIndex(range2(data), V);
      }
    },
    scope(scope, I) {
      if (reducer2.scope === scope) {
        context = reducer2.reduceIndex(I, V);
      }
    },
    reduce(I, extent3) {
      return reducer2.scope == null ? reducer2.reduceIndex(I, V, extent3) : reducer2.reduceIndex(I, V, context, extent3);
    }
  };
}
function maybeGroup(I, X) {
  return X ? group(I, (i) => X[i]) : [[, I]];
}
function maybeReduce$1(reduce, value2, fallback = invalidReduce) {
  if (reduce == null) return fallback(reduce);
  if (typeof reduce.reduceIndex === "function") return reduce;
  if (typeof reduce.reduce === "function" && isObject(reduce)) return reduceReduce(reduce);
  if (typeof reduce === "function") return reduceFunction(reduce);
  if (/^p\d{2}$/i.test(reduce)) return reduceAccessor$1(percentile(reduce));
  switch (`${reduce}`.toLowerCase()) {
    case "first":
      return reduceFirst$1;
    case "last":
      return reduceLast$1;
    case "identity":
      return reduceIdentity;
    case "count":
      return reduceCount;
    case "distinct":
      return reduceDistinct;
    case "sum":
      return value2 == null ? reduceCount : reduceSum$1;
    case "proportion":
      return reduceProportion(value2, "data");
    case "proportion-facet":
      return reduceProportion(value2, "facet");
    case "deviation":
      return reduceAccessor$1(deviation);
    case "min":
      return reduceAccessor$1(min);
    case "min-index":
      return reduceAccessor$1(minIndex);
    case "max":
      return reduceAccessor$1(max);
    case "max-index":
      return reduceAccessor$1(maxIndex);
    case "mean":
      return reduceMaybeTemporalAccessor(mean);
    case "median":
      return reduceMaybeTemporalAccessor(median);
    case "variance":
      return reduceAccessor$1(variance);
    case "mode":
      return reduceAccessor$1(mode);
  }
  return fallback(reduce);
}
function invalidReduce(reduce) {
  throw new Error(`invalid reduce: ${reduce}`);
}
function maybeGroupOutputs(outputs, inputs) {
  return maybeOutputs(outputs, inputs, maybeGroupOutput);
}
function maybeGroupOutput(name, reduce, inputs) {
  return maybeOutput(name, reduce, inputs, maybeGroupEvaluator);
}
function maybeGroupEvaluator(name, reduce, inputs) {
  return maybeEvaluator(name, reduce, inputs, maybeGroupReduce);
}
function maybeGroupReduce(reduce, value2) {
  return maybeReduce$1(reduce, value2, maybeGroupReduceFallback);
}
function maybeGroupReduceFallback(reduce) {
  switch (`${reduce}`.toLowerCase()) {
    case "x":
      return reduceX$1;
    case "y":
      return reduceY$1;
    case "z":
      return reduceZ;
  }
  throw new Error(`invalid group reduce: ${reduce}`);
}
function maybeSubgroup(outputs, inputs) {
  for (const name in inputs) {
    const value2 = inputs[name];
    if (value2 !== void 0 && !outputs.some((o) => o.name === name)) {
      return value2;
    }
  }
}
function maybeSort(facets, sort3, reverse3) {
  if (sort3) {
    const S = sort3.output.transform();
    const compare = (i, j) => ascendingDefined2(S[i], S[j]);
    facets.forEach((f) => f.sort(compare));
  }
  if (reverse3) {
    facets.forEach((f) => f.reverse());
  }
}
function reduceReduce(reduce) {
  console.warn("deprecated reduce interface; implement reduceIndex instead.");
  return { ...reduce, reduceIndex: reduce.reduce.bind(reduce) };
}
function reduceFunction(f) {
  return {
    reduceIndex(I, X, extent3) {
      return f(take(X, I), extent3);
    }
  };
}
function reduceAccessor$1(f) {
  return {
    reduceIndex(I, X) {
      return f(I, (i) => X[i]);
    }
  };
}
function reduceMaybeTemporalAccessor(f) {
  return {
    reduceIndex(I, X) {
      const x2 = f(I, (i) => X[i]);
      return isTemporal(X) ? new Date(x2) : x2;
    }
  };
}
var reduceIdentity = {
  reduceIndex(I, X) {
    return take(X, I);
  }
};
var reduceFirst$1 = {
  reduceIndex(I, X) {
    return X[I[0]];
  }
};
var reduceTitle = {
  reduceIndex(I, X) {
    const n = 5;
    const groups = sort(
      rollup(
        I,
        (V) => V.length,
        (i) => X[i]
      ),
      second2
    );
    const top2 = groups.slice(-n).reverse();
    if (top2.length < groups.length) {
      const bottom2 = groups.slice(0, 1 - n);
      top2[n - 1] = [`\u2026 ${bottom2.length.toLocaleString("en-US")} more`, sum(bottom2, second2)];
    }
    return top2.map(([key, value2]) => `${key} (${value2.toLocaleString("en-US")})`).join("\n");
  }
};
var reduceLast$1 = {
  reduceIndex(I, X) {
    return X[I[I.length - 1]];
  }
};
var reduceCount = {
  label: "Frequency",
  reduceIndex(I) {
    return I.length;
  }
};
var reduceDistinct = {
  label: "Distinct",
  reduceIndex(I, X) {
    const s2 = new InternSet();
    for (const i of I) s2.add(X[i]);
    return s2.size;
  }
};
var reduceSum$1 = reduceAccessor$1(sum);
function reduceProportion(value2, scope) {
  return value2 == null ? { scope, label: "Frequency", reduceIndex: (I, V, basis3 = 1) => I.length / basis3 } : { scope, reduceIndex: (I, V, basis3 = 1) => sum(I, (i) => V[i]) / basis3 };
}
var reduceX$1 = {
  reduceIndex(I, X, { x: x2 }) {
    return x2;
  }
};
var reduceY$1 = {
  reduceIndex(I, X, { y: y2 }) {
    return y2;
  }
};
var reduceZ = {
  reduceIndex(I, X, { z }) {
    return z;
  }
};
function find2(test) {
  if (typeof test !== "function") throw new Error(`invalid test function: ${test}`);
  return {
    reduceIndex(I, V, { data }) {
      return V[I.find(isArray(data) ? (i) => test(data[i], i, data) : (i) => test(data.get(i), i, data))];
    }
  };
}
function createChannel(data, { scale: scale2, type, value: value2, filter: filter3, hint, label = labelof(value2) }, name) {
  if (hint === void 0 && typeof value2?.transform === "function") hint = value2.hint;
  return inferChannelScale(name, {
    scale: scale2,
    type,
    value: valueof(data, value2),
    label,
    filter: filter3,
    hint
  });
}
function createChannels(channels, data) {
  return Object.fromEntries(
    Object.entries(channels).map(([name, channel]) => [name, createChannel(data, channel, name)])
  );
}
function valueObject(channels, scales) {
  const values2 = Object.fromEntries(
    Object.entries(channels).map(([name, { scale: scaleName, value: value2 }]) => {
      const scale2 = scaleName == null ? null : scales[scaleName];
      return [name, scale2 == null ? value2 : map$1(value2, scale2)];
    })
  );
  values2.channels = channels;
  return values2;
}
function inferChannelScale(name, channel) {
  const { scale: scale2, value: value2 } = channel;
  if (scale2 === true || scale2 === "auto") {
    switch (name) {
      case "fill":
      case "stroke":
      case "color":
        channel.scale = scale2 !== true && isEvery(value2, isColor) ? null : "color";
        channel.defaultScale = "color";
        break;
      case "fillOpacity":
      case "strokeOpacity":
      case "opacity":
        channel.scale = scale2 !== true && isEvery(value2, isOpacity) ? null : "opacity";
        channel.defaultScale = "opacity";
        break;
      case "symbol":
        if (scale2 !== true && isEvery(value2, isSymbol)) {
          channel.scale = null;
          channel.value = map$1(value2, maybeSymbol);
        } else {
          channel.scale = "symbol";
        }
        channel.defaultScale = "symbol";
        break;
      default:
        channel.scale = registry.has(name) ? name : null;
        break;
    }
  } else if (scale2 === false) {
    channel.scale = null;
  } else if (scale2 != null && !registry.has(scale2)) {
    throw new Error(`unknown scale: ${scale2}`);
  }
  return channel;
}
function channelDomain(data, facets, channels, facetChannels, options) {
  const { order: defaultOrder, reverse: defaultReverse, reduce: defaultReduce = true, limit: defaultLimit } = options;
  for (const x2 in options) {
    if (!registry.has(x2)) continue;
    let { value: y2, order = defaultOrder, reverse: reverse3 = defaultReverse, reduce = defaultReduce, limit = defaultLimit } = maybeValue(options[x2]);
    const negate = y2?.startsWith("-");
    if (negate) y2 = y2.slice(1);
    order = order === void 0 ? negate !== (y2 === "width" || y2 === "height") ? descendingGroup : ascendingGroup : maybeOrder$1(order);
    if (reduce == null || reduce === false) continue;
    const X = x2 === "fx" || x2 === "fy" ? reindexFacetChannel(facets, facetChannels[x2]) : findScaleChannel(channels, x2);
    if (!X) throw new Error(`missing channel for scale: ${x2}`);
    const XV = X.value;
    const [lo = 0, hi = Infinity] = isIterable(limit) ? limit : limit < 0 ? [limit] : [0, limit];
    if (y2 == null) {
      X.domain = () => {
        let domain = Array.from(new InternSet(XV));
        if (reverse3) domain = domain.reverse();
        if (lo !== 0 || hi !== Infinity) domain = domain.slice(lo, hi);
        return domain;
      };
    } else {
      const YV = y2 === "data" ? data : y2 === "height" ? difference(channels, "y1", "y2") : y2 === "width" ? difference(channels, "x1", "x2") : values(channels, y2, y2 === "y" ? "y2" : y2 === "x" ? "x2" : void 0);
      const reducer2 = maybeReduce$1(reduce === true ? "max" : reduce, YV);
      X.domain = () => {
        let domain = rollups(
          range2(XV),
          (I) => reducer2.reduceIndex(I, YV),
          (i) => XV[i]
        );
        if (order) domain.sort(order);
        if (reverse3) domain.reverse();
        if (lo !== 0 || hi !== Infinity) domain = domain.slice(lo, hi);
        return domain.map(first);
      };
    }
  }
}
function findScaleChannel(channels, scale2) {
  for (const name in channels) {
    const channel = channels[name];
    if (channel.scale === scale2) return channel;
  }
}
function reindexFacetChannel(facets, channel) {
  const originalFacets = facets.original;
  if (originalFacets === facets) return channel;
  const V1 = channel.value;
  const V2 = channel.value = [];
  for (let i = 0; i < originalFacets.length; ++i) {
    const vi = V1[originalFacets[i][0]];
    for (const j of facets[i]) V2[j] = vi;
  }
  return channel;
}
function difference(channels, k1, k2) {
  const X12 = values(channels, k1);
  const X22 = values(channels, k2);
  return map$1(X22, (x2, i) => Math.abs(x2 - X12[i]), Float64Array);
}
function values(channels, name, alias) {
  let channel = channels[name];
  if (!channel && alias !== void 0) channel = channels[alias];
  if (channel) return channel.value;
  throw new Error(`missing channel: ${name}`);
}
function maybeOrder$1(order) {
  if (order == null || typeof order === "function") return order;
  switch (`${order}`.toLowerCase()) {
    case "ascending":
      return ascendingGroup;
    case "descending":
      return descendingGroup;
  }
  throw new Error(`invalid order: ${order}`);
}
function ascendingGroup([ak, av], [bk, bv]) {
  return ascendingDefined2(av, bv) || ascendingDefined2(ak, bk);
}
function descendingGroup([ak, av], [bk, bv]) {
  return descendingDefined(av, bv) || ascendingDefined2(ak, bk);
}
function getSource(channels, key) {
  let channel = channels[key];
  if (!channel) return;
  while (channel.source) channel = channel.source;
  return channel.source === null ? null : channel;
}
function createContext(options = {}) {
  const { document: document2 = typeof window !== "undefined" ? window.document : void 0, clip: clip2 } = options;
  return { document: document2, clip: maybeClip(clip2) };
}
function create(name, { document: document2 }) {
  return select(creator(name).call(document2.documentElement));
}
var warnings = 0;
var lastMessage;
function consumeWarnings() {
  const w = warnings;
  warnings = 0;
  lastMessage = void 0;
  return w;
}
function warn(message) {
  if (message === lastMessage) return;
  lastMessage = message;
  console.warn(message);
  ++warnings;
}
var pi4 = Math.PI;
var tau5 = 2 * pi4;
var defaultAspectRatio = 0.618;
function createProjection({
  projection: projection3,
  inset: globalInset = 0,
  insetTop = globalInset,
  insetRight = globalInset,
  insetBottom = globalInset,
  insetLeft = globalInset
} = {}, dimensions) {
  if (projection3 == null) return;
  if (typeof projection3.stream === "function") return exposeProjection(projection3);
  let options;
  let domain;
  let clip2 = "frame";
  if (isObject(projection3)) {
    let inset;
    ({
      type: projection3,
      domain,
      inset,
      insetTop = inset !== void 0 ? inset : insetTop,
      insetRight = inset !== void 0 ? inset : insetRight,
      insetBottom = inset !== void 0 ? inset : insetBottom,
      insetLeft = inset !== void 0 ? inset : insetLeft,
      clip: clip2 = clip2,
      ...options
    } = projection3);
    if (projection3 == null) return;
  }
  if (typeof projection3 !== "function") ({ type: projection3 } = namedProjection(projection3));
  const { width, height, marginLeft, marginRight, marginTop, marginBottom } = dimensions;
  const dx = width - marginLeft - marginRight - insetLeft - insetRight;
  const dy = height - marginTop - marginBottom - insetTop - insetBottom;
  projection3 = projection3?.({ width: dx, height: dy, clip: clip2, ...options });
  if (projection3 == null) return;
  clip2 = maybePostClip(clip2, marginLeft, marginTop, width - marginRight, height - marginBottom);
  let tx = marginLeft + insetLeft;
  let ty = marginTop + insetTop;
  let transform2;
  let k2 = 1;
  if (domain != null) {
    const [[x02, y02], [x12, y12]] = index(projection3).bounds(domain);
    k2 = Math.min(dx / (x12 - x02), dy / (y12 - y02));
    if (k2 > 0) {
      tx -= (k2 * (x02 + x12) - dx) / 2;
      ty -= (k2 * (y02 + y12) - dy) / 2;
      transform2 = scaleAndTranslate(k2, tx, ty);
    } else {
      warn(`Warning: the projection could not be fit to the specified domain; using the default scale.`);
    }
  }
  transform2 ??= translate(tx, ty);
  return {
    stream(s2) {
      return projection3.stream(transform2.stream(clip2(s2)));
    },
    apply(p) {
      let result = null;
      this.stream({ point: (...p2) => result = p2 }).point(...p);
      return result;
    },
    ...projection3.invert && {
      invert(p) {
        return projection3.invert(transform2.invert(p));
      }
    }
  };
}
function exposeProjection(projection3) {
  return typeof projection3 === "function" ? {
    stream: (s2) => projection3.stream(s2),
    apply: (p) => projection3(p),
    ...projection3.invert && { invert: (p) => projection3.invert(p) }
  } : projection3;
}
function namedProjection(projection3) {
  switch (`${projection3}`.toLowerCase()) {
    case "albers-usa":
      return scaleProjection(albersUsa, 0.7463, 0.4673);
    case "albers":
      return conicProjection2(albers, 0.7463, 0.4673);
    case "azimuthal-equal-area":
      return scaleProjection(azimuthalEqualArea, 4, 4);
    case "azimuthal-equidistant":
      return scaleProjection(azimuthalEquidistant, tau5, tau5);
    case "conic-conformal":
      return conicProjection2(conicConformal, tau5, tau5);
    case "conic-equal-area":
      return conicProjection2(conicEqualArea, 6.1702, 2.9781);
    case "conic-equidistant":
      return conicProjection2(conicEquidistant, 7.312, 3.6282);
    case "equal-earth":
      return scaleProjection(equalEarth, 5.4133, 2.6347);
    case "equirectangular":
      return scaleProjection(equirectangular, tau5, pi4);
    case "gnomonic":
      return scaleProjection(gnomonic, 3.4641, 3.4641);
    case "identity":
      return { type: identity6 };
    case "reflect-y":
      return { type: reflectY };
    case "mercator":
      return scaleProjection(mercator, tau5, tau5);
    case "orthographic":
      return scaleProjection(orthographic, 2, 2);
    case "stereographic":
      return scaleProjection(stereographic, 2, 2);
    case "transverse-mercator":
      return scaleProjection(transverseMercator, tau5, tau5);
    default:
      throw new Error(`unknown projection type: ${projection3}`);
  }
}
function maybePostClip(clip2, x12, y12, x2, y2) {
  if (clip2 === false || clip2 == null || typeof clip2 === "number") return (s2) => s2;
  if (clip2 === true) clip2 = "frame";
  switch (`${clip2}`.toLowerCase()) {
    case "frame":
      return clipRectangle(x12, y12, x2, y2);
    default:
      throw new Error(`unknown projection clip type: ${clip2}`);
  }
}
function scaleProjection(createProjection2, kx2, ky2) {
  return {
    type: ({ width, height, rotate, precision = 0.15, clip: clip2 }) => {
      const projection3 = createProjection2();
      if (precision != null) projection3.precision?.(precision);
      if (rotate != null) projection3.rotate?.(rotate);
      if (typeof clip2 === "number") projection3.clipAngle?.(clip2);
      if (width != null) {
        projection3.scale(Math.min(width / kx2, height / ky2));
        projection3.translate([width / 2, height / 2]);
      }
      return projection3;
    },
    aspectRatio: ky2 / kx2
  };
}
function conicProjection2(createProjection2, kx2, ky2) {
  const { type, aspectRatio } = scaleProjection(createProjection2, kx2, ky2);
  return {
    type: (options) => {
      const { parallels, domain, width, height } = options;
      const projection3 = type(options);
      if (parallels != null) {
        projection3.parallels(parallels);
        if (domain === void 0 && width != null) {
          projection3.fitSize([width, height], { type: "Sphere" });
        }
      }
      return projection3;
    },
    aspectRatio
  };
}
var identity6 = constant5({
  stream: (stream) => stream,
  invert: (point3) => point3
});
var reflectY = constant5({
  ...transform({
    point(x2, y2) {
      this.stream.point(x2, -y2);
    }
  }),
  invert: ([x2, y2]) => [x2, -y2]
});
function translate(tx, ty) {
  return tx === 0 && ty === 0 ? identity6() : {
    ...transform({
      point(x2, y2) {
        this.stream.point(x2 + tx, y2 + ty);
      }
    }),
    invert: ([x2, y2]) => [x2 - tx, y2 - ty]
  };
}
function scaleAndTranslate(k2, tx, ty) {
  return k2 === 1 ? translate(tx, ty) : {
    ...transform({
      point(x2, y2) {
        this.stream.point(x2 * k2 + tx, y2 * k2 + ty);
      }
    }),
    invert: ([x2, y2]) => [(x2 - tx) / k2, (y2 - ty) / k2]
  };
}
function project(cx, cy, values2, projection3) {
  const x2 = values2[cx];
  const y2 = values2[cy];
  const n = x2.length;
  const X = values2[cx] = new Float64Array(n).fill(NaN);
  const Y = values2[cy] = new Float64Array(n).fill(NaN);
  let i;
  const stream = projection3.stream({
    point(x3, y3) {
      X[i] = x3;
      Y[i] = y3;
    }
  });
  for (i = 0; i < n; ++i) {
    stream.point(x2[i], y2[i]);
  }
}
function hasProjection({ projection: projection3 } = {}) {
  if (projection3 == null) return false;
  if (typeof projection3.stream === "function") return true;
  if (isObject(projection3)) projection3 = projection3.type;
  return projection3 != null;
}
function projectionAspectRatio(projection3) {
  if (typeof projection3?.stream === "function") return defaultAspectRatio;
  if (isObject(projection3)) {
    let domain, options;
    ({ domain, type: projection3, ...options } = projection3);
    if (domain != null && projection3 != null) {
      const type = typeof projection3 === "string" ? namedProjection(projection3).type : projection3;
      const [[x02, y02], [x12, y12]] = index(type({ ...options, width: 100, height: 100 })).bounds(domain);
      const r = (y12 - y02) / (x12 - x02);
      return r && isFinite(r) ? r < 0.2 ? 0.2 : r > 5 ? 5 : r : defaultAspectRatio;
    }
  }
  if (projection3 == null) return;
  if (typeof projection3 !== "function") {
    const { aspectRatio } = namedProjection(projection3);
    if (aspectRatio) return aspectRatio;
  }
  return defaultAspectRatio;
}
function applyPosition(channels, scales, { projection: projection3 }) {
  const { x: x2, y: y2 } = channels;
  let position2 = {};
  if (x2) position2.x = x2;
  if (y2) position2.y = y2;
  position2 = valueObject(position2, scales);
  if (projection3 && x2?.scale === "x" && y2?.scale === "y") project("x", "y", position2, projection3);
  if (x2) position2.x = coerceNumbers(position2.x);
  if (y2) position2.y = coerceNumbers(position2.y);
  return position2;
}
function getGeometryChannels(channel) {
  const X = [];
  const Y = [];
  const x2 = { scale: "x", value: X };
  const y2 = { scale: "y", value: Y };
  const sink = {
    point(x3, y3) {
      X.push(x3);
      Y.push(y3);
    },
    lineStart() {
    },
    lineEnd() {
    },
    polygonStart() {
    },
    polygonEnd() {
    },
    sphere() {
    }
  };
  for (const object2 of channel.value) geoStream(object2, sink);
  return [x2, y2];
}
function xyProjection({ x: X, y: Y }) {
  if (X || Y) {
    X ??= (x2) => x2;
    Y ??= (y2) => y2;
    return transform({
      point(x2, y2) {
        this.stream.point(X(x2), Y(y2));
      }
    });
  }
}
var categoricalSchemes = /* @__PURE__ */ new Map([
  ["accent", Accent],
  ["category10", category10],
  ["dark2", Dark2],
  ["observable10", observable10],
  ["paired", Paired],
  ["pastel1", Pastel1],
  ["pastel2", Pastel2],
  ["set1", Set1],
  ["set2", Set2],
  ["set3", Set3],
  ["tableau10", Tableau10]
]);
function isCategoricalScheme(scheme2) {
  return scheme2 != null && categoricalSchemes.has(`${scheme2}`.toLowerCase());
}
var ordinalSchemes = new Map([
  ...categoricalSchemes,
  // diverging
  ["brbg", scheme11(scheme$q, BrBG)],
  ["prgn", scheme11(scheme$p, PRGn)],
  ["piyg", scheme11(scheme$o, PiYG)],
  ["puor", scheme11(scheme$n, PuOr)],
  ["rdbu", scheme11(scheme$m, RdBu)],
  ["rdgy", scheme11(scheme$l, RdGy)],
  ["rdylbu", scheme11(scheme$k, RdYlBu)],
  ["rdylgn", scheme11(scheme$j, RdYlGn)],
  ["spectral", scheme11(scheme$i, Spectral)],
  // reversed diverging (for temperature data)
  ["burd", scheme11r(scheme$m, RdBu)],
  ["buylrd", scheme11r(scheme$k, RdYlBu)],
  // sequential (single-hue)
  ["blues", scheme9(scheme$5, Blues)],
  ["greens", scheme9(scheme$4, Greens)],
  ["greys", scheme9(scheme$3, Greys)],
  ["oranges", scheme9(scheme, Oranges)],
  ["purples", scheme9(scheme$2, Purples)],
  ["reds", scheme9(scheme$1, Reds)],
  // sequential (multi-hue)
  ["turbo", schemei(turbo)],
  ["viridis", schemei(viridis)],
  ["magma", schemei(magma)],
  ["inferno", schemei(inferno)],
  ["plasma", schemei(plasma)],
  ["cividis", schemei(cividis)],
  ["cubehelix", schemei(cubehelix3)],
  ["warm", schemei(warm)],
  ["cool", schemei(cool)],
  ["bugn", scheme9(scheme$h, BuGn)],
  ["bupu", scheme9(scheme$g, BuPu)],
  ["gnbu", scheme9(scheme$f, GnBu)],
  ["orrd", scheme9(scheme$e, OrRd)],
  ["pubu", scheme9(scheme$c, PuBu)],
  ["pubugn", scheme9(scheme$d, PuBuGn)],
  ["purd", scheme9(scheme$b, PuRd)],
  ["rdpu", scheme9(scheme$a, RdPu)],
  ["ylgn", scheme9(scheme$8, YlGn)],
  ["ylgnbu", scheme9(scheme$9, YlGnBu)],
  ["ylorbr", scheme9(scheme$7, YlOrBr)],
  ["ylorrd", scheme9(scheme$6, YlOrRd)],
  // cyclical
  ["rainbow", schemeicyclical(rainbow)],
  ["sinebow", schemeicyclical(sinebow)]
]);
function scheme9(scheme2, interpolate) {
  return ({ length: n }) => {
    if (n === 1) return [scheme2[3][1]];
    if (n === 2) return [scheme2[3][1], scheme2[3][2]];
    n = Math.max(3, Math.floor(n));
    return n > 9 ? quantize(interpolate, n) : scheme2[n];
  };
}
function scheme11(scheme2, interpolate) {
  return ({ length: n }) => {
    if (n === 2) return [scheme2[3][0], scheme2[3][2]];
    n = Math.max(3, Math.floor(n));
    return n > 11 ? quantize(interpolate, n) : scheme2[n];
  };
}
function scheme11r(scheme2, interpolate) {
  return ({ length: n }) => {
    if (n === 2) return [scheme2[3][2], scheme2[3][0]];
    n = Math.max(3, Math.floor(n));
    return n > 11 ? quantize((t) => interpolate(1 - t), n) : scheme2[n].slice().reverse();
  };
}
function schemei(interpolate) {
  return ({ length: n }) => quantize(interpolate, Math.max(2, Math.floor(n)));
}
function schemeicyclical(interpolate) {
  return ({ length: n }) => quantize(interpolate, Math.floor(n) + 1).slice(0, -1);
}
function ordinalScheme(scheme2) {
  const s2 = `${scheme2}`.toLowerCase();
  if (!ordinalSchemes.has(s2)) throw new Error(`unknown ordinal scheme: ${s2}`);
  return ordinalSchemes.get(s2);
}
function ordinalRange(scheme2, length2) {
  const s2 = ordinalScheme(scheme2);
  const r = typeof s2 === "function" ? s2({ length: length2 }) : s2;
  return r.length !== length2 ? r.slice(0, length2) : r;
}
function maybeBooleanRange(domain, scheme2 = "greys") {
  const range3 = /* @__PURE__ */ new Set();
  const [f, t] = ordinalRange(scheme2, 2);
  for (const value2 of domain) {
    if (value2 == null) continue;
    if (value2 === true) range3.add(t);
    else if (value2 === false) range3.add(f);
    else return;
  }
  return [...range3];
}
var quantitativeSchemes = /* @__PURE__ */ new Map([
  // diverging
  ["brbg", BrBG],
  ["prgn", PRGn],
  ["piyg", PiYG],
  ["puor", PuOr],
  ["rdbu", RdBu],
  ["rdgy", RdGy],
  ["rdylbu", RdYlBu],
  ["rdylgn", RdYlGn],
  ["spectral", Spectral],
  // reversed diverging (for temperature data)
  ["burd", (t) => RdBu(1 - t)],
  ["buylrd", (t) => RdYlBu(1 - t)],
  // sequential (single-hue)
  ["blues", Blues],
  ["greens", Greens],
  ["greys", Greys],
  ["purples", Purples],
  ["reds", Reds],
  ["oranges", Oranges],
  // sequential (multi-hue)
  ["turbo", turbo],
  ["viridis", viridis],
  ["magma", magma],
  ["inferno", inferno],
  ["plasma", plasma],
  ["cividis", cividis],
  ["cubehelix", cubehelix3],
  ["warm", warm],
  ["cool", cool],
  ["bugn", BuGn],
  ["bupu", BuPu],
  ["gnbu", GnBu],
  ["orrd", OrRd],
  ["pubugn", PuBuGn],
  ["pubu", PuBu],
  ["purd", PuRd],
  ["rdpu", RdPu],
  ["ylgnbu", YlGnBu],
  ["ylgn", YlGn],
  ["ylorbr", YlOrBr],
  ["ylorrd", YlOrRd],
  // cyclical
  ["rainbow", rainbow],
  ["sinebow", sinebow]
]);
function quantitativeScheme(scheme2) {
  const s2 = `${scheme2}`.toLowerCase();
  if (!quantitativeSchemes.has(s2)) throw new Error(`unknown quantitative scheme: ${s2}`);
  return quantitativeSchemes.get(s2);
}
var divergingSchemes = /* @__PURE__ */ new Set([
  "brbg",
  "prgn",
  "piyg",
  "puor",
  "rdbu",
  "rdgy",
  "rdylbu",
  "rdylgn",
  "spectral",
  "burd",
  "buylrd"
]);
function isDivergingScheme(scheme2) {
  return scheme2 != null && divergingSchemes.has(`${scheme2}`.toLowerCase());
}
var flip = (i) => (t) => i(1 - t);
var unit2 = [0, 1];
var interpolators = /* @__PURE__ */ new Map([
  // numbers
  ["number", number3],
  // color spaces
  ["rgb", rgb2],
  ["hsl", hsl_default],
  ["hcl", hcl_default],
  ["lab", lab2]
]);
function maybeInterpolator(interpolate) {
  const i = `${interpolate}`.toLowerCase();
  if (!interpolators.has(i)) throw new Error(`unknown interpolator: ${i}`);
  return interpolators.get(i);
}
function createScaleQ(key, scale2, channels, {
  type,
  nice: nice3,
  clamp,
  zero: zero3,
  domain = inferAutoDomain(key, channels),
  unknown,
  round: round3,
  scheme: scheme2,
  interval,
  range: range3 = registry.get(key) === radius ? inferRadialRange(channels, domain) : registry.get(key) === length ? inferLengthRange(channels, domain) : registry.get(key) === opacity ? unit2 : void 0,
  interpolate = registry.get(key) === color2 ? scheme2 == null && range3 !== void 0 ? rgb2 : quantitativeScheme(scheme2 !== void 0 ? scheme2 : type === "cyclical" ? "rainbow" : "turbo") : round3 ? round : number3,
  reverse: reverse3
}) {
  domain = maybeRepeat(domain);
  interval = maybeRangeInterval(interval, type);
  if (type === "cyclical" || type === "sequential") type = "linear";
  if (typeof interpolate !== "function") interpolate = maybeInterpolator(interpolate);
  reverse3 = !!reverse3;
  if (range3 !== void 0) {
    const n = domain.length;
    const m = (range3 = maybeRepeat(range3)).length;
    if (n !== m) {
      if (interpolate.length === 1) throw new Error("invalid piecewise interpolator");
      interpolate = piecewise(interpolate, range3);
      range3 = void 0;
    }
  }
  if (interpolate.length === 1) {
    if (reverse3) {
      interpolate = flip(interpolate);
      reverse3 = false;
    }
    if (range3 === void 0) {
      range3 = Float64Array.from(domain, (_, i) => i / (domain.length - 1));
      if (range3.length === 2) range3 = unit2;
    }
    scale2.interpolate((range3 === unit2 ? constant5 : interpolatePiecewise)(interpolate));
  } else {
    scale2.interpolate(interpolate);
  }
  if (zero3) {
    const [min3, max2] = extent(domain);
    if (min3 > 0 || max2 < 0) {
      domain = slice4(domain);
      const o = orderof(domain) || 1;
      if (o === Math.sign(min3)) domain[0] = 0;
      else domain[domain.length - 1] = 0;
    }
  }
  if (reverse3) domain = reverse(domain);
  scale2.domain(domain).unknown(unknown);
  if (nice3) scale2.nice(maybeNice(nice3, type)), domain = scale2.domain();
  if (range3 !== void 0) scale2.range(range3);
  if (clamp) scale2.clamp(clamp);
  return { type, domain, range: range3, scale: scale2, interpolate, interval };
}
function maybeRepeat(values2) {
  values2 = arrayify2(values2);
  return values2.length >= 2 ? values2 : [values2[0], values2[0]];
}
function maybeNice(nice3, type) {
  return nice3 === true ? void 0 : typeof nice3 === "number" ? nice3 : maybeNiceInterval(nice3, type);
}
function createScaleLinear(key, channels, options) {
  return createScaleQ(key, linear2(), channels, options);
}
function createScaleSqrt(key, channels, options) {
  return createScalePow(key, channels, { ...options, exponent: 0.5 });
}
function createScalePow(key, channels, { exponent: exponent2 = 1, ...options }) {
  return createScaleQ(key, pow3().exponent(exponent2), channels, { ...options, type: "pow" });
}
function createScaleLog(key, channels, { base = 10, domain = inferLogDomain(channels), ...options }) {
  return createScaleQ(key, log2().base(base), channels, { ...options, domain });
}
function createScaleSymlog(key, channels, { constant: constant6 = 1, ...options }) {
  return createScaleQ(key, symlog().constant(constant6), channels, options);
}
function createScaleQuantile(key, channels, {
  range: range3,
  quantiles = range3 === void 0 ? 5 : (range3 = [...range3]).length,
  // deprecated; use n instead
  n = quantiles,
  scheme: scheme2 = "rdylbu",
  domain = inferQuantileDomain(channels),
  unknown,
  interpolate,
  reverse: reverse3
}) {
  if (range3 === void 0) {
    range3 = interpolate !== void 0 ? quantize(interpolate, n) : registry.get(key) === color2 ? ordinalRange(scheme2, n) : void 0;
  }
  if (domain.length > 0) {
    domain = quantile2(domain, range3 === void 0 ? { length: n } : range3).quantiles();
  }
  return createScaleThreshold(key, channels, { domain, range: range3, reverse: reverse3, unknown });
}
function createScaleQuantize(key, channels, {
  range: range3,
  n = range3 === void 0 ? 5 : (range3 = [...range3]).length,
  scheme: scheme2 = "rdylbu",
  domain = inferAutoDomain(key, channels),
  unknown,
  interpolate,
  reverse: reverse3
}) {
  const [min3, max2] = extent(domain);
  let thresholds;
  if (range3 === void 0) {
    thresholds = ticks(min3, max2, n);
    if (thresholds[0] <= min3) thresholds.splice(0, 1);
    if (thresholds[thresholds.length - 1] >= max2) thresholds.pop();
    n = thresholds.length + 1;
    range3 = interpolate !== void 0 ? quantize(interpolate, n) : registry.get(key) === color2 ? ordinalRange(scheme2, n) : void 0;
  } else {
    thresholds = quantize(number3(min3, max2), n + 1).slice(1, -1);
    if (min3 instanceof Date) thresholds = thresholds.map((x2) => new Date(x2));
  }
  if (orderof(arrayify2(domain)) < 0) thresholds.reverse();
  return createScaleThreshold(key, channels, { domain: thresholds, range: range3, reverse: reverse3, unknown });
}
function createScaleThreshold(key, channels, {
  domain = [0],
  // explicit thresholds in ascending order
  unknown,
  scheme: scheme2 = "rdylbu",
  interpolate,
  range: range3 = interpolate !== void 0 ? quantize(interpolate, domain.length + 1) : registry.get(key) === color2 ? ordinalRange(scheme2, domain.length + 1) : void 0,
  reverse: reverse3
}) {
  domain = arrayify2(domain);
  const sign3 = orderof(domain);
  if (!isNaN(sign3) && !isOrdered(domain, sign3)) throw new Error(`the ${key} scale has a non-monotonic domain`);
  if (reverse3) range3 = reverse(range3);
  return {
    type: "threshold",
    scale: threshold(sign3 < 0 ? reverse(domain) : domain, range3 === void 0 ? [] : range3).unknown(unknown),
    domain,
    range: range3
  };
}
function isOrdered(domain, sign3) {
  for (let i = 1, n = domain.length, d = domain[0]; i < n; ++i) {
    const s2 = descending(d, d = domain[i]);
    if (s2 !== 0 && s2 !== sign3) return false;
  }
  return true;
}
function createScaleIdentity(key) {
  return { type: "identity", scale: hasNumericRange(registry.get(key)) ? identity5() : (d) => d };
}
function inferDomain$1(channels, f = finite$1) {
  return channels.length ? [
    min(channels, ({ value: value2 }) => value2 === void 0 ? value2 : min(value2, f)),
    max(channels, ({ value: value2 }) => value2 === void 0 ? value2 : max(value2, f))
  ] : [0, 1];
}
function inferAutoDomain(key, channels) {
  const type = registry.get(key);
  return (type === radius || type === opacity || type === length ? inferZeroDomain : inferDomain$1)(channels);
}
function inferZeroDomain(channels) {
  return [0, channels.length ? max(channels, ({ value: value2 }) => value2 === void 0 ? value2 : max(value2, finite$1)) : 1];
}
function inferRadialRange(channels, domain) {
  const hint = channels.find(({ radius: radius2 }) => radius2 !== void 0);
  if (hint !== void 0) return [0, hint.radius];
  const h25 = quantile(channels, 0.5, ({ value: value2 }) => value2 === void 0 ? NaN : quantile(value2, 0.25, positive));
  const range3 = domain.map((d) => 3 * Math.sqrt(d / h25));
  const k2 = 30 / max(range3);
  return k2 < 1 ? range3.map((r) => r * k2) : range3;
}
function inferLengthRange(channels, domain) {
  const h50 = median(channels, ({ value: value2 }) => value2 === void 0 ? NaN : median(value2, Math.abs));
  const range3 = domain.map((d) => 12 * d / h50);
  const k2 = 60 / max(range3);
  return k2 < 1 ? range3.map((r) => r * k2) : range3;
}
function inferLogDomain(channels) {
  for (const { value: value2 } of channels) {
    if (value2 !== void 0) {
      for (let v of value2) {
        if (v > 0) return inferDomain$1(channels, positive);
        if (v < 0) return inferDomain$1(channels, negative);
      }
    }
  }
  return [1, 10];
}
function inferQuantileDomain(channels) {
  const domain = [];
  for (const { value: value2 } of channels) {
    if (value2 === void 0) continue;
    for (const v of value2) domain.push(v);
  }
  return domain;
}
function interpolatePiecewise(interpolate) {
  return (i, j) => (t) => interpolate(i + t * (j - i));
}
function createScaleD(key, scale2, transform2, channels, {
  type,
  nice: nice3,
  clamp,
  domain = inferDomain$1(channels),
  unknown,
  pivot = 0,
  scheme: scheme2,
  range: range3,
  symmetric = true,
  interpolate = registry.get(key) === color2 ? scheme2 == null && range3 !== void 0 ? rgb2 : quantitativeScheme(scheme2 !== void 0 ? scheme2 : "rdbu") : number3,
  reverse: reverse3
}) {
  pivot = +pivot;
  domain = arrayify2(domain);
  let [min3, max2] = domain;
  if (domain.length > 2) warn(`Warning: the diverging ${key} scale domain contains extra elements.`);
  if (descending(min3, max2) < 0) [min3, max2] = [max2, min3], reverse3 = !reverse3;
  min3 = Math.min(min3, pivot);
  max2 = Math.max(max2, pivot);
  if (typeof interpolate !== "function") {
    interpolate = maybeInterpolator(interpolate);
  }
  if (range3 !== void 0) {
    interpolate = interpolate.length === 1 ? interpolatePiecewise(interpolate)(...range3) : piecewise(interpolate, range3);
  }
  if (reverse3) interpolate = flip(interpolate);
  if (symmetric) {
    const mid2 = transform2.apply(pivot);
    const mindelta = mid2 - transform2.apply(min3);
    const maxdelta = transform2.apply(max2) - mid2;
    if (mindelta < maxdelta) min3 = transform2.invert(mid2 - maxdelta);
    else if (mindelta > maxdelta) max2 = transform2.invert(mid2 + mindelta);
  }
  scale2.domain([min3, pivot, max2]).unknown(unknown).interpolator(interpolate);
  if (clamp) scale2.clamp(clamp);
  if (nice3) scale2.nice(nice3);
  return { type, domain: [min3, max2], pivot, interpolate, scale: scale2 };
}
function createScaleDiverging(key, channels, options) {
  return createScaleD(key, diverging(), transformIdentity, channels, options);
}
function createScaleDivergingSqrt(key, channels, options) {
  return createScaleDivergingPow(key, channels, { ...options, exponent: 0.5 });
}
function createScaleDivergingPow(key, channels, { exponent: exponent2 = 1, ...options }) {
  return createScaleD(key, divergingPow().exponent(exponent2 = +exponent2), transformPow2(exponent2), channels, {
    ...options,
    type: "diverging-pow"
  });
}
function createScaleDivergingLog(key, channels, { base = 10, pivot = 1, domain = inferDomain$1(channels, pivot < 0 ? negative : positive), ...options }) {
  return createScaleD(key, divergingLog().base(base = +base), transformLog2, channels, {
    domain,
    pivot,
    ...options
  });
}
function createScaleDivergingSymlog(key, channels, { constant: constant6 = 1, ...options }) {
  return createScaleD(
    key,
    divergingSymlog().constant(constant6 = +constant6),
    transformSymlog2(constant6),
    channels,
    options
  );
}
var transformIdentity = {
  apply(x2) {
    return x2;
  },
  invert(x2) {
    return x2;
  }
};
var transformLog2 = {
  apply: Math.log,
  invert: Math.exp
};
var transformSqrt2 = {
  apply(x2) {
    return Math.sign(x2) * Math.sqrt(Math.abs(x2));
  },
  invert(x2) {
    return Math.sign(x2) * (x2 * x2);
  }
};
function transformPow2(exponent2) {
  return exponent2 === 0.5 ? transformSqrt2 : {
    apply(x2) {
      return Math.sign(x2) * Math.pow(Math.abs(x2), exponent2);
    },
    invert(x2) {
      return Math.sign(x2) * Math.pow(Math.abs(x2), 1 / exponent2);
    }
  };
}
function transformSymlog2(constant6) {
  return {
    apply(x2) {
      return Math.sign(x2) * Math.log1p(Math.abs(x2 / constant6));
    },
    invert(x2) {
      return Math.sign(x2) * Math.expm1(Math.abs(x2)) * constant6;
    }
  };
}
function createScaleT(key, scale2, channels, options) {
  return createScaleQ(key, scale2, channels, options);
}
function createScaleTime(key, channels, options) {
  return createScaleT(key, time(), channels, options);
}
function createScaleUtc(key, channels, options) {
  return createScaleT(key, utcTime(), channels, options);
}
var ordinalImplicit = Symbol("ordinal");
function createScaleO(key, scale2, channels, { type, interval, domain, range: range3, reverse: reverse3, hint }) {
  interval = maybeRangeInterval(interval, type);
  if (domain === void 0) domain = inferDomain(channels, interval, key);
  if (type === "categorical" || type === ordinalImplicit) type = "ordinal";
  if (reverse3) domain = reverse(domain);
  domain = scale2.domain(domain).domain();
  if (range3 !== void 0) {
    if (typeof range3 === "function") range3 = range3(domain);
    scale2.range(range3);
  }
  return { type, domain, range: range3, scale: scale2, hint, interval };
}
function createScaleOrdinal(key, channels, { type, interval, domain, range: range3, scheme: scheme2, unknown, ...options }) {
  interval = maybeRangeInterval(interval, type);
  if (domain === void 0) domain = inferDomain(channels, interval, key);
  let hint;
  if (registry.get(key) === symbol) {
    hint = inferSymbolHint(channels);
    range3 = range3 === void 0 ? inferSymbolRange(hint) : map$1(range3, maybeSymbol);
  } else if (registry.get(key) === color2) {
    if (range3 === void 0 && (type === "ordinal" || type === ordinalImplicit)) {
      range3 = maybeBooleanRange(domain, scheme2);
      if (range3 !== void 0) scheme2 = void 0;
    }
    if (scheme2 === void 0 && range3 === void 0) {
      scheme2 = type === "ordinal" ? "turbo" : "observable10";
    }
    if (scheme2 !== void 0) {
      if (range3 !== void 0) {
        const interpolate = quantitativeScheme(scheme2);
        const t03 = range3[0];
        const dt = range3[1] - range3[0];
        range3 = ({ length: n }) => quantize((t) => interpolate(t03 + dt * t), n);
      } else {
        range3 = ordinalScheme(scheme2);
      }
    }
  } else if (registry.get(key) === opacity) {
    if (range3 === void 0) {
      range3 = ({ length: n }) => quantize((t) => t, n);
    }
  }
  if (unknown === implicit) {
    throw new Error(`implicit unknown on ${key} scale is not supported`);
  }
  return createScaleO(key, ordinal().unknown(unknown), channels, { ...options, type, domain, range: range3, hint });
}
function createScalePoint(key, channels, { align = 0.5, padding = 0.5, ...options }) {
  return maybeRound$1(point().align(align).padding(padding), channels, options, key);
}
function createScaleBand(key, channels, {
  align = 0.5,
  padding = 0.1,
  paddingInner = padding,
  paddingOuter = key === "fx" || key === "fy" ? 0 : padding,
  ...options
}) {
  return maybeRound$1(
    band().align(align).paddingInner(paddingInner).paddingOuter(paddingOuter),
    channels,
    options,
    key
  );
}
function maybeRound$1(scale2, channels, options, key) {
  let { round: round3 } = options;
  if (round3 !== void 0) scale2.round(round3 = !!round3);
  scale2 = createScaleO(key, scale2, channels, options);
  scale2.round = round3;
  return scale2;
}
function inferDomain(channels, interval, key) {
  const values2 = new InternSet();
  for (const { value: value2, domain } of channels) {
    if (domain !== void 0) return domain();
    if (value2 === void 0) continue;
    for (const v of value2) values2.add(v);
  }
  if (key === "opacity") values2.add(0);
  if (interval !== void 0) {
    const [min3, max2] = extent(values2).map(interval.floor, interval);
    return interval.range(min3, interval.offset(max2));
  }
  if (values2.size > 1e4 && registry.get(key) === position$1) {
    throw new Error(`implicit ordinal domain of ${key} scale has more than 10,000 values`);
  }
  return sort(values2, ascendingDefined2);
}
function inferHint(channels, key) {
  let value2;
  for (const { hint } of channels) {
    const candidate = hint?.[key];
    if (candidate === void 0) continue;
    if (value2 === void 0) value2 = candidate;
    else if (value2 !== candidate) return;
  }
  return value2;
}
function inferSymbolHint(channels) {
  return {
    fill: inferHint(channels, "fill"),
    stroke: inferHint(channels, "stroke")
  };
}
function inferSymbolRange(hint) {
  return isNoneish(hint.fill) ? symbolsStroke : symbolsFill;
}
function createScales(channelsByScale, {
  label: globalLabel,
  inset: globalInset = 0,
  insetTop: globalInsetTop = globalInset,
  insetRight: globalInsetRight = globalInset,
  insetBottom: globalInsetBottom = globalInset,
  insetLeft: globalInsetLeft = globalInset,
  round: round3,
  nice: nice3,
  clamp,
  zero: zero3,
  align,
  padding,
  projection: projection3,
  facet: { label: facetLabel = globalLabel } = {},
  ...options
} = {}) {
  const scales = {};
  for (const [key, channels] of channelsByScale) {
    const scaleOptions = options[key];
    const scale2 = createScale(key, channels, {
      round: registry.get(key) === position$1 ? round3 : void 0,
      // only for position
      nice: nice3,
      clamp,
      zero: zero3,
      align,
      padding,
      projection: projection3,
      ...scaleOptions
    });
    if (scale2) {
      let {
        label = key === "fx" || key === "fy" ? facetLabel : globalLabel,
        percent,
        transform: transform2,
        inset,
        insetTop = inset !== void 0 ? inset : key === "y" ? globalInsetTop : 0,
        // not fy
        insetRight = inset !== void 0 ? inset : key === "x" ? globalInsetRight : 0,
        // not fx
        insetBottom = inset !== void 0 ? inset : key === "y" ? globalInsetBottom : 0,
        // not fy
        insetLeft = inset !== void 0 ? inset : key === "x" ? globalInsetLeft : 0
        // not fx
      } = scaleOptions || {};
      if (transform2 == null) transform2 = void 0;
      else if (typeof transform2 !== "function") throw new Error("invalid scale transform; not a function");
      scale2.percent = !!percent;
      scale2.label = label === void 0 ? inferScaleLabel(channels, scale2) : label;
      scale2.transform = transform2;
      if (key === "x" || key === "fx") {
        scale2.insetLeft = +insetLeft;
        scale2.insetRight = +insetRight;
      } else if (key === "y" || key === "fy") {
        scale2.insetTop = +insetTop;
        scale2.insetBottom = +insetBottom;
      }
      scales[key] = scale2;
    }
  }
  return scales;
}
function createScaleFunctions(descriptors) {
  const scales = {};
  const scaleFunctions = { scales };
  for (const [key, descriptor] of Object.entries(descriptors)) {
    const { scale: scale2, type, interval, label } = descriptor;
    scales[key] = exposeScale(descriptor);
    scaleFunctions[key] = scale2;
    scale2.type = type;
    if (interval != null) scale2.interval = interval;
    if (label != null) scale2.label = label;
  }
  return scaleFunctions;
}
function autoScaleRange(scales, dimensions) {
  const { x: x2, y: y2, fx, fy } = scales;
  const superdimensions = fx || fy ? outerDimensions(dimensions) : dimensions;
  if (fx) autoScaleRangeX(fx, superdimensions);
  if (fy) autoScaleRangeY(fy, superdimensions);
  const subdimensions = fx || fy ? innerDimensions(scales, dimensions) : dimensions;
  if (x2) autoScaleRangeX(x2, subdimensions);
  if (y2) autoScaleRangeY(y2, subdimensions);
}
function inferScaleLabel(channels = [], scale2) {
  let label;
  for (const { label: l } of channels) {
    if (l === void 0) continue;
    if (label === void 0) label = l;
    else if (label !== l) return;
  }
  if (label === void 0) return;
  if (!isOrdinalScale(scale2) && scale2.percent) label = `${label} (%)`;
  return { inferred: true, toString: () => label };
}
function inferScaleOrder(scale2) {
  return Math.sign(orderof(scale2.domain())) * Math.sign(orderof(scale2.range()));
}
function outerDimensions(dimensions) {
  const {
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    width,
    height,
    facet: {
      marginTop: facetMarginTop,
      marginRight: facetMarginRight,
      marginBottom: facetMarginBottom,
      marginLeft: facetMarginLeft
    }
  } = dimensions;
  return {
    marginTop: Math.max(marginTop, facetMarginTop),
    marginRight: Math.max(marginRight, facetMarginRight),
    marginBottom: Math.max(marginBottom, facetMarginBottom),
    marginLeft: Math.max(marginLeft, facetMarginLeft),
    width,
    height
  };
}
function innerDimensions({ fx, fy }, dimensions) {
  const { marginTop, marginRight, marginBottom, marginLeft, width, height } = outerDimensions(dimensions);
  return {
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    width: fx ? fx.scale.bandwidth() + marginLeft + marginRight : width,
    height: fy ? fy.scale.bandwidth() + marginTop + marginBottom : height,
    facet: { width, height }
  };
}
function autoScaleRangeX(scale2, dimensions) {
  if (scale2.range === void 0) {
    const { insetLeft, insetRight } = scale2;
    const { width, marginLeft = 0, marginRight = 0 } = dimensions;
    const left2 = marginLeft + insetLeft;
    const right2 = width - marginRight - insetRight;
    scale2.range = [left2, Math.max(left2, right2)];
    if (!isOrdinalScale(scale2)) scale2.range = piecewiseRange(scale2);
    scale2.scale.range(scale2.range);
  }
  autoScaleRound(scale2);
}
function autoScaleRangeY(scale2, dimensions) {
  if (scale2.range === void 0) {
    const { insetTop, insetBottom } = scale2;
    const { height, marginTop = 0, marginBottom = 0 } = dimensions;
    const top2 = marginTop + insetTop;
    const bottom2 = height - marginBottom - insetBottom;
    scale2.range = [Math.max(top2, bottom2), top2];
    if (!isOrdinalScale(scale2)) scale2.range = piecewiseRange(scale2);
    else scale2.range.reverse();
    scale2.scale.range(scale2.range);
  }
  autoScaleRound(scale2);
}
function autoScaleRound(scale2) {
  if (scale2.round === void 0 && isBandScale(scale2) && roundError(scale2) <= 30) {
    scale2.scale.round(true);
  }
}
function roundError({ scale: scale2 }) {
  const n = scale2.domain().length;
  const [start, stop] = scale2.range();
  const paddingInner = scale2.paddingInner ? scale2.paddingInner() : 1;
  const paddingOuter = scale2.paddingOuter ? scale2.paddingOuter() : scale2.padding();
  const m = n - paddingInner;
  const step2 = Math.abs(stop - start) / Math.max(1, m + paddingOuter * 2);
  return (step2 - Math.floor(step2)) * m;
}
function piecewiseRange(scale2) {
  const length2 = scale2.scale.domain().length + isThresholdScale(scale2);
  if (!(length2 > 2)) return scale2.range;
  const [start, end] = scale2.range;
  return Array.from({ length: length2 }, (_, i) => start + i / (length2 - 1) * (end - start));
}
function normalizeScale(key, scale2, hint) {
  return createScale(key, hint === void 0 ? void 0 : [{ hint }], { ...scale2 });
}
function createScale(key, channels = [], options = {}) {
  const type = inferScaleType(key, channels, options);
  if (options.type === void 0 && options.domain === void 0 && options.range === void 0 && options.interval == null && key !== "fx" && key !== "fy" && isOrdinalScale({ type })) {
    const values2 = channels.map(({ value: value2 }) => value2).filter((value2) => value2 !== void 0);
    if (values2.some(isTemporal))
      warn(
        `Warning: some data associated with the ${key} scale are dates. Dates are typically associated with a "utc" or "time" scale rather than a "${formatScaleType(
          type
        )}" scale. If you are using a bar mark, you probably want a rect mark with the interval option instead; if you are using a group transform, you probably want a bin transform instead. If you want to treat this data as ordinal, you can specify the interval of the ${key} scale (e.g., d3.utcDay), or you can suppress this warning by setting the type of the ${key} scale to "${formatScaleType(
          type
        )}".`
      );
    else if (values2.some(isTemporalString))
      warn(
        `Warning: some data associated with the ${key} scale are strings that appear to be dates (e.g., YYYY-MM-DD). If these strings represent dates, you should parse them to Date objects. Dates are typically associated with a "utc" or "time" scale rather than a "${formatScaleType(
          type
        )}" scale. If you are using a bar mark, you probably want a rect mark with the interval option instead; if you are using a group transform, you probably want a bin transform instead. If you want to treat this data as ordinal, you can suppress this warning by setting the type of the ${key} scale to "${formatScaleType(
          type
        )}".`
      );
    else if (values2.some(isNumericString))
      warn(
        `Warning: some data associated with the ${key} scale are strings that appear to be numbers. If these strings represent numbers, you should parse or coerce them to numbers. Numbers are typically associated with a "linear" scale rather than a "${formatScaleType(
          type
        )}" scale. If you want to treat this data as ordinal, you can specify the interval of the ${key} scale (e.g., 1 for integers), or you can suppress this warning by setting the type of the ${key} scale to "${formatScaleType(
          type
        )}".`
      );
  }
  options.type = type;
  switch (type) {
    case "diverging":
    case "diverging-sqrt":
    case "diverging-pow":
    case "diverging-log":
    case "diverging-symlog":
    case "cyclical":
    case "sequential":
    case "linear":
    case "sqrt":
    case "threshold":
    case "quantile":
    case "pow":
    case "log":
    case "symlog":
      options = coerceType(channels, options, coerceNumbers);
      break;
    case "identity":
      switch (registry.get(key)) {
        case position$1:
          options = coerceType(channels, options, coerceNumbers);
          break;
        case symbol:
          options = coerceType(channels, options, coerceSymbols);
          break;
      }
      break;
    case "utc":
    case "time":
      options = coerceType(channels, options, coerceDates);
      break;
  }
  switch (type) {
    case "diverging":
      return createScaleDiverging(key, channels, options);
    case "diverging-sqrt":
      return createScaleDivergingSqrt(key, channels, options);
    case "diverging-pow":
      return createScaleDivergingPow(key, channels, options);
    case "diverging-log":
      return createScaleDivergingLog(key, channels, options);
    case "diverging-symlog":
      return createScaleDivergingSymlog(key, channels, options);
    case "categorical":
    case "ordinal":
    case ordinalImplicit:
      return createScaleOrdinal(key, channels, options);
    case "cyclical":
    case "sequential":
    case "linear":
      return createScaleLinear(key, channels, options);
    case "sqrt":
      return createScaleSqrt(key, channels, options);
    case "threshold":
      return createScaleThreshold(key, channels, options);
    case "quantile":
      return createScaleQuantile(key, channels, options);
    case "quantize":
      return createScaleQuantize(key, channels, options);
    case "pow":
      return createScalePow(key, channels, options);
    case "log":
      return createScaleLog(key, channels, options);
    case "symlog":
      return createScaleSymlog(key, channels, options);
    case "utc":
      return createScaleUtc(key, channels, options);
    case "time":
      return createScaleTime(key, channels, options);
    case "point":
      return createScalePoint(key, channels, options);
    case "band":
      return createScaleBand(key, channels, options);
    case "identity":
      return createScaleIdentity(key);
    case void 0:
      return;
    default:
      throw new Error(`unknown scale type: ${type}`);
  }
}
function formatScaleType(type) {
  return typeof type === "symbol" ? type.description : type;
}
function maybeScaleType(type) {
  return typeof type === "string" ? `${type}`.toLowerCase() : type;
}
var typeProjection = { toString: () => "projection" };
function inferScaleType(key, channels, { type, domain, range: range3, scheme: scheme2, pivot, projection: projection3 }) {
  type = maybeScaleType(type);
  if (key === "fx" || key === "fy") return "band";
  if ((key === "x" || key === "y") && projection3 != null) type = typeProjection;
  for (const channel of channels) {
    const t = maybeScaleType(channel.type);
    if (t === void 0) continue;
    else if (type === void 0) type = t;
    else if (type !== t) throw new Error(`scale incompatible with channel: ${type} !== ${t}`);
  }
  if (type === typeProjection) return;
  if (type !== void 0) return type;
  if (domain === void 0 && !channels.some(({ value: value2 }) => value2 !== void 0)) return;
  const kind = registry.get(key);
  if (kind === radius) return "sqrt";
  if (kind === opacity || kind === length) return "linear";
  if (kind === symbol) return "ordinal";
  const n = (domain ?? range3)?.length;
  if (n < 2 || n > 2) return asOrdinalType(kind);
  if (domain !== void 0) {
    if (isOrdinal(domain)) return asOrdinalType(kind);
    if (isTemporal(domain)) return "utc";
  } else {
    const values2 = channels.map(({ value: value2 }) => value2).filter((value2) => value2 !== void 0);
    if (values2.some(isOrdinal)) return asOrdinalType(kind);
    if (values2.some(isTemporal)) return "utc";
  }
  if (kind === color2) {
    if (pivot != null || isDivergingScheme(scheme2)) return "diverging";
    if (isCategoricalScheme(scheme2)) return "categorical";
  }
  return "linear";
}
function asOrdinalType(kind) {
  switch (kind) {
    case position$1:
      return "point";
    case color2:
      return ordinalImplicit;
    default:
      return "ordinal";
  }
}
function isOrdinalScale({ type }) {
  return type === "ordinal" || type === "point" || type === "band" || type === ordinalImplicit;
}
function isThresholdScale({ type }) {
  return type === "threshold";
}
function isBandScale({ type }) {
  return type === "point" || type === "band";
}
function isCollapsed(scale2) {
  if (scale2 === void 0) return true;
  const domain = scale2.domain();
  const value2 = scale2(domain[0]);
  for (let i = 1, n = domain.length; i < n; ++i) {
    if (scale2(domain[i]) - value2) {
      return false;
    }
  }
  return true;
}
function coerceType(channels, { domain, ...options }, coerceValues) {
  for (const c3 of channels) {
    if (c3.value !== void 0) {
      if (domain === void 0) domain = c3.value?.domain;
      c3.value = coerceValues(c3.value);
    }
  }
  return {
    domain: domain === void 0 ? domain : coerceValues(domain),
    ...options
  };
}
function coerceSymbols(values2) {
  return map$1(values2, maybeSymbol);
}
function scale(options = {}) {
  let scale2;
  for (const key in options) {
    if (!registry.has(key)) continue;
    if (!isScaleOptions(options[key])) continue;
    if (scale2 !== void 0) throw new Error("ambiguous scale definition; multiple scales found");
    scale2 = exposeScale(normalizeScale(key, options[key]));
  }
  if (scale2 === void 0) throw new Error("invalid scale definition; no scale found");
  return scale2;
}
function exposeScales(scales, context) {
  return (key) => {
    if (!registry.has(key = `${key}`)) throw new Error(`unknown scale: ${key}`);
    return (key === "projection" ? context : scales)[key];
  };
}
function exposeScale({ scale: scale2, type, domain, range: range3, interpolate, interval, transform: transform2, percent, pivot }) {
  if (type === "identity") return { type: "identity", apply: (d) => d, invert: (d) => d };
  const unknown = scale2.unknown ? scale2.unknown() : void 0;
  return {
    type,
    domain: slice4(domain),
    // defensive copy
    ...range3 !== void 0 && { range: slice4(range3) },
    // defensive copy
    ...transform2 !== void 0 && { transform: transform2 },
    ...percent && { percent },
    // only exposed if truthy
    ...unknown !== void 0 && { unknown },
    ...interval !== void 0 && { interval },
    // quantitative
    ...interpolate !== void 0 && { interpolate },
    ...scale2.clamp && { clamp: scale2.clamp() },
    // diverging (always asymmetric; we never want to apply the symmetric transform twice)
    ...pivot !== void 0 && { pivot, symmetric: false },
    // log, diverging-log
    ...scale2.base && { base: scale2.base() },
    // pow, diverging-pow
    ...scale2.exponent && { exponent: scale2.exponent() },
    // symlog, diverging-symlog
    ...scale2.constant && { constant: scale2.constant() },
    // band, point
    ...scale2.align && { align: scale2.align(), round: scale2.round() },
    ...scale2.padding && (scale2.paddingInner ? { paddingInner: scale2.paddingInner(), paddingOuter: scale2.paddingOuter() } : { padding: scale2.padding() }),
    ...scale2.bandwidth && { bandwidth: scale2.bandwidth(), step: scale2.step() },
    // utilities
    apply: (t) => scale2(t),
    ...scale2.invert && { invert: (t) => scale2.invert(t) }
  };
}
var unset = Symbol("unset");
function memoize1(compute) {
  return (compute.length === 1 ? memoize1Arg : memoize1Args)(compute);
}
function memoize1Arg(compute) {
  let cacheValue;
  let cacheKey = unset;
  return (key) => {
    if (!Object.is(cacheKey, key)) {
      cacheKey = key;
      cacheValue = compute(key);
    }
    return cacheValue;
  };
}
function memoize1Args(compute) {
  let cacheValue, cacheKeys;
  return (...keys) => {
    if (cacheKeys?.length !== keys.length || cacheKeys.some((k2, i) => !Object.is(k2, keys[i]))) {
      cacheKeys = keys;
      cacheValue = compute(...keys);
    }
    return cacheValue;
  };
}
var numberFormat = memoize1((locale3) => {
  return new Intl.NumberFormat(locale3);
});
var monthFormat = memoize1((locale3, month) => {
  return new Intl.DateTimeFormat(locale3, { timeZone: "UTC", ...month && { month } });
});
var weekdayFormat = memoize1((locale3, weekday) => {
  return new Intl.DateTimeFormat(locale3, { timeZone: "UTC", ...weekday && { weekday } });
});
function formatNumber(locale3 = "en-US") {
  const format3 = numberFormat(locale3);
  return (i) => i != null && !isNaN(i) ? format3.format(i) : void 0;
}
function formatMonth(locale3 = "en-US", format3 = "short") {
  const fmt = monthFormat(locale3, format3);
  return (i) => i != null && !isNaN(i = +new Date(Date.UTC(2e3, +i))) ? fmt.format(i) : void 0;
}
function formatWeekday(locale3 = "en-US", format3 = "short") {
  const fmt = weekdayFormat(locale3, format3);
  return (i) => i != null && !isNaN(i = +new Date(Date.UTC(2001, 0, +i))) ? fmt.format(i) : void 0;
}
function formatIsoDate(date3) {
  return format2(date3, "Invalid Date");
}
function formatAuto(locale3 = "en-US") {
  const number6 = formatNumber(locale3);
  return (v) => (v instanceof Date ? formatIsoDate : typeof v === "number" ? number6 : string2)(v);
}
var formatDefault = formatAuto();
var offset = typeof window !== "undefined" && !(window.devicePixelRatio > 1) ? 0.5 : 0;
var nextClipId = 0;
var nextFilterId = 0;
var nextPatternId = 0;
function getClipId() {
  return `plot-clip-${++nextClipId}`;
}
function getFilterId() {
  return `plot-filter-${++nextFilterId}`;
}
function getPatternId() {
  return `plot-pattern-${++nextPatternId}`;
}
function styles(mark, {
  title,
  href,
  ariaLabel: variaLabel,
  ariaDescription,
  ariaHidden,
  target,
  fill,
  fillOpacity,
  stroke,
  strokeWidth,
  strokeOpacity,
  strokeLinejoin,
  strokeLinecap,
  strokeMiterlimit,
  strokeDasharray,
  strokeDashoffset,
  opacity: opacity2,
  mixBlendMode,
  imageFilter,
  paintOrder,
  pointerEvents,
  shapeRendering,
  channels
}, {
  ariaLabel: cariaLabel,
  fill: defaultFill = "currentColor",
  fillOpacity: defaultFillOpacity,
  stroke: defaultStroke = "none",
  strokeOpacity: defaultStrokeOpacity,
  strokeWidth: defaultStrokeWidth,
  strokeLinecap: defaultStrokeLinecap,
  strokeLinejoin: defaultStrokeLinejoin,
  strokeMiterlimit: defaultStrokeMiterlimit,
  paintOrder: defaultPaintOrder
}) {
  if (defaultFill === null) {
    fill = null;
    fillOpacity = null;
  }
  if (defaultStroke === null) {
    stroke = null;
    strokeOpacity = null;
  }
  if (isNoneish(defaultFill)) {
    if (!isNoneish(defaultStroke) && (!isNoneish(fill) || channels?.fill)) defaultStroke = "none";
  } else {
    if (isNoneish(defaultStroke) && (!isNoneish(stroke) || channels?.stroke)) defaultFill = "none";
  }
  const [vfill, cfill] = maybeColorChannel(fill, defaultFill);
  const [vfillOpacity, cfillOpacity] = maybeNumberChannel(fillOpacity, defaultFillOpacity);
  const [vstroke, cstroke] = maybeColorChannel(stroke, defaultStroke);
  const [vstrokeOpacity, cstrokeOpacity] = maybeNumberChannel(strokeOpacity, defaultStrokeOpacity);
  const [vopacity, copacity] = maybeNumberChannel(opacity2);
  if (!isNone(cstroke)) {
    if (strokeWidth === void 0) strokeWidth = defaultStrokeWidth;
    if (strokeLinecap === void 0) strokeLinecap = defaultStrokeLinecap;
    if (strokeLinejoin === void 0) strokeLinejoin = defaultStrokeLinejoin;
    if (strokeMiterlimit === void 0 && !isRound(strokeLinejoin)) strokeMiterlimit = defaultStrokeMiterlimit;
    if (!isNone(cfill) && paintOrder === void 0) paintOrder = defaultPaintOrder;
  }
  const [vstrokeWidth, cstrokeWidth] = maybeNumberChannel(strokeWidth);
  if (defaultFill !== null) {
    mark.fill = impliedString(cfill, "currentColor");
    mark.fillOpacity = impliedNumber(cfillOpacity, 1);
  }
  if (defaultStroke !== null) {
    mark.stroke = impliedString(cstroke, "none");
    mark.strokeWidth = impliedNumber(cstrokeWidth, 1);
    mark.strokeOpacity = impliedNumber(cstrokeOpacity, 1);
    mark.strokeLinejoin = impliedString(strokeLinejoin, "miter");
    mark.strokeLinecap = impliedString(strokeLinecap, "butt");
    mark.strokeMiterlimit = impliedNumber(strokeMiterlimit, 4);
    mark.strokeDasharray = impliedString(strokeDasharray, "none");
    mark.strokeDashoffset = impliedString(strokeDashoffset, "0");
  }
  mark.target = string2(target);
  mark.ariaLabel = string2(cariaLabel);
  mark.ariaDescription = string2(ariaDescription);
  mark.ariaHidden = string2(ariaHidden);
  mark.opacity = impliedNumber(copacity, 1);
  mark.mixBlendMode = impliedString(mixBlendMode, "normal");
  mark.imageFilter = impliedString(imageFilter, "none");
  mark.paintOrder = impliedString(paintOrder, "normal");
  mark.pointerEvents = impliedString(pointerEvents, "auto");
  mark.shapeRendering = impliedString(shapeRendering, "auto");
  return {
    title: { value: title, optional: true, filter: null },
    href: { value: href, optional: true, filter: null },
    ariaLabel: { value: variaLabel, optional: true, filter: null },
    fill: { value: vfill, scale: "auto", optional: true },
    fillOpacity: { value: vfillOpacity, scale: "auto", optional: true },
    stroke: { value: vstroke, scale: "auto", optional: true },
    strokeOpacity: { value: vstrokeOpacity, scale: "auto", optional: true },
    strokeWidth: { value: vstrokeWidth, optional: true },
    opacity: { value: vopacity, scale: "auto", optional: true }
  };
}
function applyTitle(selection2, L) {
  if (L)
    selection2.filter((i) => nonempty(L[i])).append("title").call(applyText, L);
}
function applyTitleGroup(selection2, L) {
  if (L)
    selection2.filter(([i]) => nonempty(L[i])).append("title").call(applyTextGroup, L);
}
function applyText(selection2, T) {
  if (T) selection2.text((i) => formatDefault(T[i]));
}
function applyTextGroup(selection2, T) {
  if (T) selection2.text(([i]) => formatDefault(T[i]));
}
function applyChannelStyles(selection2, { target, tip: tip2 }, {
  ariaLabel: AL,
  title: T,
  fill: F,
  fillOpacity: FO,
  stroke: S,
  strokeOpacity: SO,
  strokeWidth: SW,
  opacity: O,
  href: H
}) {
  if (AL) applyAttr(selection2, "aria-label", (i) => AL[i]);
  if (F) applyAttr(selection2, "fill", (i) => F[i]);
  if (FO) applyAttr(selection2, "fill-opacity", (i) => FO[i]);
  if (S) applyAttr(selection2, "stroke", (i) => S[i]);
  if (SO) applyAttr(selection2, "stroke-opacity", (i) => SO[i]);
  if (SW) applyAttr(selection2, "stroke-width", (i) => SW[i]);
  if (O) applyAttr(selection2, "opacity", (i) => O[i]);
  if (H) applyHref(selection2, (i) => H[i], target);
  if (!tip2) applyTitle(selection2, T);
}
function applyGroupedChannelStyles(selection2, { target, tip: tip2 }, {
  ariaLabel: AL,
  title: T,
  fill: F,
  fillOpacity: FO,
  stroke: S,
  strokeOpacity: SO,
  strokeWidth: SW,
  opacity: O,
  href: H
}) {
  if (AL) applyAttr(selection2, "aria-label", ([i]) => AL[i]);
  if (F) applyAttr(selection2, "fill", ([i]) => F[i]);
  if (FO) applyAttr(selection2, "fill-opacity", ([i]) => FO[i]);
  if (S) applyAttr(selection2, "stroke", ([i]) => S[i]);
  if (SO) applyAttr(selection2, "stroke-opacity", ([i]) => SO[i]);
  if (SW) applyAttr(selection2, "stroke-width", ([i]) => SW[i]);
  if (O) applyAttr(selection2, "opacity", ([i]) => O[i]);
  if (H) applyHref(selection2, ([i]) => H[i], target);
  if (!tip2) applyTitleGroup(selection2, T);
}
function groupAesthetics({
  ariaLabel: AL,
  title: T,
  fill: F,
  fillOpacity: FO,
  stroke: S,
  strokeOpacity: SO,
  strokeWidth: SW,
  opacity: O,
  href: H
}, { tip: tip2 }) {
  return [AL, tip2 ? void 0 : T, F, FO, S, SO, SW, O, H].filter((c3) => c3 !== void 0);
}
function groupZ(I, Z, z) {
  const G = group(I, (i) => Z[i]);
  if (z === void 0 && G.size > 1 + I.length >> 1) {
    warn(
      `Warning: the implicit z channel has high cardinality. This may occur when the fill or stroke channel is associated with quantitative data rather than ordinal or categorical data. You can suppress this warning by setting the z option explicitly; if this data represents a single series, set z to null.`
    );
  }
  return G.values();
}
function* groupIndex(I, position2, mark, channels) {
  const { z } = mark;
  const { z: Z } = channels;
  const A5 = groupAesthetics(channels, mark);
  const C3 = [...position2, ...A5];
  for (const G of Z ? groupZ(I, Z, z) : [I]) {
    let Ag;
    let Gg;
    out: for (const i of G) {
      for (const c3 of C3) {
        if (!defined(c3[i])) {
          if (Gg) Gg.push(-1);
          continue out;
        }
      }
      if (Ag === void 0) {
        if (Gg) yield Gg;
        Ag = A5.map((c3) => keyof2(c3[i])), Gg = [i];
        continue;
      }
      Gg.push(i);
      for (let j = 0; j < A5.length; ++j) {
        const k2 = keyof2(A5[j][i]);
        if (k2 !== Ag[j]) {
          yield Gg;
          Ag = A5.map((c3) => keyof2(c3[i])), Gg = [i];
          continue out;
        }
      }
    }
    if (Gg) yield Gg;
  }
}
function applyClip(selection2, mark, dimensions, context) {
  let clipUrl;
  const { clip: clip2 = context.clip } = mark;
  if (clip2 === "frame") {
    selection2 = create("svg:g", context).each(function() {
      this.appendChild(selection2.node());
      selection2.node = () => this;
    });
    clipUrl = getFrameClip(context, dimensions);
  } else if (clip2) {
    clipUrl = getGeoClip(clip2, context);
  }
  applyAttr(selection2, "aria-label", mark.ariaLabel);
  applyAttr(selection2, "aria-description", mark.ariaDescription);
  applyAttr(selection2, "aria-hidden", mark.ariaHidden);
  applyAttr(selection2, "clip-path", clipUrl);
}
function memoizeClip(clip2) {
  const cache = /* @__PURE__ */ new WeakMap();
  return (context, dimensions) => {
    let url = cache.get(context);
    if (!url) {
      const id = getClipId();
      select(context.ownerSVGElement).append("clipPath").attr("id", id).call(clip2, context, dimensions);
      cache.set(context, url = `url(#${id})`);
    }
    return url;
  };
}
var getFrameClip = memoizeClip((clipPath, context, dimensions) => {
  const { width, height, marginLeft, marginRight, marginTop, marginBottom } = dimensions;
  clipPath.append("rect").attr("x", marginLeft).attr("y", marginTop).attr("width", width - marginRight - marginLeft).attr("height", height - marginTop - marginBottom);
});
var geoClipCache = /* @__PURE__ */ new WeakMap();
var sphere$1 = { type: "Sphere" };
function getGeoClip(geo2, context) {
  let cache, url;
  if (!(cache = geoClipCache.get(context))) geoClipCache.set(context, cache = /* @__PURE__ */ new WeakMap());
  if (geo2.type === "Sphere") geo2 = sphere$1;
  if (!(url = cache.get(geo2))) {
    const id = getClipId();
    select(context.ownerSVGElement).append("clipPath").attr("id", id).append("path").attr("d", context.path()(geo2));
    cache.set(geo2, url = `url(#${id})`);
  }
  return url;
}
function applyIndirectStyles(selection2, mark, dimensions, context) {
  applyClip(selection2, mark, dimensions, context);
  applyAttr(selection2, "class", mark.className);
  applyAttr(selection2, "fill", mark.fill);
  applyAttr(selection2, "fill-opacity", mark.fillOpacity);
  applyAttr(selection2, "stroke", mark.stroke);
  applyAttr(selection2, "stroke-width", mark.strokeWidth);
  applyAttr(selection2, "stroke-opacity", mark.strokeOpacity);
  applyAttr(selection2, "stroke-linejoin", mark.strokeLinejoin);
  applyAttr(selection2, "stroke-linecap", mark.strokeLinecap);
  applyAttr(selection2, "stroke-miterlimit", mark.strokeMiterlimit);
  applyAttr(selection2, "stroke-dasharray", mark.strokeDasharray);
  applyAttr(selection2, "stroke-dashoffset", mark.strokeDashoffset);
  applyAttr(selection2, "shape-rendering", mark.shapeRendering);
  applyAttr(selection2, "filter", mark.imageFilter);
  applyAttr(selection2, "paint-order", mark.paintOrder);
  const { pointerEvents = context.pointerSticky === false ? "none" : void 0 } = mark;
  applyAttr(selection2, "pointer-events", pointerEvents);
}
function applyDirectStyles(selection2, mark) {
  applyStyle(selection2, "mix-blend-mode", mark.mixBlendMode);
  applyAttr(selection2, "opacity", mark.opacity);
}
function applyHref(selection2, href, target) {
  selection2.each(function(i) {
    const h = href(i);
    if (h != null) {
      const a2 = this.ownerDocument.createElementNS(namespaces.svg, "a");
      a2.setAttribute("fill", "inherit");
      a2.setAttributeNS(namespaces.xlink, "href", h);
      if (target != null) a2.setAttribute("target", target);
      this.parentNode.insertBefore(a2, this).appendChild(this);
    }
  });
}
function applyAttr(selection2, name, value2) {
  if (value2 != null) selection2.attr(name, value2);
}
function applyStyle(selection2, name, value2) {
  if (value2 != null) selection2.style(name, value2);
}
function applyTransform(selection2, mark, { x: x2, y: y2 }, tx = offset, ty = offset) {
  tx += mark.dx;
  ty += mark.dy;
  if (x2?.bandwidth) tx += x2.bandwidth() / 2;
  if (y2?.bandwidth) ty += y2.bandwidth() / 2;
  if (tx || ty) selection2.attr("transform", `translate(${tx},${ty})`);
}
function impliedString(value2, impliedValue) {
  if ((value2 = string2(value2)) !== impliedValue) return value2;
}
function impliedNumber(value2, impliedValue) {
  if ((value2 = number$12(value2)) !== impliedValue) return value2;
}
var validClassName = /^-?([_a-z]|[\240-\377]|\\[0-9a-f]{1,6}(\r\n|[ \t\r\n\f])?|\\[^\r\n\f0-9a-f])([_a-z0-9-]|[\240-\377]|\\[0-9a-f]{1,6}(\r\n|[ \t\r\n\f])?|\\[^\r\n\f0-9a-f])*$/i;
function maybeClassName(name) {
  if (name === void 0) return "plot-d6a7b5";
  name = `${name}`;
  if (!validClassName.test(name)) throw new Error(`invalid class name: ${name}`);
  return name;
}
function applyInlineStyles(selection2, style) {
  if (typeof style === "string") {
    selection2.property("style", style);
  } else if (style != null) {
    for (const element of selection2) {
      Object.assign(element.style, style);
    }
  }
}
function applyFrameAnchor({ frameAnchor }, { width, height, marginTop, marginRight, marginBottom, marginLeft }) {
  return [
    /left$/.test(frameAnchor) ? marginLeft : /right$/.test(frameAnchor) ? width - marginRight : (marginLeft + width - marginRight) / 2,
    /^top/.test(frameAnchor) ? marginTop : /^bottom/.test(frameAnchor) ? height - marginBottom : (marginTop + height - marginBottom) / 2
  ];
}
function createDimensions(scales, marks2, options = {}) {
  let marginTopDefault = 0.5 - offset, marginRightDefault = 0.5 + offset, marginBottomDefault = 0.5 + offset, marginLeftDefault = 0.5 - offset;
  for (const { marginTop: marginTop2, marginRight: marginRight2, marginBottom: marginBottom2, marginLeft: marginLeft2 } of marks2) {
    if (marginTop2 > marginTopDefault) marginTopDefault = marginTop2;
    if (marginRight2 > marginRightDefault) marginRightDefault = marginRight2;
    if (marginBottom2 > marginBottomDefault) marginBottomDefault = marginBottom2;
    if (marginLeft2 > marginLeftDefault) marginLeftDefault = marginLeft2;
  }
  let {
    margin,
    marginTop = margin !== void 0 ? margin : marginTopDefault,
    marginRight = margin !== void 0 ? margin : marginRightDefault,
    marginBottom = margin !== void 0 ? margin : marginBottomDefault,
    marginLeft = margin !== void 0 ? margin : marginLeftDefault
  } = options;
  marginTop = +marginTop;
  marginRight = +marginRight;
  marginBottom = +marginBottom;
  marginLeft = +marginLeft;
  let {
    width = 640,
    height = autoHeight(scales, options, {
      width,
      marginTopDefault,
      marginRightDefault,
      marginBottomDefault,
      marginLeftDefault
    }) + Math.max(0, marginTop - marginTopDefault + marginBottom - marginBottomDefault)
  } = options;
  width = +width;
  height = +height;
  const dimensions = {
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft
  };
  if (scales.fx || scales.fy) {
    let {
      margin: facetMargin,
      marginTop: facetMarginTop = facetMargin !== void 0 ? facetMargin : marginTop,
      marginRight: facetMarginRight = facetMargin !== void 0 ? facetMargin : marginRight,
      marginBottom: facetMarginBottom = facetMargin !== void 0 ? facetMargin : marginBottom,
      marginLeft: facetMarginLeft = facetMargin !== void 0 ? facetMargin : marginLeft
    } = options.facet ?? {};
    facetMarginTop = +facetMarginTop;
    facetMarginRight = +facetMarginRight;
    facetMarginBottom = +facetMarginBottom;
    facetMarginLeft = +facetMarginLeft;
    dimensions.facet = {
      marginTop: facetMarginTop,
      marginRight: facetMarginRight,
      marginBottom: facetMarginBottom,
      marginLeft: facetMarginLeft
    };
  }
  return dimensions;
}
function autoHeight({ x: x2, y: y2, fy, fx }, { projection: projection3, aspectRatio }, { width, marginTopDefault, marginRightDefault, marginBottomDefault, marginLeftDefault }) {
  const nfy = fy ? fy.scale.domain().length || 1 : 1;
  const ar = projectionAspectRatio(projection3);
  if (ar) {
    const nfx = fx ? fx.scale.domain().length : 1;
    const far = (1.1 * nfy - 0.1) / (1.1 * nfx - 0.1) * ar;
    const lar = Math.max(0.1, Math.min(10, far));
    return Math.round((width - marginLeftDefault - marginRightDefault) * lar + marginTopDefault + marginBottomDefault);
  }
  const ny = y2 ? isOrdinalScale(y2) ? y2.scale.domain().length || 1 : Math.max(7, 17 / nfy) : 1;
  if (aspectRatio != null) {
    aspectRatio = +aspectRatio;
    if (!(isFinite(aspectRatio) && aspectRatio > 0)) throw new Error(`invalid aspectRatio: ${aspectRatio}`);
    const ratio = aspectRatioLength("y", y2) / (aspectRatioLength("x", x2) * aspectRatio);
    const fxb = fx ? fx.scale.bandwidth() : 1;
    const fyb = fy ? fy.scale.bandwidth() : 1;
    const w = fxb * (width - marginLeftDefault - marginRightDefault) - x2.insetLeft - x2.insetRight;
    return (ratio * w + y2.insetTop + y2.insetBottom) / fyb + marginTopDefault + marginBottomDefault;
  }
  return !!(y2 || fy) * Math.max(1, Math.min(60, ny * nfy)) * 20 + !!fx * 30 + 60;
}
function aspectRatioLength(k2, scale2) {
  if (!scale2) throw new Error(`aspectRatio requires ${k2} scale`);
  const { type, domain } = scale2;
  let transform2;
  switch (type) {
    case "linear":
    case "utc":
    case "time":
      transform2 = Number;
      break;
    case "pow": {
      const exponent2 = scale2.scale.exponent();
      transform2 = (x2) => Math.pow(x2, exponent2);
      break;
    }
    case "log":
      transform2 = Math.log;
      break;
    case "point":
    case "band":
      return domain.length;
    default:
      throw new Error(`unsupported ${k2} scale for aspectRatio: ${type}`);
  }
  const [min3, max2] = extent(domain);
  return Math.abs(transform2(max2) - transform2(min3));
}
function createFacets(channelsByScale, options) {
  const { fx, fy } = createScales(channelsByScale, options);
  const fxDomain = fx?.scale.domain();
  const fyDomain = fy?.scale.domain();
  return fxDomain && fyDomain ? cross(fxDomain, fyDomain).map(([x2, y2], i) => ({ x: x2, y: y2, i })) : fxDomain ? fxDomain.map((x2, i) => ({ x: x2, i })) : fyDomain ? fyDomain.map((y2, i) => ({ y: y2, i })) : void 0;
}
function recreateFacets(facets, { x: X, y: Y }) {
  X &&= facetIndex(X);
  Y &&= facetIndex(Y);
  return facets.filter(
    X && Y ? (f) => X.has(f.x) && Y.has(f.y) : X ? (f) => X.has(f.x) : (f) => Y.has(f.y)
  ).sort(
    X && Y ? (a2, b) => X.get(a2.x) - X.get(b.x) || Y.get(a2.y) - Y.get(b.y) : X ? (a2, b) => X.get(a2.x) - X.get(b.x) : (a2, b) => Y.get(a2.y) - Y.get(b.y)
  );
}
function facetGroups(data, { fx, fy }) {
  const I = range2(data);
  const FX = fx?.value;
  const FY = fy?.value;
  return fx && fy ? rollup(
    I,
    (G) => (G.fx = FX[G[0]], G.fy = FY[G[0]], G),
    (i) => FX[i],
    (i) => FY[i]
  ) : fx ? rollup(
    I,
    (G) => (G.fx = FX[G[0]], G),
    (i) => FX[i]
  ) : rollup(
    I,
    (G) => (G.fy = FY[G[0]], G),
    (i) => FY[i]
  );
}
function facetTranslator(fx, fy, { marginTop, marginLeft }) {
  const x2 = fx ? ({ x: x3 }) => fx(x3) - marginLeft : () => 0;
  const y2 = fy ? ({ y: y3 }) => fy(y3) - marginTop : () => 0;
  return function(d) {
    if (this.tagName === "svg") {
      this.setAttribute("x", x2(d));
      this.setAttribute("y", y2(d));
    } else {
      this.setAttribute("transform", `translate(${x2(d)},${y2(d)})`);
    }
  };
}
function facetExclude(index2) {
  const ex = [];
  const e = new Uint32Array(sum(index2, (d) => d.length));
  for (const i of index2) {
    let n = 0;
    for (const j of index2) {
      if (i === j) continue;
      e.set(j, n);
      n += j.length;
    }
    ex.push(e.slice(0, n));
  }
  return ex;
}
var facetAnchors = /* @__PURE__ */ new Map([
  ["top", facetAnchorTop],
  ["right", facetAnchorRight],
  ["bottom", facetAnchorBottom],
  ["left", facetAnchorLeft],
  ["top-left", and(facetAnchorTop, facetAnchorLeft)],
  ["top-right", and(facetAnchorTop, facetAnchorRight)],
  ["bottom-left", and(facetAnchorBottom, facetAnchorLeft)],
  ["bottom-right", and(facetAnchorBottom, facetAnchorRight)],
  ["top-empty", facetAnchorTopEmpty],
  ["right-empty", facetAnchorRightEmpty],
  ["bottom-empty", facetAnchorBottomEmpty],
  ["left-empty", facetAnchorLeftEmpty],
  ["empty", facetAnchorEmpty]
]);
function maybeFacetAnchor(facetAnchor) {
  if (facetAnchor == null) return null;
  const anchor = facetAnchors.get(`${facetAnchor}`.toLowerCase());
  if (anchor) return anchor;
  throw new Error(`invalid facet anchor: ${facetAnchor}`);
}
var indexCache = /* @__PURE__ */ new WeakMap();
function facetIndex(V) {
  let I = indexCache.get(V);
  if (!I) indexCache.set(V, I = new InternMap(map$1(V, (v, i) => [v, i])));
  return I;
}
function facetIndexOf(V, v) {
  return facetIndex(V).get(v);
}
function facetFind(facets, x2, y2) {
  x2 = keyof2(x2);
  y2 = keyof2(y2);
  return facets.find((f) => Object.is(keyof2(f.x), x2) && Object.is(keyof2(f.y), y2));
}
function facetEmpty(facets, x2, y2) {
  return facetFind(facets, x2, y2)?.empty;
}
function facetAnchorTop(facets, { y: Y }, { y: y2 }) {
  return Y ? facetIndexOf(Y, y2) === 0 : true;
}
function facetAnchorBottom(facets, { y: Y }, { y: y2 }) {
  return Y ? facetIndexOf(Y, y2) === Y.length - 1 : true;
}
function facetAnchorLeft(facets, { x: X }, { x: x2 }) {
  return X ? facetIndexOf(X, x2) === 0 : true;
}
function facetAnchorRight(facets, { x: X }, { x: x2 }) {
  return X ? facetIndexOf(X, x2) === X.length - 1 : true;
}
function facetAnchorTopEmpty(facets, { y: Y }, { x: x2, y: y2, empty: empty3 }) {
  if (empty3) return false;
  if (!Y) return;
  const i = facetIndexOf(Y, y2);
  if (i > 0) return facetEmpty(facets, x2, Y[i - 1]);
}
function facetAnchorBottomEmpty(facets, { y: Y }, { x: x2, y: y2, empty: empty3 }) {
  if (empty3) return false;
  if (!Y) return;
  const i = facetIndexOf(Y, y2);
  if (i < Y.length - 1) return facetEmpty(facets, x2, Y[i + 1]);
}
function facetAnchorLeftEmpty(facets, { x: X }, { x: x2, y: y2, empty: empty3 }) {
  if (empty3) return false;
  if (!X) return;
  const i = facetIndexOf(X, x2);
  if (i > 0) return facetEmpty(facets, X[i - 1], y2);
}
function facetAnchorRightEmpty(facets, { x: X }, { x: x2, y: y2, empty: empty3 }) {
  if (empty3) return false;
  if (!X) return;
  const i = facetIndexOf(X, x2);
  if (i < X.length - 1) return facetEmpty(facets, X[i + 1], y2);
}
function facetAnchorEmpty(facets, channels, { empty: empty3 }) {
  return empty3;
}
function and(a2, b) {
  return function() {
    return a2.apply(null, arguments) && b.apply(null, arguments);
  };
}
function facetFilter(facets, { channels: { fx, fy }, groups }) {
  return fx && fy ? facets.map(({ x: x2, y: y2 }) => groups.get(x2)?.get(y2) ?? []) : fx ? facets.map(({ x: x2 }) => groups.get(x2) ?? []) : facets.map(({ y: y2 }) => groups.get(y2) ?? []);
}
var Mark = class {
  constructor(data, channels = {}, options = {}, defaults2) {
    const {
      facet = "auto",
      facetAnchor,
      fx,
      fy,
      sort: sort3,
      dx = 0,
      dy = 0,
      margin = 0,
      marginTop = margin,
      marginRight = margin,
      marginBottom = margin,
      marginLeft = margin,
      className,
      clip: clip2 = defaults2?.clip,
      channels: extraChannels,
      tip: tip2,
      pool = defaults2?.pool,
      render
    } = options;
    this.data = data;
    this.sort = isDomainSort(sort3) ? sort3 : null;
    this.initializer = initializer(options).initializer;
    this.transform = this.initializer ? options.transform : basic(options).transform;
    if (facet === null || facet === false) {
      this.facet = null;
    } else {
      this.facet = keyword(facet === true ? "include" : facet, "facet", ["auto", "include", "exclude", "super"]);
      this.fx = data === singleton && typeof fx === "string" ? [fx] : fx;
      this.fy = data === singleton && typeof fy === "string" ? [fy] : fy;
    }
    this.facetAnchor = maybeFacetAnchor(facetAnchor);
    channels = maybeNamed(channels);
    if (extraChannels !== void 0) channels = { ...maybeChannels(extraChannels), ...channels };
    if (defaults2 !== void 0) channels = { ...styles(this, options, defaults2), ...channels };
    this.channels = Object.fromEntries(
      Object.entries(channels).map(([name, channel]) => {
        if (isOptions(channel.value)) {
          const { value: value2, label = channel.label, scale: scale2 = channel.scale } = channel.value;
          channel = { ...channel, label, scale: scale2, value: value2 };
        }
        if (data === singleton && typeof channel.value === "string") {
          const { value: value2 } = channel;
          channel = { ...channel, value: [value2] };
        }
        return [name, channel];
      }).filter(([name, { value: value2, optional: optional2 }]) => {
        if (value2 != null) return true;
        if (optional2) return false;
        throw new Error(`missing channel value: ${name}`);
      })
    );
    this.dx = +dx;
    this.dy = +dy;
    this.marginTop = +marginTop;
    this.marginRight = +marginRight;
    this.marginBottom = +marginBottom;
    this.marginLeft = +marginLeft;
    this.clip = maybeClip(clip2);
    this.tip = maybeTip(tip2);
    this.pool = !!pool;
    this.className = string2(className);
    if (this.facet === "super") {
      if (fx || fy) throw new Error(`super-faceting cannot use fx or fy`);
      for (const name in this.channels) {
        const { scale: scale2 } = channels[name];
        if (scale2 !== "x" && scale2 !== "y") continue;
        throw new Error(`super-faceting cannot use x or y`);
      }
    }
    if (render != null) {
      this.render = composeRender(render, this.render);
    }
  }
  initialize(facets, facetChannels, plotOptions) {
    let data = dataify(this.data);
    if (facets === void 0 && data != null) facets = [range2(data)];
    const originalFacets = facets;
    if (this.transform != null) ({ facets, data } = this.transform(data, facets, plotOptions)), data = dataify(data);
    if (facets !== void 0) facets.original = originalFacets;
    const channels = createChannels(this.channels, data);
    if (this.sort != null) channelDomain(data, facets, channels, facetChannels, this.sort);
    return { data, facets, channels };
  }
  filter(index2, channels, values2) {
    for (const name in channels) {
      const { filter: filter3 = defined } = channels[name];
      if (filter3 !== null) {
        const value2 = values2[name];
        index2 = index2.filter((i) => filter3(value2[i]));
      }
    }
    return index2;
  }
  // If there is a projection, and there are paired x and y channels associated
  // with the x and y scale respectively (and not already in screen coordinates
  // as with an initializer), then apply the projection, replacing the x and y
  // values. Note that the x and y scales themselves don’t exist if there is a
  // projection, but whether the channels are associated with scales still
  // determines whether the projection should apply; think of the projection as
  // a combination xy-scale.
  project(channels, values2, context) {
    for (const cx in channels) {
      if (channels[cx].scale === "x" && /^x|x$/.test(cx)) {
        const cy = cx.replace(/^x|x$/, "y");
        if (cy in channels && channels[cy].scale === "y") {
          project(cx, cy, values2, context.projection);
        }
      }
    }
  }
  scale(channels, scales, context) {
    const values2 = valueObject(channels, scales);
    if (context.projection) this.project(channels, values2, context);
    return values2;
  }
  plot({ marks: marks2 = [], ...options } = {}) {
    return plot({ ...options, marks: [...marks2, this] });
  }
};
function marks(...marks2) {
  marks2.plot = Mark.prototype.plot;
  return marks2;
}
function composeRender(r1, r2) {
  if (r1 == null) return r2 === null ? void 0 : r2;
  if (r2 == null) return r1 === null ? void 0 : r1;
  if (typeof r1 !== "function") throw new TypeError(`invalid render transform: ${r1}`);
  if (typeof r2 !== "function") throw new TypeError(`invalid render transform: ${r2}`);
  return function(i, s2, v, d, c3, next) {
    return r1.call(this, i, s2, v, d, c3, (i2, s3, v2, d2, c4) => {
      return r2.call(this, i2, s3, v2, d2, c4, next);
    });
  };
}
function maybeChannels(channels) {
  return Object.fromEntries(
    Object.entries(maybeNamed(channels)).map(([name, channel]) => {
      channel = typeof channel === "string" ? { value: channel, label: name } : maybeValue(channel);
      if (channel.filter === void 0 && channel.scale == null) channel = { ...channel, filter: null };
      return [name, channel];
    })
  );
}
function maybeTip(tip2) {
  return tip2 === true ? "xy" : tip2 === false || tip2 == null ? null : typeof tip2 === "string" ? keyword(tip2, "tip", ["x", "y", "xy"]) : tip2;
}
function withTip(options, pointer3) {
  return options?.tip === true ? { ...options, tip: pointer3 } : isObject(options?.tip) && options.tip.pointer === void 0 ? { ...options, tip: { ...options.tip, pointer: pointer3 } } : options;
}
var states = /* @__PURE__ */ new WeakMap();
var handledEvents = /* @__PURE__ */ new WeakSet();
function pointerK(kx2, ky2, { x: x2, y: y2, px, py, maxRadius = 40, channels, render, ...options } = {}) {
  maxRadius = +maxRadius;
  if (px != null) x2 ??= null, channels = { ...channels, px: { value: px, scale: "x" } };
  if (py != null) y2 ??= null, channels = { ...channels, py: { value: py, scale: "y" } };
  return {
    x: x2,
    y: y2,
    channels,
    ...options,
    // Unlike other composed transforms, the render transform must be the
    // outermost render function because it will re-render dynamically in
    // response to pointer events.
    render: composeRender(function(index2, scales, values2, dimensions, context, next) {
      context = { ...context, pointerSticky: false };
      const svg = context.ownerSVGElement;
      const { data } = context.getMarkState(this);
      let state = states.get(svg);
      if (!state) {
        state = { sticky: false, roots: [], renders: [], pool: this.pool ? { map: /* @__PURE__ */ new Map() } : null };
        states.set(svg, state);
      }
      let renderIndex = state.renders.push(render2) - 1;
      const { x: x3, y: y3, fx, fy } = scales;
      let tx = fx ? fx(index2.fx) - dimensions.marginLeft : 0;
      let ty = fy ? fy(index2.fy) - dimensions.marginTop : 0;
      if (x3?.bandwidth) tx += x3.bandwidth() / 2;
      if (y3?.bandwidth) ty += y3.bandwidth() / 2;
      const faceted = index2.fi != null;
      let facetPool;
      if (faceted) {
        let facetPools = state.facetPools;
        if (!facetPools) state.facetPools = facetPools = /* @__PURE__ */ new Map();
        facetPool = facetPools.get(this);
        if (!facetPool) facetPools.set(this, facetPool = { map: /* @__PURE__ */ new Map() });
      }
      const [cx, cy] = applyFrameAnchor(this, dimensions);
      const { px: PX, py: PY } = values2;
      const px2 = PX ? (i2) => PX[i2] : anchorX$1(values2, cx);
      const py2 = PY ? (i2) => PY[i2] : anchorY$1(values2, cy);
      let i;
      let g;
      let s2;
      const pool = state.pool ?? facetPool;
      function update(ii, ri) {
        if (!pool) return void render2(ii);
        if (ii == null) render2(ii);
        pool.map.set(renderIndex, { ii, ri, render: render2 });
        if (pool.frame !== void 0) cancelAnimationFrame(pool.frame);
        pool.frame = requestAnimationFrame(() => {
          pool.frame = void 0;
          let best = null;
          for (const c3 of pool.map.values()) if (!best || c3.ri < best.ri) best = c3;
          for (const c3 of pool.map.values()) c3.render(c3 === best ? c3.ii : null);
        });
      }
      function render2(ii) {
        if (i === ii && s2 === state.sticky) return;
        i = ii;
        s2 = context.pointerSticky = state.sticky;
        const I = i == null ? [] : [i];
        if (faceted) I.fx = index2.fx, I.fy = index2.fy, I.fi = index2.fi;
        const r = next(I, scales, values2, dimensions, context);
        if (g) {
          if (faceted) {
            const p = g.parentNode;
            const ft = g.getAttribute("transform");
            const mt = r.getAttribute("transform");
            ft ? r.setAttribute("transform", ft) : r.removeAttribute("transform");
            mt ? p.setAttribute("transform", mt) : p.removeAttribute("transform");
            r.removeAttribute("aria-label");
            r.removeAttribute("aria-description");
            r.removeAttribute("aria-hidden");
          }
          g.replaceWith(r);
        }
        state.roots[renderIndex] = g = r;
        if (!(i == null && facetPool?.map.size > 1)) {
          const value2 = i == null ? null : isArray(data) ? data[i] : data.get(i);
          context.dispatchValue(value2);
        }
        return r;
      }
      function pointermove(event) {
        if (state.sticky || event.pointerType === "mouse" && event.buttons === 1) return;
        let [xp, yp] = pointer(event);
        xp -= tx, yp -= ty;
        const kpx = xp < dimensions.marginLeft || xp > dimensions.width - dimensions.marginRight ? 1 : kx2;
        const kpy = yp < dimensions.marginTop || yp > dimensions.height - dimensions.marginBottom ? 1 : ky2;
        let ii = null;
        let ri = maxRadius * maxRadius;
        for (const j of index2) {
          const dx = kpx * (px2(j) - xp);
          const dy = kpy * (py2(j) - yp);
          const rj = dx * dx + dy * dy;
          if (rj <= ri) ii = j, ri = rj;
        }
        if (ii != null && (kx2 !== 1 || ky2 !== 1)) {
          const dx = px2(ii) - xp;
          const dy = py2(ii) - yp;
          ri = dx * dx + dy * dy;
        }
        update(ii, ri);
      }
      function pointerdown(event) {
        if (handledEvents.has(event)) return;
        handledEvents.add(event);
        if (event.pointerType !== "mouse") return;
        if (i == null) return;
        if (state.sticky && state.roots.some((r) => r?.contains(event.target))) return;
        if (state.sticky) state.sticky = false, state.renders.forEach((r) => r(null));
        else state.sticky = true, render2(i);
      }
      function pointerleave(event) {
        if (event.pointerType !== "mouse") return;
        if (!state.sticky) update(null);
      }
      svg.addEventListener("pointerenter", pointermove);
      svg.addEventListener("pointermove", pointermove);
      svg.addEventListener("pointerdown", pointerdown);
      svg.addEventListener("pointerleave", pointerleave);
      return render2(null);
    }, render)
  };
}
function pointer2(options) {
  return pointerK(1, 1, options);
}
function pointerX(options) {
  return pointerK(1, 0.01, options);
}
function pointerY(options) {
  return pointerK(0.01, 1, options);
}
function anchorX$1({ x1: X12, x2: X22, x: X = X12 }, cx) {
  return X12 && X22 ? (i) => (X12[i] + X22[i]) / 2 : X ? (i) => X[i] : () => cx;
}
function anchorY$1({ y1: Y12, y2: Y22, y: Y = Y12 }, cy) {
  return Y12 && Y22 ? (i) => (Y12[i] + Y22[i]) / 2 : Y ? (i) => Y[i] : () => cy;
}
function inferFontVariant$2(scale2) {
  return isOrdinalScale(scale2) && scale2.interval === void 0 ? void 0 : "tabular-nums";
}
function legendRamp(color3, options) {
  let {
    label = color3.label,
    tickSize = 6,
    width = 240,
    height = 44 + tickSize,
    marginTop = 18,
    marginRight = 0,
    marginBottom = 16 + tickSize,
    marginLeft = 0,
    style,
    ticks: ticks2 = (width - marginLeft - marginRight) / 64,
    tickFormat: tickFormat2,
    fontVariant = inferFontVariant$2(color3),
    round: round3 = true,
    opacity: opacity2,
    className
  } = options;
  const context = createContext(options);
  className = maybeClassName(className);
  opacity2 = maybeNumberChannel(opacity2)[1];
  if (tickFormat2 === null) tickFormat2 = () => null;
  const svg = create("svg", context).attr("class", `${className}-ramp`).attr("font-family", "system-ui, sans-serif").attr("font-size", 10).attr("width", width).attr("height", height).attr("viewBox", `0 0 ${width} ${height}`).call(
    (svg2) => (
      // Warning: if you edit this, change defaultClassName.
      svg2.append("style").text(
        `:where(.${className}-ramp) {
  display: block;
  height: auto;
  height: intrinsic;
  max-width: 100%;
  overflow: visible;
}
:where(.${className}-ramp text) {
  white-space: pre;
}`
      )
    )
  ).call(applyInlineStyles, style);
  let tickAdjust = (g) => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
  let x2;
  const applyRange = round3 ? (x3, range4) => x3.rangeRound(range4) : (x3, range4) => x3.range(range4);
  const { type, domain, range: range3, interpolate, scale: scale2, pivot } = color3;
  if (interpolate) {
    const interpolator = range3 === void 0 ? interpolate : piecewise(interpolate.length === 1 ? interpolatePiecewise(interpolate) : interpolate, range3);
    x2 = applyRange(
      scale2.copy(),
      quantize(
        number3(marginLeft, width - marginRight),
        Math.min(domain.length + (pivot !== void 0), range3 === void 0 ? Infinity : range3.length)
      )
    );
    const n = 256;
    const canvas = context.document.createElement("canvas");
    canvas.width = n;
    canvas.height = 1;
    const context2 = canvas.getContext("2d", { colorSpace: "display-p3" });
    const fillStyle = color3.key === "opacity" ? "globalAlpha" : "fillStyle";
    for (let i = 0, j = n - 1; i < n; ++i) {
      context2[fillStyle] = interpolator(i / j);
      context2.fillRect(i, 0, 1, 1);
    }
    svg.append("image").attr("opacity", opacity2).attr("x", marginLeft).attr("y", marginTop).attr("width", width - marginLeft - marginRight).attr("height", height - marginTop - marginBottom).attr("preserveAspectRatio", "none").attr("xlink:href", canvas.toDataURL());
  } else if (type === "threshold") {
    const thresholds = domain;
    const thresholdFormat = tickFormat2 === void 0 ? (d) => d : typeof tickFormat2 === "string" ? format(tickFormat2) : tickFormat2;
    x2 = applyRange(linear2().domain([-1, range3.length - 1]), [marginLeft, width - marginRight]);
    svg.append("g").attr("fill", color3.key === "opacity" ? color3.color : null).attr("fill-opacity", opacity2).selectAll().data(range3).enter().append("rect").attr("x", (d, i) => x2(i - 1)).attr("y", marginTop).attr("width", (d, i) => x2(i) - x2(i - 1)).attr("height", height - marginTop - marginBottom).attr(color3.key === "opacity" ? "fill-opacity" : "fill", (d) => d);
    ticks2 = map$1(thresholds, (_, i) => i);
    tickFormat2 = (i) => thresholdFormat(thresholds[i], i);
  } else {
    x2 = applyRange(band().domain(domain), [marginLeft, width - marginRight]);
    svg.append("g").attr("fill", color3.key === "opacity" ? color3.color : null).attr("fill-opacity", opacity2).selectAll().data(domain).enter().append("rect").attr("x", x2).attr("y", marginTop).attr("width", Math.max(0, x2.bandwidth() - 1)).attr("height", height - marginTop - marginBottom).attr(color3.key === "opacity" ? "fill-opacity" : "fill", scale2);
    tickAdjust = () => {
    };
  }
  svg.append("g").attr("transform", `translate(0,${height - marginBottom})`).call(
    axisBottom(x2).ticks(Array.isArray(ticks2) ? null : ticks2, typeof tickFormat2 === "string" ? tickFormat2 : void 0).tickFormat(typeof tickFormat2 === "function" ? tickFormat2 : void 0).tickSize(tickSize).tickValues(Array.isArray(ticks2) ? ticks2 : null).offset(offset)
  ).attr("font-size", null).attr("font-family", null).attr("font-variant", impliedString(fontVariant, "normal")).call(tickAdjust).call((g) => g.select(".domain").remove());
  if (label !== void 0) {
    svg.append("text").attr("x", marginLeft).attr("y", marginTop - 6).attr("fill", "currentColor").attr("font-weight", "bold").text(label);
  }
  return svg.node();
}
var radians3 = Math.PI / 180;
function markers(mark, { marker, markerStart = marker, markerMid = marker, markerEnd = marker } = {}) {
  mark.markerStart = maybeMarker(markerStart);
  mark.markerMid = maybeMarker(markerMid);
  mark.markerEnd = maybeMarker(markerEnd);
}
function maybeMarker(marker) {
  if (marker == null || marker === false) return null;
  if (marker === true) return markerCircleFill;
  if (typeof marker === "function") return marker;
  switch (`${marker}`.toLowerCase()) {
    case "none":
      return null;
    case "arrow":
      return markerArrow("auto");
    case "arrow-reverse":
      return markerArrow("auto-start-reverse");
    case "dot":
      return markerDot;
    case "circle":
    case "circle-fill":
      return markerCircleFill;
    case "circle-stroke":
      return markerCircleStroke;
    case "tick":
      return markerTick("auto");
    case "tick-x":
      return markerTick(90);
    case "tick-y":
      return markerTick(0);
  }
  throw new Error(`invalid marker: ${marker}`);
}
function markerArrow(orient) {
  return (color3, context) => create("svg:marker", context).attr("viewBox", "-5 -5 10 10").attr("markerWidth", 6.67).attr("markerHeight", 6.67).attr("orient", orient).attr("fill", "none").attr("stroke", color3).attr("stroke-dasharray", "none").attr("stroke-width", 1.5).attr("stroke-linecap", "round").attr("stroke-linejoin", "round").call((marker) => marker.append("path").attr("d", "M-1.5,-3l3,3l-3,3")).node();
}
function markerDot(color3, context) {
  return create("svg:marker", context).attr("viewBox", "-5 -5 10 10").attr("markerWidth", 6.67).attr("markerHeight", 6.67).attr("fill", color3).attr("stroke", "none").call((marker) => marker.append("circle").attr("r", 2.5)).node();
}
function markerCircleFill(color3, context) {
  return create("svg:marker", context).attr("viewBox", "-5 -5 10 10").attr("markerWidth", 6.67).attr("markerHeight", 6.67).attr("fill", color3).attr("stroke", "var(--plot-background)").attr("stroke-dasharray", "none").attr("stroke-width", 1.5).call((marker) => marker.append("circle").attr("r", 3)).node();
}
function markerCircleStroke(color3, context) {
  return create("svg:marker", context).attr("viewBox", "-5 -5 10 10").attr("markerWidth", 6.67).attr("markerHeight", 6.67).attr("fill", "var(--plot-background)").attr("stroke", color3).attr("stroke-dasharray", "none").attr("stroke-width", 1.5).call((marker) => marker.append("circle").attr("r", 3)).node();
}
function markerTick(orient) {
  return (color3, context) => create("svg:marker", context).attr("viewBox", "-3 -3 6 6").attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", orient).attr("stroke", color3).attr("stroke-dasharray", "none").call((marker) => marker.append("path").attr("d", "M0,-3v6")).node();
}
var nextMarkerId = 0;
function applyMarkers(path2, mark, { stroke: S }, context) {
  return applyMarkersColor(path2, mark, S && ((i) => S[i]), null, context);
}
function applyGroupedMarkers(path2, mark, { stroke: S, z: Z }, context) {
  return applyMarkersColor(path2, mark, S && (([i]) => S[i]), Z, context);
}
var START = 1;
var END = 2;
function getGroupedOrientation(path2, Z) {
  const O = new Uint8Array(Z.length);
  const D3 = path2.data().filter((I) => I.length > 1);
  const n = D3.length;
  for (let i = 0, z = unset; i < n; ++i) {
    const I = D3[i];
    if (I.length > 1) {
      const i2 = I[0];
      if (z !== (z = keyof2(Z[i2]))) O[i2] |= START;
    }
  }
  for (let i = n - 1, z = unset; i >= 0; --i) {
    const I = D3[i];
    if (I.length > 1) {
      const i2 = I[0];
      if (z !== (z = keyof2(Z[i2]))) O[i2] |= END;
    }
  }
  return ([i]) => O[i];
}
function applyMarkersColor(path2, { markerStart, markerMid, markerEnd, stroke }, strokeof = () => stroke, Z, context) {
  if (!markerStart && !markerMid && !markerEnd) return;
  const iriByMarkerColor = /* @__PURE__ */ new Map();
  const orient = Z && getGroupedOrientation(path2, Z);
  function applyMarker(name, marker, filter3) {
    return function(i) {
      if (filter3 && !filter3(i)) return;
      const color3 = strokeof(i);
      let iriByColor = iriByMarkerColor.get(marker);
      if (!iriByColor) iriByMarkerColor.set(marker, iriByColor = /* @__PURE__ */ new Map());
      let iri = iriByColor.get(color3);
      if (!iri) {
        const node = this.parentNode.insertBefore(marker(color3, context), this);
        const id = `plot-marker-${++nextMarkerId}`;
        node.setAttribute("id", id);
        iriByColor.set(color3, iri = `url(#${id})`);
      }
      this.setAttribute(name, iri);
    };
  }
  if (markerStart) path2.each(applyMarker("marker-start", markerStart, orient && ((i) => orient(i) & START)));
  if (markerMid && orient) path2.each(applyMarker("marker-start", markerMid, (i) => !(orient(i) & START)));
  if (markerMid) path2.each(applyMarker("marker-mid", markerMid));
  if (markerEnd) path2.each(applyMarker("marker-end", markerEnd, orient && ((i) => orient(i) & END)));
}
function maybeInsetX({ inset, insetLeft, insetRight, ...options } = {}) {
  [insetLeft, insetRight] = maybeInset(inset, insetLeft, insetRight);
  return { inset, insetLeft, insetRight, ...options };
}
function maybeInsetY({ inset, insetTop, insetBottom, ...options } = {}) {
  [insetTop, insetBottom] = maybeInset(inset, insetTop, insetBottom);
  return { inset, insetTop, insetBottom, ...options };
}
function maybeInset(inset, inset1, inset2) {
  return inset === void 0 && inset1 === void 0 && inset2 === void 0 ? offset ? [1, 0] : [0.5, 0.5] : [inset1, inset2];
}
function maybeIntervalValue(value2, { interval }) {
  value2 = { ...maybeValue(value2) };
  value2.interval = maybeInterval(value2.interval === void 0 ? interval : value2.interval);
  return value2;
}
function maybeIntervalK(k2, maybeInsetK, options, trivial) {
  const { [k2]: v, [`${k2}1`]: v1, [`${k2}2`]: v2 } = options;
  const { value: value2, interval } = maybeIntervalValue(v, options);
  if (value2 == null || interval == null && !trivial) return options;
  const label = labelof(v);
  if (interval == null) {
    let V;
    const kv = { transform: (data) => V || (V = valueof(data, value2)), label };
    return {
      ...options,
      [k2]: void 0,
      [`${k2}1`]: v1 === void 0 ? kv : v1,
      [`${k2}2`]: v2 === void 0 && !(v1 === v2 && trivial) ? kv : v2
    };
  }
  let D1, V1;
  function transform2(data) {
    if (V1 !== void 0 && data === D1) return V1;
    return V1 = map$1(valueof(D1 = data, value2), (v3) => interval.floor(v3));
  }
  return maybeInsetK({
    ...options,
    [k2]: void 0,
    [`${k2}1`]: v1 === void 0 ? { transform: transform2, label } : v1,
    [`${k2}2`]: v2 === void 0 ? { transform: (data) => transform2(data).map((v3) => interval.offset(v3)), label } : v2
  });
}
function maybeIntervalMidK(k2, maybeInsetK, options) {
  const { [k2]: v } = options;
  const { value: value2, interval } = maybeIntervalValue(v, options);
  if (value2 == null || interval == null) return options;
  return maybeInsetK({
    ...options,
    [k2]: {
      label: labelof(v),
      transform: (data) => {
        const V1 = map$1(valueof(data, value2), (v2) => interval.floor(v2));
        const V2 = V1.map((v2) => interval.offset(v2));
        return V1.map(
          isTemporal(V1) ? (v1, v2) => v1 == null || isNaN(v1 = +v1) || (v2 = V2[v2], v2 == null) || isNaN(v2 = +v2) ? void 0 : new Date((v1 + v2) / 2) : (v1, v2) => v1 == null || (v2 = V2[v2], v2 == null) ? NaN : (+v1 + +v2) / 2
        );
      }
    }
  });
}
function maybeTrivialIntervalX(options = {}) {
  return maybeIntervalK("x", maybeInsetX, options, true);
}
function maybeTrivialIntervalY(options = {}) {
  return maybeIntervalK("y", maybeInsetY, options, true);
}
function maybeIntervalX(options = {}) {
  return maybeIntervalK("x", maybeInsetX, options);
}
function maybeIntervalY(options = {}) {
  return maybeIntervalK("y", maybeInsetY, options);
}
function maybeIntervalMidX(options = {}) {
  return maybeIntervalMidK("x", maybeInsetX, options);
}
function maybeIntervalMidY(options = {}) {
  return maybeIntervalMidK("y", maybeInsetY, options);
}
var defaults$j = {
  ariaLabel: "rule",
  fill: null,
  stroke: "currentColor"
};
var RuleX = class extends Mark {
  constructor(data, options = {}) {
    const { x: x2, y1: y12, y2, inset = 0, insetTop = inset, insetBottom = inset } = options;
    super(
      data,
      {
        x: { value: x2, scale: "x", optional: true },
        y1: { value: y12, scale: "y", optional: true },
        y2: { value: y2, scale: "y", optional: true }
      },
      withTip(options, "x"),
      defaults$j
    );
    this.insetTop = number$12(insetTop);
    this.insetBottom = number$12(insetBottom);
    markers(this, options);
  }
  render(index2, scales, channels, dimensions, context) {
    const { x: x2, y: y2 } = scales;
    const { x: X, y1: Y12, y2: Y22 } = channels;
    const { width, height, marginTop, marginRight, marginLeft, marginBottom } = dimensions;
    const { insetTop, insetBottom } = this;
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, { x: X && x2 }, offset, 0).call(
      (g) => g.selectAll().data(index2).enter().append("line").call(applyDirectStyles, this).attr("x1", X ? (i) => X[i] : (marginLeft + width - marginRight) / 2).attr("x2", X ? (i) => X[i] : (marginLeft + width - marginRight) / 2).attr("y1", Y12 && !isCollapsed(y2) ? (i) => Y12[i] + insetTop : marginTop + insetTop).attr(
        "y2",
        Y22 && !isCollapsed(y2) ? y2.bandwidth ? (i) => Y22[i] + y2.bandwidth() - insetBottom : (i) => Y22[i] - insetBottom : height - marginBottom - insetBottom
      ).call(applyChannelStyles, this, channels).call(applyMarkers, this, channels, context)
    ).node();
  }
};
var RuleY = class extends Mark {
  constructor(data, options = {}) {
    const { x1: x12, x2, y: y2, inset = 0, insetRight = inset, insetLeft = inset } = options;
    super(
      data,
      {
        y: { value: y2, scale: "y", optional: true },
        x1: { value: x12, scale: "x", optional: true },
        x2: { value: x2, scale: "x", optional: true }
      },
      withTip(options, "y"),
      defaults$j
    );
    this.insetRight = number$12(insetRight);
    this.insetLeft = number$12(insetLeft);
    markers(this, options);
  }
  render(index2, scales, channels, dimensions, context) {
    const { x: x2, y: y2 } = scales;
    const { y: Y, x1: X12, x2: X22 } = channels;
    const { width, height, marginTop, marginRight, marginLeft, marginBottom } = dimensions;
    const { insetLeft, insetRight } = this;
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, { y: Y && y2 }, 0, offset).call(
      (g) => g.selectAll().data(index2).enter().append("line").call(applyDirectStyles, this).attr("x1", X12 && !isCollapsed(x2) ? (i) => X12[i] + insetLeft : marginLeft + insetLeft).attr(
        "x2",
        X22 && !isCollapsed(x2) ? x2.bandwidth ? (i) => X22[i] + x2.bandwidth() - insetRight : (i) => X22[i] - insetRight : width - marginRight - insetRight
      ).attr("y1", Y ? (i) => Y[i] : (marginTop + height - marginBottom) / 2).attr("y2", Y ? (i) => Y[i] : (marginTop + height - marginBottom) / 2).call(applyChannelStyles, this, channels).call(applyMarkers, this, channels, context)
    ).node();
  }
};
function ruleX(data, options) {
  let { x: x2 = identity$13, y: y2, y1: y12, y2: y22, ...rest } = maybeIntervalY(options);
  [y12, y22] = maybeOptionalZero(y2, y12, y22);
  return new RuleX(data, { ...rest, x: x2, y1: y12, y2: y22 });
}
function ruleY(data, options) {
  let { y: y2 = identity$13, x: x2, x1: x12, x2: x22, ...rest } = maybeIntervalX(options);
  [x12, x22] = maybeOptionalZero(x2, x12, x22);
  return new RuleY(data, { ...rest, y: y2, x1: x12, x2: x22 });
}
function maybeOptionalZero(x2, x12, x22) {
  if (x2 == null) {
    if (x12 === void 0) {
      if (x22 !== void 0) return [0, x22];
    } else {
      if (x22 === void 0) return [0, x12];
    }
  } else if (x12 === void 0) {
    return x22 === void 0 ? [0, x2] : [x2, x22];
  } else if (x22 === void 0) {
    return [x2, x12];
  }
  return [x12, x22];
}
function template(strings, ...parts) {
  let n = parts.length;
  for (let j = 0, copy2 = true; j < n; ++j) {
    if (typeof parts[j] !== "function") {
      if (copy2) {
        strings = strings.slice();
        copy2 = false;
      }
      strings.splice(j, 2, strings[j] + parts[j] + strings[j + 1]);
      parts.splice(j, 1);
      --j, --n;
    }
  }
  return (i) => {
    let s2 = strings[0];
    for (let j = 0; j < n; ++j) {
      s2 += parts[j](i) + strings[j + 1];
    }
    return s2;
  };
}
var defaults$i = {
  ariaLabel: "text",
  strokeLinejoin: "round",
  strokeWidth: 3,
  paintOrder: "stroke"
};
var softHyphen = "\xAD";
var Text = class extends Mark {
  constructor(data, options = {}) {
    const {
      x: x2,
      y: y2,
      text: text2 = isIterable(data) && isTextual(data) ? identity$13 : indexOf,
      frameAnchor,
      textAnchor = /right$/i.test(frameAnchor) ? "end" : /left$/i.test(frameAnchor) ? "start" : "middle",
      lineAnchor = /^top/i.test(frameAnchor) ? "top" : /^bottom/i.test(frameAnchor) ? "bottom" : "middle",
      lineHeight = 1,
      lineWidth = Infinity,
      textOverflow,
      monospace,
      fontFamily = monospace ? "ui-monospace, monospace" : void 0,
      fontSize,
      fontStyle,
      fontVariant,
      fontWeight,
      rotate
    } = options;
    const [vrotate, crotate] = maybeNumberChannel(rotate, 0);
    const [vfontSize, cfontSize] = maybeFontSizeChannel(fontSize);
    super(
      data,
      {
        x: { value: x2, scale: "x", optional: true },
        y: { value: y2, scale: "y", optional: true },
        fontSize: { value: vfontSize, optional: true },
        rotate: { value: numberChannel(vrotate), optional: true },
        text: { value: text2, filter: nonempty, optional: true }
      },
      options,
      defaults$i
    );
    this.rotate = crotate;
    this.textAnchor = impliedString(textAnchor, "middle");
    this.lineAnchor = keyword(lineAnchor, "lineAnchor", ["top", "middle", "bottom"]);
    this.lineHeight = +lineHeight;
    this.lineWidth = +lineWidth;
    this.textOverflow = maybeTextOverflow(textOverflow);
    this.monospace = !!monospace;
    this.fontFamily = string2(fontFamily);
    this.fontSize = cfontSize;
    this.fontStyle = string2(fontStyle);
    this.fontVariant = string2(fontVariant);
    this.fontWeight = string2(fontWeight);
    this.frameAnchor = maybeFrameAnchor(frameAnchor);
    if (!(this.lineWidth >= 0)) throw new Error(`invalid lineWidth: ${lineWidth}`);
    this.splitLines = splitter2(this);
    this.clipLine = clipper(this);
  }
  render(index2, scales, channels, dimensions, context) {
    const { x: x2, y: y2 } = scales;
    const { x: X, y: Y, rotate: R, text: T, title: TL, fontSize: FS } = channels;
    const { rotate } = this;
    const [cx, cy] = applyFrameAnchor(this, dimensions);
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyIndirectTextStyles, this, T, dimensions).call(applyTransform, this, { x: X && x2, y: Y && y2 }).call(
      (g) => g.selectAll().data(index2).enter().append("text").call(applyDirectStyles, this).call(applyMultilineText, this, T, TL).attr(
        "transform",
        template`translate(${X ? (i) => X[i] : cx},${Y ? (i) => Y[i] : cy})${R ? (i) => ` rotate(${R[i]})` : rotate ? ` rotate(${rotate})` : ``}`
      ).call(applyAttr, "font-size", FS && ((i) => FS[i])).call(applyChannelStyles, this, channels)
    ).node();
  }
};
function maybeTextOverflow(textOverflow) {
  return textOverflow == null ? null : keyword(textOverflow, "textOverflow", [
    "clip",
    // shorthand for clip-end
    "ellipsis",
    // … ellipsis-end
    "clip-start",
    "clip-end",
    "ellipsis-start",
    "ellipsis-middle",
    "ellipsis-end"
  ]).replace(/^(clip|ellipsis)$/, "$1-end");
}
function applyMultilineText(selection2, mark, T, TL) {
  if (!T) return;
  const { lineAnchor, lineHeight, textOverflow, splitLines, clipLine: clipLine2 } = mark;
  selection2.each(function(i) {
    const lines = splitLines(formatDefault(T[i]) ?? "").map(clipLine2);
    const n = lines.length;
    const y2 = lineAnchor === "top" ? 0.71 : lineAnchor === "bottom" ? 1 - n : (164 - n * 100) / 200;
    if (n > 1) {
      let m = 0;
      for (let i2 = 0; i2 < n; ++i2) {
        ++m;
        if (!lines[i2]) continue;
        const tspan = this.ownerDocument.createElementNS(namespaces.svg, "tspan");
        tspan.setAttribute("x", 0);
        if (i2 === m - 1) tspan.setAttribute("y", `${(y2 + i2) * lineHeight}em`);
        else tspan.setAttribute("dy", `${m * lineHeight}em`);
        tspan.textContent = lines[i2];
        this.appendChild(tspan);
        m = 0;
      }
    } else {
      if (y2) this.setAttribute("y", `${y2 * lineHeight}em`);
      this.textContent = lines[0];
    }
    if (textOverflow && !TL && lines[0] !== T[i]) {
      const title = this.ownerDocument.createElementNS(namespaces.svg, "title");
      title.textContent = T[i];
      this.appendChild(title);
    }
  });
}
function text(data, { x: x2, y: y2, ...options } = {}) {
  if (options.frameAnchor === void 0) [x2, y2] = maybeTuple(x2, y2);
  return new Text(data, { ...options, x: x2, y: y2 });
}
function textX(data, { x: x2 = identity$13, ...options } = {}) {
  return new Text(data, maybeIntervalMidY({ ...options, x: x2 }));
}
function textY(data, { y: y2 = identity$13, ...options } = {}) {
  return new Text(data, maybeIntervalMidX({ ...options, y: y2 }));
}
function applyIndirectTextStyles(selection2, mark, T) {
  applyAttr(selection2, "text-anchor", mark.textAnchor);
  applyAttr(selection2, "font-family", mark.fontFamily);
  applyAttr(selection2, "font-size", mark.fontSize);
  applyAttr(selection2, "font-style", mark.fontStyle);
  applyAttr(selection2, "font-variant", mark.fontVariant === void 0 ? inferFontVariant$1(T) : mark.fontVariant);
  applyAttr(selection2, "font-weight", mark.fontWeight);
}
function inferFontVariant$1(T) {
  return T && (isNumeric(T) || isTemporal(T)) ? "tabular-nums" : void 0;
}
var fontSizes = /* @__PURE__ */ new Set([
  // global keywords
  "inherit",
  "initial",
  "revert",
  "unset",
  // absolute keywords
  "xx-small",
  "x-small",
  "small",
  "medium",
  "large",
  "x-large",
  "xx-large",
  "xxx-large",
  // relative keywords
  "larger",
  "smaller"
]);
function maybeFontSizeChannel(fontSize) {
  if (fontSize == null || typeof fontSize === "number") return [void 0, fontSize];
  if (typeof fontSize !== "string") return [fontSize, void 0];
  fontSize = fontSize.trim().toLowerCase();
  return fontSizes.has(fontSize) || /^[+-]?\d*\.?\d+(e[+-]?\d+)?(\w*|%)$/.test(fontSize) ? [void 0, fontSize] : [fontSize, void 0];
}
function lineWrap(input, maxWidth, widthof) {
  const lines = [];
  let lineStart, lineEnd = 0;
  for (const [wordStart, wordEnd, required2] of lineBreaks(input)) {
    if (lineStart === void 0) lineStart = wordStart;
    if (lineEnd > lineStart && widthof(input, lineStart, wordEnd) > maxWidth) {
      lines.push(input.slice(lineStart, lineEnd) + (input[lineEnd - 1] === softHyphen ? "-" : ""));
      lineStart = wordStart;
    }
    if (required2) {
      lines.push(input.slice(lineStart, wordEnd));
      lineStart = void 0;
      continue;
    }
    lineEnd = wordEnd;
  }
  return lines;
}
function* lineBreaks(input) {
  let i = 0, j = 0;
  const n = input.length;
  while (j < n) {
    let k2 = 1;
    switch (input[j]) {
      case softHyphen:
      case "-":
        ++j;
        yield [i, j, false];
        i = j;
        break;
      case " ":
        yield [i, j, false];
        while (input[++j] === " ") ;
        i = j;
        break;
      case "\r":
        if (input[j + 1] === "\n") ++k2;
      // falls through
      case "\n":
        yield [i, j, true];
        j += k2;
        i = j;
        break;
      default:
        ++j;
        break;
    }
  }
  yield [i, j, true];
}
var defaultWidthMap = {
  a: 56,
  b: 63,
  c: 57,
  d: 63,
  e: 58,
  f: 37,
  g: 62,
  h: 60,
  i: 26,
  j: 26,
  k: 55,
  l: 26,
  m: 88,
  n: 60,
  o: 60,
  p: 62,
  q: 62,
  r: 39,
  s: 54,
  t: 38,
  u: 60,
  v: 55,
  w: 79,
  x: 54,
  y: 55,
  z: 55,
  A: 69,
  B: 67,
  C: 73,
  D: 74,
  E: 61,
  F: 58,
  G: 76,
  H: 75,
  I: 28,
  J: 55,
  K: 67,
  L: 58,
  M: 89,
  N: 75,
  O: 78,
  P: 65,
  Q: 78,
  R: 67,
  S: 65,
  T: 65,
  U: 75,
  V: 69,
  W: 98,
  X: 69,
  Y: 67,
  Z: 67,
  0: 64,
  1: 48,
  2: 62,
  3: 64,
  4: 66,
  5: 63,
  6: 65,
  7: 58,
  8: 65,
  9: 65,
  " ": 29,
  "!": 32,
  '"': 49,
  "'": 31,
  "(": 39,
  ")": 39,
  ",": 31,
  "-": 48,
  ".": 31,
  "/": 32,
  ":": 31,
  ";": 31,
  "?": 52,
  "\u2018": 31,
  "\u2019": 31,
  "\u201C": 47,
  "\u201D": 47,
  "\u2026": 82
};
function defaultWidth(text2, start = 0, end = text2.length) {
  let sum3 = 0;
  for (let i = start; i < end; i = readCharacter(text2, i)) {
    sum3 += defaultWidthMap[text2[i]] ?? (isPictographic(text2, i) ? 120 : defaultWidthMap.e);
  }
  return sum3;
}
function monospaceWidth(text2, start = 0, end = text2.length) {
  let sum3 = 0;
  for (let i = start; i < end; i = readCharacter(text2, i)) {
    sum3 += isPictographic(text2, i) ? 126 : 63;
  }
  return sum3;
}
function splitter2({ monospace, lineWidth, textOverflow }) {
  if (textOverflow != null || lineWidth == Infinity) return (text2) => text2.split(/\r\n?|\n/g);
  const widthof = monospace ? monospaceWidth : defaultWidth;
  const maxWidth = lineWidth * 100;
  return (text2) => lineWrap(text2, maxWidth, widthof);
}
function clipper({ monospace, lineWidth, textOverflow }) {
  if (textOverflow == null || lineWidth == Infinity) return (text2) => text2;
  const widthof = monospace ? monospaceWidth : defaultWidth;
  const maxWidth = lineWidth * 100;
  switch (textOverflow) {
    case "clip-start":
      return (text2) => clipStart(text2, maxWidth, widthof, "");
    case "clip-end":
      return (text2) => clipEnd(text2, maxWidth, widthof, "");
    case "ellipsis-start":
      return (text2) => clipStart(text2, maxWidth, widthof, ellipsis);
    case "ellipsis-middle":
      return (text2) => clipMiddle(text2, maxWidth, widthof, ellipsis);
    case "ellipsis-end":
      return (text2) => clipEnd(text2, maxWidth, widthof, ellipsis);
  }
}
var ellipsis = "\u2026";
function cut(text2, width, widthof, inset) {
  const I = [];
  let w = 0;
  for (let i = 0, j = 0, n = text2.length; i < n; i = j) {
    j = readCharacter(text2, i);
    const l = widthof(text2, i, j);
    if (w + l > width) {
      w += inset;
      while (w > width && i > 0) j = i, i = I.pop(), w -= widthof(text2, i, j);
      return [i, width - w];
    }
    w += l;
    I.push(i);
  }
  return [-1, 0];
}
function clipEnd(text2, width, widthof, ellipsis2) {
  text2 = text2.trim();
  const e = widthof(ellipsis2);
  const [i] = cut(text2, width, widthof, e);
  return i < 0 ? text2 : text2.slice(0, i).trimEnd() + ellipsis2;
}
function clipMiddle(text2, width, widthof, ellipsis2) {
  text2 = text2.trim();
  const w = widthof(text2);
  if (w <= width) return text2;
  const e = widthof(ellipsis2) / 2;
  const [i, ei] = cut(text2, width / 2, widthof, e);
  const [j] = cut(text2, w - width / 2 - ei + e, widthof, -e);
  return j < 0 ? ellipsis2 : text2.slice(0, i).trimEnd() + ellipsis2 + text2.slice(readCharacter(text2, j)).trimStart();
}
function clipStart(text2, width, widthof, ellipsis2) {
  text2 = text2.trim();
  const w = widthof(text2);
  if (w <= width) return text2;
  const e = widthof(ellipsis2);
  const [j] = cut(text2, w - width + e, widthof, -e);
  return j < 0 ? ellipsis2 : ellipsis2 + text2.slice(readCharacter(text2, j)).trimStart();
}
var reCombiner = /[\p{Combining_Mark}\p{Emoji_Modifier}]+/uy;
var rePictographic = /\p{Extended_Pictographic}/uy;
function readCharacter(text2, i) {
  i += isSurrogatePair(text2, i) ? 2 : 1;
  if (isCombiner(text2, i)) i = reCombiner.lastIndex;
  if (isZeroWidthJoiner(text2, i)) return readCharacter(text2, i + 1);
  return i;
}
function isAscii(text2, i) {
  return text2.charCodeAt(i) < 128;
}
function isSurrogatePair(text2, i) {
  const hi = text2.charCodeAt(i);
  if (hi >= 55296 && hi < 56320) {
    const lo = text2.charCodeAt(i + 1);
    return lo >= 56320 && lo < 57344;
  }
  return false;
}
function isZeroWidthJoiner(text2, i) {
  return text2.charCodeAt(i) === 8205;
}
function isCombiner(text2, i) {
  return isAscii(text2, i) ? false : (reCombiner.lastIndex = i, reCombiner.test(text2));
}
function isPictographic(text2, i) {
  return isAscii(text2, i) ? false : (rePictographic.lastIndex = i, rePictographic.test(text2));
}
var defaults$h = {
  ariaLabel: "vector",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinejoin: "round",
  strokeLinecap: "round"
};
var defaultRadius = 3.5;
var wingRatio = defaultRadius * 5;
var shapeArrow = {
  draw(context, l, r) {
    const wing = l * r / wingRatio;
    context.moveTo(0, 0);
    context.lineTo(0, -l);
    context.moveTo(-wing, wing - l);
    context.lineTo(0, -l);
    context.lineTo(wing, wing - l);
  }
};
var shapeSpike = {
  draw(context, l, r) {
    context.moveTo(-r, 0);
    context.lineTo(0, -l);
    context.lineTo(r, 0);
  }
};
var shapes = /* @__PURE__ */ new Map([
  ["arrow", shapeArrow],
  ["spike", shapeSpike]
]);
function isShapeObject(value2) {
  return value2 && typeof value2.draw === "function";
}
function maybeShape(shape) {
  if (isShapeObject(shape)) return shape;
  const value2 = shapes.get(`${shape}`.toLowerCase());
  if (value2) return value2;
  throw new Error(`invalid shape: ${shape}`);
}
var Vector = class extends Mark {
  constructor(data, options = {}) {
    const { x: x2, y: y2, r = defaultRadius, length: length2, rotate, shape = shapeArrow, anchor = "middle", frameAnchor } = options;
    const [vl, cl] = maybeNumberChannel(length2, 12);
    const [vr, cr] = maybeNumberChannel(rotate, 0);
    super(
      data,
      {
        x: { value: x2, scale: "x", optional: true },
        y: { value: y2, scale: "y", optional: true },
        length: { value: vl, scale: "length", optional: true },
        rotate: { value: vr, optional: true }
      },
      options,
      defaults$h
    );
    this.r = +r;
    this.length = cl;
    this.rotate = cr;
    this.shape = maybeShape(shape);
    this.anchor = keyword(anchor, "anchor", ["start", "middle", "end"]);
    this.frameAnchor = maybeFrameAnchor(frameAnchor);
  }
  render(index2, scales, channels, dimensions, context) {
    const { x: x2, y: y2 } = scales;
    const { x: X, y: Y, length: L, rotate: A5 } = channels;
    const { length: length2, rotate, anchor, shape, r } = this;
    const [cx, cy] = applyFrameAnchor(this, dimensions);
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, { x: X && x2, y: Y && y2 }).call(
      (g) => g.selectAll().data(index2).enter().append("path").call(applyDirectStyles, this).attr(
        "transform",
        template`translate(${X ? (i) => X[i] : cx},${Y ? (i) => Y[i] : cy})${A5 ? (i) => ` rotate(${A5[i]})` : rotate ? ` rotate(${rotate})` : ``}${anchor === "start" ? `` : anchor === "end" ? L ? (i) => ` translate(0,${L[i]})` : ` translate(0,${length2})` : L ? (i) => ` translate(0,${L[i] / 2})` : ` translate(0,${length2 / 2})`}`
      ).attr(
        "d",
        L ? (i) => {
          const p = pathRound();
          shape.draw(p, L[i], r);
          return p;
        } : (() => {
          const p = pathRound();
          shape.draw(p, length2, r);
          return p;
        })()
      ).call(applyChannelStyles, this, channels)
    ).node();
  }
};
function vector(data, options = {}) {
  let { x: x2, y: y2, ...rest } = options;
  if (options.frameAnchor === void 0) [x2, y2] = maybeTuple(x2, y2);
  return new Vector(data, { ...rest, x: x2, y: y2 });
}
function vectorX(data, options = {}) {
  const { x: x2 = identity$13, ...rest } = options;
  return new Vector(data, { ...rest, x: x2 });
}
function vectorY(data, options = {}) {
  const { y: y2 = identity$13, ...rest } = options;
  return new Vector(data, { ...rest, y: y2 });
}
function spike(data, options = {}) {
  const {
    shape = shapeSpike,
    stroke = defaults$h.stroke,
    strokeWidth = 1,
    fill = stroke,
    fillOpacity = 0.3,
    anchor = "start",
    ...rest
  } = options;
  return vector(data, { ...rest, shape, stroke, strokeWidth, fill, fillOpacity, anchor });
}
function maybeData(data, options) {
  if (arguments.length < 2 && !isIterable(data)) options = data, data = null;
  if (options === void 0) options = {};
  return [data, options];
}
function maybeAnchor$2({ anchor } = {}, anchors) {
  return anchor === void 0 ? anchors[0] : keyword(anchor, "anchor", anchors);
}
function anchorY(options) {
  return maybeAnchor$2(options, ["left", "right"]);
}
function anchorFy(options) {
  return maybeAnchor$2(options, ["right", "left"]);
}
function anchorX(options) {
  return maybeAnchor$2(options, ["bottom", "top"]);
}
function anchorFx(options) {
  return maybeAnchor$2(options, ["top", "bottom"]);
}
function axisY() {
  const [data, options] = maybeData(...arguments);
  return axisKy("y", anchorY(options), data, options);
}
function axisFy() {
  const [data, options] = maybeData(...arguments);
  return axisKy("fy", anchorFy(options), data, options);
}
function axisX() {
  const [data, options] = maybeData(...arguments);
  return axisKx("x", anchorX(options), data, options);
}
function axisFx() {
  const [data, options] = maybeData(...arguments);
  return axisKx("fx", anchorFx(options), data, options);
}
function axisKy(k2, anchor, data, {
  color: color3 = "currentColor",
  opacity: opacity2 = 1,
  stroke = color3,
  strokeOpacity = opacity2,
  strokeWidth = 1,
  fill = color3,
  fillOpacity = opacity2,
  textAnchor,
  textStroke,
  textStrokeOpacity,
  textStrokeWidth,
  tickSize = k2 === "y" ? 6 : 0,
  tickPadding,
  tickRotate,
  x: x2,
  margin,
  marginTop = margin === void 0 ? 20 : margin,
  marginRight = margin === void 0 ? anchor === "right" ? 40 : 0 : margin,
  marginBottom = margin === void 0 ? 20 : margin,
  marginLeft = margin === void 0 ? anchor === "left" ? 40 : 0 : margin,
  label,
  labelAnchor,
  labelArrow,
  labelOffset,
  ariaLabel = `${k2}-axis`,
  ...options
}) {
  tickSize = number$12(tickSize);
  tickPadding = number$12(tickPadding);
  tickRotate = number$12(tickRotate);
  if (labelAnchor !== void 0) labelAnchor = keyword(labelAnchor, "labelAnchor", ["center", "top", "bottom"]);
  labelArrow = maybeLabelArrow(labelArrow);
  return marks(
    tickSize && !isNoneish(stroke) ? axisTickKy(k2, anchor, data, {
      stroke,
      strokeOpacity,
      strokeWidth,
      tickSize,
      tickPadding,
      tickRotate,
      x: x2,
      ariaLabel,
      ...options
    }) : null,
    !isNoneish(fill) ? axisTextKy(k2, anchor, data, {
      fill,
      fillOpacity,
      stroke: textStroke,
      strokeOpacity: textStrokeOpacity,
      strokeWidth: textStrokeWidth,
      textAnchor,
      tickSize,
      tickPadding,
      tickRotate,
      x: x2,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      ariaLabel,
      ...options
    }) : null,
    !isNoneish(fill) && label !== null ? text(
      [],
      labelOptions({ fill, fillOpacity, ...options }, function(data2, facets, channels, scales, dimensions) {
        const scale2 = scales[k2];
        const { marginTop: marginTop2, marginRight: marginRight2, marginBottom: marginBottom2, marginLeft: marginLeft2 } = k2 === "y" && dimensions.inset || dimensions;
        const cla = labelAnchor ?? (scale2.bandwidth ? "center" : "top");
        const clo = labelOffset ?? (anchor === "right" ? marginRight2 : marginLeft2) - 3;
        if (cla === "center") {
          this.textAnchor = void 0;
          this.lineAnchor = anchor === "right" ? "bottom" : "top";
          this.frameAnchor = anchor;
          this.rotate = -90;
        } else {
          this.textAnchor = anchor === "right" ? "end" : "start";
          this.lineAnchor = cla;
          this.frameAnchor = `${cla}-${anchor}`;
          this.rotate = 0;
        }
        this.dy = cla === "top" ? 3 - marginTop2 : cla === "bottom" ? marginBottom2 - 3 : 0;
        this.dx = anchor === "right" ? clo : -clo;
        this.ariaLabel = `${ariaLabel} label`;
        return {
          facets: [[0]],
          channels: { text: { value: [formatAxisLabel(k2, scale2, { anchor, label, labelAnchor: cla, labelArrow })] } }
        };
      })
    ) : null
  );
}
function axisKx(k2, anchor, data, {
  color: color3 = "currentColor",
  opacity: opacity2 = 1,
  stroke = color3,
  strokeOpacity = opacity2,
  strokeWidth = 1,
  fill = color3,
  fillOpacity = opacity2,
  textAnchor,
  textStroke,
  textStrokeOpacity,
  textStrokeWidth,
  tickSize = k2 === "x" ? 6 : 0,
  tickPadding,
  tickRotate,
  y: y2,
  margin,
  marginTop = margin === void 0 ? anchor === "top" ? 30 : 0 : margin,
  marginRight = margin === void 0 ? 20 : margin,
  marginBottom = margin === void 0 ? anchor === "bottom" ? 30 : 0 : margin,
  marginLeft = margin === void 0 ? 20 : margin,
  label,
  labelAnchor,
  labelArrow,
  labelOffset,
  ariaLabel = `${k2}-axis`,
  ...options
}) {
  tickSize = number$12(tickSize);
  tickPadding = number$12(tickPadding);
  tickRotate = number$12(tickRotate);
  if (labelAnchor !== void 0) labelAnchor = keyword(labelAnchor, "labelAnchor", ["center", "left", "right"]);
  labelArrow = maybeLabelArrow(labelArrow);
  return marks(
    tickSize && !isNoneish(stroke) ? axisTickKx(k2, anchor, data, {
      stroke,
      strokeOpacity,
      strokeWidth,
      tickSize,
      tickPadding,
      tickRotate,
      y: y2,
      ariaLabel,
      ...options
    }) : null,
    !isNoneish(fill) ? axisTextKx(k2, anchor, data, {
      fill,
      fillOpacity,
      stroke: textStroke,
      strokeOpacity: textStrokeOpacity,
      strokeWidth: textStrokeWidth,
      textAnchor,
      tickSize,
      tickPadding,
      tickRotate,
      y: y2,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      ariaLabel,
      ...options
    }) : null,
    !isNoneish(fill) && label !== null ? text(
      [],
      labelOptions({ fill, fillOpacity, ...options }, function(data2, facets, channels, scales, dimensions) {
        const scale2 = scales[k2];
        const { marginTop: marginTop2, marginRight: marginRight2, marginBottom: marginBottom2, marginLeft: marginLeft2 } = k2 === "x" && dimensions.inset || dimensions;
        const cla = labelAnchor ?? (scale2.bandwidth ? "center" : "right");
        const clo = labelOffset ?? (anchor === "top" ? marginTop2 : marginBottom2) - 3;
        if (cla === "center") {
          this.frameAnchor = anchor;
          this.textAnchor = void 0;
        } else {
          this.frameAnchor = `${anchor}-${cla}`;
          this.textAnchor = cla === "right" ? "end" : "start";
        }
        this.lineAnchor = anchor;
        this.dy = anchor === "top" ? -clo : clo;
        this.dx = cla === "right" ? marginRight2 - 3 : cla === "left" ? 3 - marginLeft2 : 0;
        this.ariaLabel = `${ariaLabel} label`;
        return {
          facets: [[0]],
          channels: { text: { value: [formatAxisLabel(k2, scale2, { anchor, label, labelAnchor: cla, labelArrow })] } }
        };
      })
    ) : null
  );
}
function axisTickKy(k2, anchor, data, {
  strokeWidth = 1,
  strokeLinecap = null,
  strokeLinejoin = null,
  facetAnchor = anchor + (k2 === "y" ? "-empty" : ""),
  frameAnchor = anchor,
  tickSize,
  inset = 0,
  insetLeft = inset,
  insetRight = inset,
  dx = 0,
  y: y2 = k2 === "y" ? void 0 : null,
  ariaLabel,
  ...options
}) {
  return axisMark(
    vectorY,
    k2,
    data,
    {
      ariaLabel: `${ariaLabel} tick`,
      ariaHidden: true
    },
    {
      strokeWidth,
      strokeLinecap,
      strokeLinejoin,
      facetAnchor,
      frameAnchor,
      y: y2,
      ...options,
      dx: anchor === "left" ? +dx - offset + +insetLeft : +dx + offset - insetRight,
      anchor: "start",
      length: tickSize,
      shape: anchor === "left" ? shapeTickLeft : shapeTickRight
    }
  );
}
function axisTickKx(k2, anchor, data, {
  strokeWidth = 1,
  strokeLinecap = null,
  strokeLinejoin = null,
  facetAnchor = anchor + (k2 === "x" ? "-empty" : ""),
  frameAnchor = anchor,
  tickSize,
  inset = 0,
  insetTop = inset,
  insetBottom = inset,
  dy = 0,
  x: x2 = k2 === "x" ? void 0 : null,
  ariaLabel,
  ...options
}) {
  return axisMark(
    vectorX,
    k2,
    data,
    {
      ariaLabel: `${ariaLabel} tick`,
      ariaHidden: true
    },
    {
      strokeWidth,
      strokeLinejoin,
      strokeLinecap,
      facetAnchor,
      frameAnchor,
      x: x2,
      ...options,
      dy: anchor === "bottom" ? +dy - offset - insetBottom : +dy + offset + +insetTop,
      anchor: "start",
      length: tickSize,
      shape: anchor === "bottom" ? shapeTickBottom : shapeTickTop
    }
  );
}
function axisTextKy(k2, anchor, data, {
  facetAnchor = anchor + (k2 === "y" ? "-empty" : ""),
  frameAnchor = anchor,
  tickSize,
  tickRotate = 0,
  tickPadding = Math.max(3, 9 - tickSize) + (Math.abs(tickRotate) > 60 ? 4 * Math.cos(tickRotate * radians3) : 0),
  text: text2,
  textAnchor = Math.abs(tickRotate) > 60 ? "middle" : anchor === "left" ? "end" : "start",
  lineAnchor = tickRotate > 60 ? "top" : tickRotate < -60 ? "bottom" : "middle",
  fontVariant,
  inset = 0,
  insetLeft = inset,
  insetRight = inset,
  dx = 0,
  ariaLabel,
  y: y2 = k2 === "y" ? void 0 : null,
  ...options
}) {
  return axisMark(
    textY,
    k2,
    data,
    { ariaLabel: `${ariaLabel} tick label` },
    {
      facetAnchor,
      frameAnchor,
      text: text2,
      textAnchor,
      lineAnchor,
      fontVariant,
      rotate: tickRotate,
      y: y2,
      ...options,
      dx: anchor === "left" ? +dx - tickSize - tickPadding + +insetLeft : +dx + +tickSize + +tickPadding - insetRight
    },
    function(scale2, data2, ticks2, tickFormat2, channels) {
      if (fontVariant === void 0) this.fontVariant = inferFontVariant(scale2);
      if (text2 === void 0) channels.text = inferTextChannel(scale2, data2, ticks2, tickFormat2, anchor);
    }
  );
}
function axisTextKx(k2, anchor, data, {
  facetAnchor = anchor + (k2 === "x" ? "-empty" : ""),
  frameAnchor = anchor,
  tickSize,
  tickRotate = 0,
  tickPadding = Math.max(3, 9 - tickSize) + (Math.abs(tickRotate) >= 10 ? 4 * Math.cos(tickRotate * radians3) : 0),
  text: text2,
  textAnchor = Math.abs(tickRotate) >= 10 ? tickRotate < 0 ^ anchor === "bottom" ? "start" : "end" : "middle",
  lineAnchor = Math.abs(tickRotate) >= 10 ? "middle" : anchor === "bottom" ? "top" : "bottom",
  fontVariant,
  inset = 0,
  insetTop = inset,
  insetBottom = inset,
  dy = 0,
  x: x2 = k2 === "x" ? void 0 : null,
  ariaLabel,
  ...options
}) {
  return axisMark(
    textX,
    k2,
    data,
    { ariaLabel: `${ariaLabel} tick label` },
    {
      facetAnchor,
      frameAnchor,
      text: text2 === void 0 ? null : text2,
      textAnchor,
      lineAnchor,
      fontVariant,
      rotate: tickRotate,
      x: x2,
      ...options,
      dy: anchor === "bottom" ? +dy + +tickSize + +tickPadding - insetBottom : +dy - tickSize - tickPadding + +insetTop
    },
    function(scale2, data2, ticks2, tickFormat2, channels) {
      if (fontVariant === void 0) this.fontVariant = inferFontVariant(scale2);
      if (text2 === void 0) channels.text = inferTextChannel(scale2, data2, ticks2, tickFormat2, anchor);
    }
  );
}
function gridY() {
  const [data, options] = maybeData(...arguments);
  return gridKy("y", anchorY(options), data, options);
}
function gridFy() {
  const [data, options] = maybeData(...arguments);
  return gridKy("fy", anchorFy(options), data, options);
}
function gridX() {
  const [data, options] = maybeData(...arguments);
  return gridKx("x", anchorX(options), data, options);
}
function gridFx() {
  const [data, options] = maybeData(...arguments);
  return gridKx("fx", anchorFx(options), data, options);
}
function gridKy(k2, anchor, data, {
  y: y2 = k2 === "y" ? void 0 : null,
  x: x2 = null,
  x1: x12 = anchor === "left" ? x2 : null,
  x2: x22 = anchor === "right" ? x2 : null,
  ariaLabel = `${k2}-grid`,
  ariaHidden = true,
  ...options
}) {
  return axisMark(ruleY, k2, data, { ariaLabel, ariaHidden }, { y: y2, x1: x12, x2: x22, ...gridDefaults(options) });
}
function gridKx(k2, anchor, data, {
  x: x2 = k2 === "x" ? void 0 : null,
  y: y2 = null,
  y1: y12 = anchor === "top" ? y2 : null,
  y2: y22 = anchor === "bottom" ? y2 : null,
  ariaLabel = `${k2}-grid`,
  ariaHidden = true,
  ...options
}) {
  return axisMark(ruleX, k2, data, { ariaLabel, ariaHidden }, { x: x2, y1: y12, y2: y22, ...gridDefaults(options) });
}
function gridDefaults({
  color: color3 = "currentColor",
  opacity: opacity2 = 0.1,
  stroke = color3,
  strokeOpacity = opacity2,
  strokeWidth = 1,
  ...options
}) {
  return { stroke, strokeOpacity, strokeWidth, ...options };
}
function labelOptions({
  fill,
  fillOpacity,
  fontFamily,
  fontSize,
  fontStyle,
  fontVariant,
  fontWeight,
  monospace,
  pointerEvents,
  shapeRendering,
  clip: clip2 = false
}, initializer2) {
  [, fill] = maybeColorChannel(fill);
  [, fillOpacity] = maybeNumberChannel(fillOpacity);
  return {
    facet: "super",
    x: null,
    y: null,
    fill,
    fillOpacity,
    fontFamily,
    fontSize,
    fontStyle,
    fontVariant,
    fontWeight,
    monospace,
    pointerEvents,
    shapeRendering,
    clip: clip2,
    initializer: initializer2
  };
}
function axisMark(mark, k2, data, properties, options, initialize) {
  let channels;
  function axisInitializer(data2, facets, _channels, scales, dimensions, context) {
    const initializeFacets = data2 == null && (k2 === "fx" || k2 === "fy");
    const { [k2]: scale2 } = scales;
    if (!scale2) throw new Error(`missing scale: ${k2}`);
    const domain = scale2.domain();
    let { interval, ticks: ticks2, tickFormat: tickFormat2, tickSpacing = k2 === "x" ? 80 : 35 } = options;
    if (typeof ticks2 === "string" && hasTemporalDomain(scale2)) interval = ticks2, ticks2 = void 0;
    if (ticks2 === void 0) ticks2 = maybeRangeInterval(interval, scale2.type) ?? inferTickCount(scale2, tickSpacing);
    if (data2 == null) {
      if (isIterable(ticks2)) {
        data2 = arrayify2(ticks2);
      } else if (isInterval(ticks2)) {
        data2 = inclusiveRange(ticks2, ...extent(domain));
      } else if (scale2.interval) {
        let interval2 = scale2.interval;
        if (scale2.ticks) {
          const [min3, max2] = extent(domain);
          const n = (max2 - min3) / interval2[intervalDuration];
          interval2 = generalizeTimeInterval(interval2, n / ticks2) ?? interval2;
          data2 = inclusiveRange(interval2, min3, max2);
        } else {
          data2 = domain;
          const n = data2.length;
          interval2 = generalizeTimeInterval(interval2, n / ticks2) ?? interval2;
          if (interval2 !== scale2.interval) data2 = inclusiveRange(interval2, ...extent(data2));
        }
        if (interval2 === scale2.interval) {
          const n = Math.round(data2.length / ticks2);
          if (n > 1) data2 = data2.filter((d, i) => i % n === 0);
        }
      } else if (scale2.ticks) {
        data2 = scale2.ticks(ticks2);
      } else {
        data2 = domain;
      }
      if (!scale2.ticks && data2.length && data2 !== domain) {
        const domainSet = new InternSet(domain);
        data2 = data2.filter((d) => domainSet.has(d));
        if (!data2.length) warn(`Warning: the ${k2}-axis ticks appear to not align with the scale domain, resulting in no ticks. Try different ticks?`);
      }
      if (k2 === "y" || k2 === "x") {
        facets = [range2(data2)];
      } else {
        channels[k2] = { scale: k2, value: identity$13 };
      }
    }
    initialize?.call(this, scale2, data2, ticks2, tickFormat2, channels);
    const initializedChannels = Object.fromEntries(
      Object.entries(channels).map(([name, channel]) => {
        return [name, { ...channel, value: valueof(data2, channel.value) }];
      })
    );
    if (initializeFacets) facets = context.filterFacets(data2, initializedChannels);
    return { data: data2, facets, channels: initializedChannels };
  }
  const basicInitializer = initializer(options).initializer;
  const m = mark(data, initializer({ ...options, initializer: axisInitializer }, basicInitializer));
  if (data == null) {
    channels = m.channels;
    m.channels = {};
  } else {
    channels = {};
  }
  if (properties !== void 0) Object.assign(m, properties);
  if (m.clip === void 0) m.clip = false;
  return m;
}
function inferTickCount(scale2, tickSpacing) {
  const [min3, max2] = extent(scale2.range());
  return (max2 - min3) / tickSpacing;
}
function inferTextChannel(scale2, data, ticks2, tickFormat2, anchor) {
  return { value: inferTickFormat(scale2, data, ticks2, tickFormat2, anchor) };
}
function inferTickFormat(scale2, data, ticks2, tickFormat2, anchor) {
  return typeof tickFormat2 === "function" && !(scale2.type === "log" && scale2.tickFormat) ? tickFormat2 : tickFormat2 === void 0 && data && isTemporal(data) ? inferTimeFormat(scale2.type, data, anchor) ?? formatDefault : tickFormat2 === void 0 && data && isYearIntegers(data) ? String : scale2.tickFormat ? scale2.tickFormat(typeof ticks2 === "number" ? ticks2 : null, tickFormat2) : typeof tickFormat2 === "string" && scale2.domain().length > 0 ? (isTemporal(scale2.domain()) ? utcFormat : format)(tickFormat2) : tickFormat2 === void 0 ? formatDefault : constant5(tickFormat2);
}
function inclusiveRange(interval, min3, max2) {
  return interval.range(min3, interval.offset(interval.floor(max2)));
}
var shapeTickBottom = {
  draw(context, l) {
    context.moveTo(0, 0);
    context.lineTo(0, l);
  }
};
var shapeTickTop = {
  draw(context, l) {
    context.moveTo(0, 0);
    context.lineTo(0, -l);
  }
};
var shapeTickLeft = {
  draw(context, l) {
    context.moveTo(0, 0);
    context.lineTo(-l, 0);
  }
};
var shapeTickRight = {
  draw(context, l) {
    context.moveTo(0, 0);
    context.lineTo(l, 0);
  }
};
function inferFontVariant(scale2) {
  return scale2.bandwidth && !scale2.interval ? void 0 : "tabular-nums";
}
function formatAxisLabel(k2, scale2, { anchor, label = scale2.label, labelAnchor, labelArrow } = {}) {
  if (label == null || label.inferred && hasTemporalDomain(scale2) && /^(date|time|year)$/i.test(label)) return;
  label = String(label);
  if (labelArrow === "auto") labelArrow = (!scale2.bandwidth || scale2.interval) && !/[↑↓→←]/.test(label);
  if (!labelArrow) return label;
  if (labelArrow === true) {
    const order = inferScaleOrder(scale2);
    if (order)
      labelArrow = /x$/.test(k2) || labelAnchor === "center" ? /x$/.test(k2) === order < 0 ? "left" : "right" : order < 0 ? "up" : "down";
  }
  switch (labelArrow) {
    case "left":
      return `\u2190 ${label}`;
    case "right":
      return `${label} \u2192`;
    case "up":
      return anchor === "right" ? `${label} \u2191` : `\u2191 ${label}`;
    case "down":
      return anchor === "right" ? `${label} \u2193` : `\u2193 ${label}`;
  }
  return label;
}
function maybeLabelArrow(labelArrow = "auto") {
  return isNoneish(labelArrow) ? false : typeof labelArrow === "boolean" ? labelArrow : keyword(labelArrow, "labelArrow", ["auto", "up", "right", "down", "left"]);
}
function hasTemporalDomain(scale2) {
  return isTemporal(scale2.domain());
}
function maybeScale(scale2, key) {
  if (key == null) return key;
  const s2 = scale2(key);
  if (!s2) throw new Error(`scale not found: ${key}`);
  return s2;
}
function legendSwatches(color3, { opacity: opacity2, ...options } = {}) {
  if (!isOrdinalScale(color3) && !isThresholdScale(color3))
    throw new Error(`swatches legend requires ordinal or threshold color scale (not ${color3.type})`);
  return legendItems(
    color3,
    options,
    (selection2, scale2, width, height) => selection2.append("svg").attr("width", width).attr("height", height).attr("fill", color3.key === "opacity" ? color3.color : null).attr("fill-opacity", maybeNumberChannel(opacity2)[1]).attr(color3.key === "opacity" ? "fill-opacity" : "fill", scale2.scale).append("rect").attr("width", "100%").attr("height", "100%")
  );
}
var legendSymbolColor = /* @__PURE__ */ new WeakSet();
function legendSymbols(symbol2, {
  fill = symbol2.hint?.fill !== void 0 ? symbol2.hint.fill : "none",
  fillOpacity = 1,
  stroke = symbol2.hint?.stroke !== void 0 ? symbol2.hint.stroke : isNoneish(fill) ? "currentColor" : "none",
  strokeOpacity = 1,
  strokeWidth = 1.5,
  r = 4.5,
  ...options
} = {}, scale2) {
  const [vf, cf] = maybeColorChannel(fill);
  const [vs, cs] = maybeColorChannel(stroke);
  const sf = maybeScale(scale2, vf);
  const ss = maybeScale(scale2, vs);
  const size = r * r * Math.PI;
  fillOpacity = maybeNumberChannel(fillOpacity)[1];
  strokeOpacity = maybeNumberChannel(strokeOpacity)[1];
  strokeWidth = maybeNumberChannel(strokeWidth)[1];
  const legend2 = legendItems(
    symbol2,
    options,
    (selection2, scale3, width, height) => selection2.append("svg").attr("viewBox", "-8 -8 16 16").attr("width", width).attr("height", height).attr("fill", vf === "color" ? (d) => sf.scale(d) : cf).attr("fill-opacity", fillOpacity).attr("stroke", vs === "color" ? (d) => ss.scale(d) : cs).attr("stroke-opacity", strokeOpacity).attr("stroke-width", strokeWidth).append("path").attr("d", (d) => {
      const p = pathRound();
      symbol2.scale(d).draw(p, size);
      return p;
    })
  );
  if (vf === "color" || vs === "color") legendSymbolColor.add(legend2);
  return legend2;
}
function isSymbolColorLegend(legend2) {
  return legendSymbolColor.has(legend2);
}
function legendItems(scale2, options = {}, swatch) {
  let {
    columns,
    tickFormat: tickFormat2,
    fontVariant = inferFontVariant$2(scale2),
    // TODO label,
    swatchSize = 15,
    swatchWidth = swatchSize,
    swatchHeight = swatchSize,
    marginLeft = 0,
    className,
    style,
    width
  } = options;
  const context = createContext(options);
  className = maybeClassName(className);
  tickFormat2 = inferTickFormat(scale2.scale, scale2.domain, void 0, tickFormat2);
  const swatches = create("div", context).attr(
    "class",
    `${className}-swatches ${className}-swatches-${columns != null ? "columns" : "wrap"}`
  );
  let extraStyle;
  if (columns != null) {
    extraStyle = `:where(.${className}-swatches-columns .${className}-swatch) {
  display: flex;
  align-items: center;
  break-inside: avoid;
  padding-bottom: 1px;
}
:where(.${className}-swatches-columns .${className}-swatch::before) {
  flex-shrink: 0;
}
:where(.${className}-swatches-columns .${className}-swatch-label) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}`;
    swatches.style("columns", columns).selectAll().data(scale2.domain).enter().append("div").attr("class", `${className}-swatch`).call(swatch, scale2, swatchWidth, swatchHeight).call(
      (item) => item.append("div").attr("class", `${className}-swatch-label`).attr("title", tickFormat2).text(tickFormat2)
    );
  } else {
    extraStyle = `:where(.${className}-swatches-wrap) {
  display: flex;
  align-items: center;
  min-height: 33px;
  flex-wrap: wrap;
}
:where(.${className}-swatches-wrap .${className}-swatch) {
  display: inline-flex;
  align-items: center;
  margin-right: 1em;
}`;
    swatches.selectAll().data(scale2.domain).enter().append("span").attr("class", `${className}-swatch`).call(swatch, scale2, swatchWidth, swatchHeight).append(function() {
      return this.ownerDocument.createTextNode(tickFormat2.apply(this, arguments));
    });
  }
  return swatches.call(
    (div) => div.insert("style", "*").text(
      `:where(.${className}-swatches) {
  font-family: system-ui, sans-serif;
  font-size: 10px;
  margin-bottom: 0.5em;
}
:where(.${className}-swatch > svg) {
  margin-right: 0.5em;
  overflow: visible;
}
${extraStyle}`
    )
  ).style("margin-left", marginLeft ? `${+marginLeft}px` : null).style("width", width === void 0 ? null : `${+width}px`).style("font-variant", impliedString(fontVariant, "normal")).call(applyInlineStyles, style).node();
}
var legendRegistry = /* @__PURE__ */ new Map([
  ["symbol", legendSymbols],
  ["color", legendColor],
  ["opacity", legendOpacity]
]);
function legend(options = {}) {
  for (const [key, value2] of legendRegistry) {
    const scale2 = options[key];
    if (isScaleOptions(scale2)) {
      const context = createContext(options);
      let hint;
      if (key === "symbol") {
        const { fill, stroke = fill === void 0 && isScaleOptions(options.color) ? "color" : void 0 } = options;
        hint = { fill, stroke };
      }
      return value2(
        normalizeScale(key, scale2, hint),
        legendOptions(context, scale2, options),
        (key2) => isScaleOptions(options[key2]) ? normalizeScale(key2, options[key2]) : null
      );
    }
  }
  throw new Error("unknown legend type; no scale found");
}
function exposeLegends(scales, context, defaults2 = {}) {
  return (key, options) => {
    if (!legendRegistry.has(key)) throw new Error(`unknown legend type: ${key}`);
    if (!(key in scales)) return;
    return legendRegistry.get(key)(scales[key], legendOptions(context, defaults2[key], options), (key2) => scales[key2]);
  };
}
function legendOptions({ className, ...context }, { label, ticks: ticks2, tickFormat: tickFormat2 } = {}, options) {
  return inherit(options, { className, ...context }, { label, ticks: ticks2, tickFormat: tickFormat2 });
}
function legendColor(color3, { legend: legend2 = true, ...options }) {
  if (legend2 === true) legend2 = color3.type === "ordinal" ? "swatches" : "ramp";
  if (color3.domain === void 0) return;
  switch (`${legend2}`.toLowerCase()) {
    case "swatches":
      return legendSwatches(color3, options);
    case "ramp":
      return legendRamp(color3, options);
    default:
      throw new Error(`unknown color legend type: ${legend2}`);
  }
}
function legendOpacity(opacity2, { legend: legend2 = true, color: color3 = "currentColor", ...options }) {
  if (legend2 === true) legend2 = opacity2.type === "ordinal" ? "swatches" : "ramp";
  opacity2 = { ...opacity2, color: color3, key: "opacity" };
  switch (`${legend2}`.toLowerCase()) {
    case "swatches": {
      return legendSwatches(opacity2, options);
    }
    case "ramp": {
      const legend3 = legendRamp(opacity2, options);
      const fid = getFilterId();
      const svg = select(legend3);
      svg.select("image").attr("filter", `url(#${fid})`);
      const filter3 = svg.append("filter").attr("id", fid);
      filter3.append("feFlood").attr("flood-color", color3);
      filter3.append("feComposite").attr("in2", "SourceGraphic").attr("operator", "in");
      return legend3;
    }
    default:
      throw new Error(`unknown opacity legend type: ${legend2}`);
  }
}
function createLegends(scales, context, options) {
  const legends = [];
  let hasColor = false;
  for (const [key, value2] of legendRegistry) {
    if (!(key in scales)) continue;
    if (key === "color" && hasColor) continue;
    const o = inherit(options[key], { legend: options.legend });
    if (!o.legend) continue;
    const legend2 = value2(scales[key], legendOptions(context, scales[key], o), (key2) => scales[key2]);
    if (legend2 == null) continue;
    if (key === "symbol" && isSymbolColorLegend(legend2)) hasColor = true;
    legends.push(legend2);
  }
  return legends;
}
function maybeIdentityX(options) {
  return hasX(options) ? options : { ...options, x: identity$13 };
}
function maybeIdentityY(options) {
  return hasY(options) ? options : { ...options, y: identity$13 };
}
function exclusiveFacets(data, facets) {
  if (facets.length === 1) return { data, facets };
  const n = lengthof(data);
  const O = new Uint8Array(n);
  let overlaps = 0;
  for (const facet of facets) {
    for (const i of facet) {
      if (O[i]) ++overlaps;
      O[i] = 1;
    }
  }
  if (overlaps === 0) return { data, facets };
  data = slice4(data);
  const R = data[reindex] = new Uint32Array(n + overlaps);
  facets = facets.map((facet) => slice4(facet, Uint32Array));
  let j = n;
  O.fill(0);
  for (const facet of facets) {
    for (let k2 = 0, m = facet.length; k2 < m; ++k2) {
      const i = facet[k2];
      if (O[i]) facet[k2] = j, data[j] = data[i], R[j] = i, ++j;
      else R[i] = i;
      O[i] = 1;
    }
  }
  return { data, facets };
}
function stackX(stackOptions = {}, options = {}) {
  if (arguments.length === 1) [stackOptions, options] = mergeOptions$2(stackOptions);
  const { y1: y12, y: y2 = y12, x: x2, ...rest } = options;
  const [transform2, Y, x12, x22] = stack(y2, x2, "y", "x", stackOptions, rest);
  return { ...transform2, y1: y12, y: Y, x1: x12, x2: x22, x: mid(x12, x22) };
}
function stackX1(stackOptions = {}, options = {}) {
  if (arguments.length === 1) [stackOptions, options] = mergeOptions$2(stackOptions);
  const { y1: y12, y: y2 = y12, x: x2 } = options;
  const [transform2, Y, X] = stack(y2, x2, "y", "x", stackOptions, options);
  return { ...transform2, y1: y12, y: Y, x: X };
}
function stackX2(stackOptions = {}, options = {}) {
  if (arguments.length === 1) [stackOptions, options] = mergeOptions$2(stackOptions);
  const { y1: y12, y: y2 = y12, x: x2 } = options;
  const [transform2, Y, , X] = stack(y2, x2, "y", "x", stackOptions, options);
  return { ...transform2, y1: y12, y: Y, x: X };
}
function stackY(stackOptions = {}, options = {}) {
  if (arguments.length === 1) [stackOptions, options] = mergeOptions$2(stackOptions);
  const { x1: x12, x: x2 = x12, y: y2, ...rest } = options;
  const [transform2, X, y12, y22] = stack(x2, y2, "x", "y", stackOptions, rest);
  return { ...transform2, x1: x12, x: X, y1: y12, y2: y22, y: mid(y12, y22) };
}
function stackY1(stackOptions = {}, options = {}) {
  if (arguments.length === 1) [stackOptions, options] = mergeOptions$2(stackOptions);
  const { x1: x12, x: x2 = x12, y: y2 } = options;
  const [transform2, X, Y] = stack(x2, y2, "x", "y", stackOptions, options);
  return { ...transform2, x1: x12, x: X, y: Y };
}
function stackY2(stackOptions = {}, options = {}) {
  if (arguments.length === 1) [stackOptions, options] = mergeOptions$2(stackOptions);
  const { x1: x12, x: x2 = x12, y: y2 } = options;
  const [transform2, X, , Y] = stack(x2, y2, "x", "y", stackOptions, options);
  return { ...transform2, x1: x12, x: X, y: Y };
}
function maybeStackX({ x: x2, x1: x12, x2: x22, ...options } = {}) {
  options = withTip(options, "y");
  if (x12 === void 0 && x22 === void 0) return stackX({ x: x2, ...options });
  [x12, x22] = maybeZero(x2, x12, x22);
  return { ...options, x1: x12, x2: x22 };
}
function maybeStackY({ y: y2, y1: y12, y2: y22, ...options } = {}) {
  options = withTip(options, "x");
  if (y12 === void 0 && y22 === void 0) return stackY({ y: y2, ...options });
  [y12, y22] = maybeZero(y2, y12, y22);
  return { ...options, y1: y12, y2: y22 };
}
function mergeOptions$2(options) {
  const { offset: offset2, order, reverse: reverse3, ...rest } = options;
  return [{ offset: offset2, order, reverse: reverse3 }, rest];
}
var lengthy = { length: true };
function stack(x2, y2 = one2, kx2, ky2, { offset: offset2, order, reverse: reverse3 }, options) {
  if (y2 === null) throw new Error(`stack requires ${ky2}`);
  const z = maybeZ(options);
  const [X, setX] = maybeColumn(x2);
  const [Y12, setY1] = column(y2);
  const [Y22, setY2] = column(y2);
  Y12.hint = Y22.hint = lengthy;
  offset2 = maybeOffset(offset2);
  order = maybeOrder(order, offset2, ky2);
  return [
    basic(options, (data, facets, plotOptions) => {
      ({ data, facets } = exclusiveFacets(data, facets));
      const X3 = x2 == null ? void 0 : setX(maybeApplyInterval(valueof(data, x2), plotOptions?.[kx2]));
      const Y = valueof(data, y2, Float64Array);
      const Z = valueof(data, z);
      const compare = order && order(data, X3, Y, Z);
      const n = lengthof(data);
      const Y13 = setY1(new Float64Array(n).fill(NaN));
      const Y23 = setY2(new Float64Array(n).fill(NaN));
      const facetstacks = [];
      for (const facet of facets) {
        const stacks = X3 ? Array.from(group(facet, (i) => X3[i]).values()) : [facet];
        if (compare) for (const stack2 of stacks) stack2.sort(compare);
        for (const stack2 of stacks) {
          let yn = 0;
          let yp = 0;
          if (reverse3) stack2.reverse();
          for (const i of stack2) {
            const y3 = Y[i];
            if (y3 < 0) yn = Y23[i] = (Y13[i] = yn) + y3;
            else if (y3 >= 0) yp = Y23[i] = (Y13[i] = yp) + y3;
          }
        }
        facetstacks.push(stacks);
      }
      if (offset2) offset2(facetstacks, Y13, Y23, Z);
      return { data, facets };
    }),
    X,
    Y12,
    Y22
  ];
}
function maybeOffset(offset2) {
  if (offset2 == null) return;
  if (typeof offset2 === "function") return offset2;
  switch (`${offset2}`.toLowerCase()) {
    case "expand":
    case "normalize":
      return offsetExpand;
    case "center":
    case "silhouette":
      return offsetCenter;
    case "wiggle":
      return offsetWiggle;
  }
  throw new Error(`unknown offset: ${offset2}`);
}
function extent2(stack2, Y22) {
  let min3 = 0, max2 = 0;
  for (const i of stack2) {
    const y2 = Y22[i];
    if (y2 < min3) min3 = y2;
    if (y2 > max2) max2 = y2;
  }
  return [min3, max2];
}
function offsetExpand(facetstacks, Y12, Y22) {
  for (const stacks of facetstacks) {
    for (const stack2 of stacks) {
      const [yn, yp] = extent2(stack2, Y22);
      for (const i of stack2) {
        const m = 1 / (yp - yn || 1);
        Y12[i] = m * (Y12[i] - yn);
        Y22[i] = m * (Y22[i] - yn);
      }
    }
  }
}
function offsetCenter(facetstacks, Y12, Y22) {
  for (const stacks of facetstacks) {
    for (const stack2 of stacks) {
      const [yn, yp] = extent2(stack2, Y22);
      for (const i of stack2) {
        const m = (yp + yn) / 2;
        Y12[i] -= m;
        Y22[i] -= m;
      }
    }
    offsetZero(stacks, Y12, Y22);
  }
  offsetCenterFacets(facetstacks, Y12, Y22);
}
function offsetWiggle(facetstacks, Y12, Y22, Z) {
  for (const stacks of facetstacks) {
    const prev = new InternMap();
    let y2 = 0;
    for (const stack2 of stacks) {
      let j = -1;
      const Fi = stack2.map((i) => Math.abs(Y22[i] - Y12[i]));
      const Df = stack2.map((i) => {
        j = Z ? Z[i] : ++j;
        const value2 = Y22[i] - Y12[i];
        const diff = prev.has(j) ? value2 - prev.get(j) : 0;
        prev.set(j, value2);
        return diff;
      });
      const Cf1 = [0, ...cumsum(Df)];
      for (const i of stack2) {
        Y12[i] += y2;
        Y22[i] += y2;
      }
      const s1 = sum(Fi);
      if (s1) y2 -= sum(Fi, (d, i) => (Df[i] / 2 + Cf1[i]) * d) / s1;
    }
    offsetZero(stacks, Y12, Y22);
  }
  offsetCenterFacets(facetstacks, Y12, Y22);
}
function offsetZero(stacks, Y12, Y22) {
  const m = min(stacks, (stack2) => min(stack2, (i) => Y12[i]));
  for (const stack2 of stacks) {
    for (const i of stack2) {
      Y12[i] -= m;
      Y22[i] -= m;
    }
  }
}
function offsetCenterFacets(facetstacks, Y12, Y22) {
  const n = facetstacks.length;
  if (n === 1) return;
  const facets = facetstacks.map((stacks) => stacks.flat());
  const m = facets.map((I) => (min(I, (i) => Y12[i]) + max(I, (i) => Y22[i])) / 2);
  const m0 = min(m);
  for (let j = 0; j < n; j++) {
    const p = m0 - m[j];
    for (const i of facets[j]) {
      Y12[i] += p;
      Y22[i] += p;
    }
  }
}
function maybeOrder(order, offset2, ky2) {
  if (order === void 0 && offset2 === offsetWiggle) return orderInsideOut(ascendingDefined2);
  if (order == null) return;
  if (typeof order === "string") {
    const negate = order.startsWith("-");
    const compare = negate ? descendingDefined : ascendingDefined2;
    switch ((negate ? order.slice(1) : order).toLowerCase()) {
      case "value":
      case ky2:
        return orderY(compare);
      case "z":
        return orderZ(compare);
      case "sum":
        return orderSum(compare);
      case "appearance":
        return orderAppearance(compare);
      case "inside-out":
        return orderInsideOut(compare);
    }
    return orderAccessor(field(order));
  }
  if (typeof order === "function") return (order.length === 1 ? orderAccessor : orderComparator)(order);
  if (isArray(order)) return orderGiven(order);
  throw new Error(`invalid order: ${order}`);
}
function orderY(compare) {
  return (data, X, Y) => (i, j) => compare(Y[i], Y[j]);
}
function orderZ(compare) {
  return (data, X, Y, Z) => (i, j) => compare(Z[i], Z[j]);
}
function orderSum(compare) {
  return orderZDomain(
    compare,
    (data, X, Y, Z) => groupSort(
      range2(data),
      (I) => sum(I, (i) => Y[i]),
      (i) => Z[i]
    )
  );
}
function orderAppearance(compare) {
  return orderZDomain(
    compare,
    (data, X, Y, Z) => groupSort(
      range2(data),
      (I) => X[greatest(I, (i) => Y[i])],
      (i) => Z[i]
    )
  );
}
function orderInsideOut(compare) {
  return orderZDomain(compare, (data, X, Y, Z) => {
    const I = range2(data);
    const K2 = groupSort(
      I,
      (I2) => X[greatest(I2, (i) => Y[i])],
      (i) => Z[i]
    );
    const sums = rollup(
      I,
      (I2) => sum(I2, (i) => Y[i]),
      (i) => Z[i]
    );
    const Kp = [], Kn = [];
    let s2 = 0;
    for (const k2 of K2) {
      if (s2 < 0) {
        s2 += sums.get(k2);
        Kp.push(k2);
      } else {
        s2 -= sums.get(k2);
        Kn.push(k2);
      }
    }
    return Kn.reverse().concat(Kp);
  });
}
function orderAccessor(f) {
  return (data) => {
    const O = valueof(data, f);
    return (i, j) => ascendingDefined2(O[i], O[j]);
  };
}
function orderComparator(f) {
  return (data) => {
    return isArray(data) ? (i, j) => f(data[i], data[j]) : (i, j) => f(data.get(i), data.get(j));
  };
}
function orderGiven(domain) {
  return orderZDomain(ascendingDefined2, () => domain);
}
function orderZDomain(compare, domain) {
  return (data, X, Y, Z) => {
    if (!Z) throw new Error("missing channel: z");
    const map3 = new InternMap(domain(data, X, Y, Z).map((d, i) => [d, i]));
    return (i, j) => compare(map3.get(Z[i]), map3.get(Z[j]));
  };
}
var defaults$g = {
  ariaLabel: "rect"
};
var Rect = class extends Mark {
  constructor(data, options = {}) {
    const { x1: x12, y1: y12, x2, y2 } = options;
    super(
      data,
      {
        x1: { value: x12, scale: "x", type: x12 != null && x2 == null ? "band" : void 0, optional: true },
        y1: { value: y12, scale: "y", type: y12 != null && y2 == null ? "band" : void 0, optional: true },
        x2: { value: x2, scale: "x", optional: true },
        y2: { value: y2, scale: "y", optional: true }
      },
      options,
      defaults$g
    );
    rectInsets(this, options);
    rectRadii(this, options);
  }
  render(index2, scales, channels, dimensions, context) {
    const { x: x2, y: y2 } = scales;
    let { x1: X12, y1: Y12, x2: X22, y2: Y22 } = channels;
    const { marginTop, marginRight, marginBottom, marginLeft, width, height } = dimensions;
    const { projection: projection3 } = context;
    const { insetTop, insetRight, insetBottom, insetLeft } = this;
    const { rx, ry, rx1y1, rx1y2, rx2y1, rx2y2 } = this;
    if ((X12 || X22) && !projection3 && isCollapsed(x2)) X12 = X22 = null;
    if ((Y12 || Y22) && !projection3 && isCollapsed(y2)) Y12 = Y22 = null;
    const bx = x2?.bandwidth ? x2.bandwidth() : 0;
    const by = y2?.bandwidth ? y2.bandwidth() : 0;
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, {}, 0, 0).call(
      (g) => g.selectAll().data(index2).enter().call(
        rx1y1 || rx1y2 || rx2y1 || rx2y2 ? (g2) => g2.append("path").call(applyDirectStyles, this).call(
          applyRoundedRect,
          X12 && X22 ? (i) => X12[i] + (X22[i] < X12[i] ? -insetRight : insetLeft) : X12 ? (i) => X12[i] + insetLeft : marginLeft + insetLeft,
          Y12 && Y22 ? (i) => Y12[i] + (Y22[i] < Y12[i] ? -insetBottom : insetTop) : Y12 ? (i) => Y12[i] + insetTop : marginTop + insetTop,
          X12 && X22 ? (i) => X22[i] - (X22[i] < X12[i] ? -insetLeft : insetRight) : X12 ? (i) => X12[i] + bx - insetRight : width - marginRight - insetRight,
          Y12 && Y22 ? (i) => Y22[i] - (Y22[i] < Y12[i] ? -insetTop : insetBottom) : Y12 ? (i) => Y12[i] + by - insetBottom : height - marginBottom - insetBottom,
          this
        ).call(applyChannelStyles, this, channels) : (g2) => g2.append("rect").call(applyDirectStyles, this).attr(
          "x",
          X12 ? X22 ? (i) => Math.min(X12[i], X22[i]) + insetLeft : (i) => X12[i] + insetLeft : marginLeft + insetLeft
        ).attr(
          "y",
          Y12 ? Y22 ? (i) => Math.min(Y12[i], Y22[i]) + insetTop : (i) => Y12[i] + insetTop : marginTop + insetTop
        ).attr(
          "width",
          X12 ? X22 ? (i) => Math.max(0, Math.abs(X22[i] - X12[i]) + bx - insetLeft - insetRight) : bx - insetLeft - insetRight : width - marginRight - marginLeft - insetRight - insetLeft
        ).attr(
          "height",
          Y12 ? Y22 ? (i) => Math.max(0, Math.abs(Y12[i] - Y22[i]) + by - insetTop - insetBottom) : by - insetTop - insetBottom : height - marginTop - marginBottom - insetTop - insetBottom
        ).call(applyAttr, "rx", rx).call(applyAttr, "ry", ry).call(applyChannelStyles, this, channels)
      )
    ).node();
  }
};
function rectInsets(mark, { inset = 0, insetTop = inset, insetRight = inset, insetBottom = inset, insetLeft = inset } = {}) {
  mark.insetTop = number$12(insetTop);
  mark.insetRight = number$12(insetRight);
  mark.insetBottom = number$12(insetBottom);
  mark.insetLeft = number$12(insetLeft);
}
function rectRadii(mark, {
  r,
  rx,
  // for elliptic corners
  ry,
  // for elliptic corners
  rx1 = r,
  ry1 = r,
  rx2 = r,
  ry2 = r,
  rx1y1 = rx1 !== void 0 ? +rx1 : ry1 !== void 0 ? +ry1 : 0,
  rx1y2 = rx1 !== void 0 ? +rx1 : ry2 !== void 0 ? +ry2 : 0,
  rx2y1 = rx2 !== void 0 ? +rx2 : ry1 !== void 0 ? +ry1 : 0,
  rx2y2 = rx2 !== void 0 ? +rx2 : ry2 !== void 0 ? +ry2 : 0
} = {}) {
  if (rx1y1 || rx1y2 || rx2y1 || rx2y2) {
    mark.rx1y1 = rx1y1;
    mark.rx1y2 = rx1y2;
    mark.rx2y1 = rx2y1;
    mark.rx2y2 = rx2y2;
  } else {
    mark.rx = impliedString(rx, "auto");
    mark.ry = impliedString(ry, "auto");
  }
}
function applyRoundedRect(selection2, X12, Y12, X22, Y22, mark) {
  const { rx1y1: r11, rx1y2: r12, rx2y1: r21, rx2y2: r22 } = mark;
  if (typeof X12 !== "function") X12 = constant5(X12);
  if (typeof Y12 !== "function") Y12 = constant5(Y12);
  if (typeof X22 !== "function") X22 = constant5(X22);
  if (typeof Y22 !== "function") Y22 = constant5(Y22);
  const rx = Math.max(Math.abs(r11 + r21), Math.abs(r12 + r22));
  const ry = Math.max(Math.abs(r11 + r12), Math.abs(r21 + r22));
  selection2.attr("d", (i) => {
    const x12 = X12(i);
    const y12 = Y12(i);
    const x2 = X22(i);
    const y2 = Y22(i);
    const ix = x12 > x2;
    const iy = y12 > y2;
    const l = ix ? x2 : x12;
    const r = ix ? x12 : x2;
    const t = iy ? y2 : y12;
    const b = iy ? y12 : y2;
    const k2 = Math.min(1, (r - l) / rx, (b - t) / ry);
    const tl = k2 * (ix ? iy ? r22 : r21 : iy ? r12 : r11);
    const tr = k2 * (ix ? iy ? r12 : r11 : iy ? r22 : r21);
    const br = k2 * (ix ? iy ? r11 : r12 : iy ? r21 : r22);
    const bl = k2 * (ix ? iy ? r21 : r22 : iy ? r11 : r12);
    return `M${l},${t + biasY(tl, bl)}A${tl},${tl} 0 0 ${tl < 0 ? 0 : 1} ${l + biasX(tl, bl)},${t}H${r - biasX(tr, br)}A${tr},${tr} 0 0 ${tr < 0 ? 0 : 1} ${r},${t + biasY(tr, br)}V${b - biasY(br, tr)}A${br},${br} 0 0 ${br < 0 ? 0 : 1} ${r - biasX(br, tr)},${b}H${l + biasX(bl, tl)}A${bl},${bl} 0 0 ${bl < 0 ? 0 : 1} ${l},${b - biasY(bl, tl)}Z`;
  });
}
function biasX(r1, r2) {
  return r2 < 0 ? r1 : Math.abs(r1);
}
function biasY(r1, r2) {
  return r2 < 0 ? Math.abs(r1) : r1;
}
function rect(data, options) {
  return new Rect(data, maybeTrivialIntervalX(maybeTrivialIntervalY(options)));
}
function rectX(data, options = {}) {
  if (!hasXY(options)) options = { ...options, y: indexOf, x2: identity$13, interval: 1 };
  return new Rect(data, maybeStackX(maybeTrivialIntervalY(maybeIdentityX(options))));
}
function rectY(data, options = {}) {
  if (!hasXY(options)) options = { ...options, x: indexOf, y2: identity$13, interval: 1 };
  return new Rect(data, maybeStackY(maybeTrivialIntervalX(maybeIdentityY(options))));
}
var defaults$f = {
  ariaLabel: "frame",
  fill: "none",
  stroke: "currentColor",
  clip: false
};
var lineDefaults = {
  ariaLabel: "frame",
  fill: null,
  stroke: "currentColor",
  strokeLinecap: "square",
  clip: false
};
var Frame = class extends Mark {
  constructor(options = {}) {
    const { anchor = null } = options;
    super(singleton, void 0, options, anchor == null ? defaults$f : lineDefaults);
    this.anchor = maybeKeyword(anchor, "anchor", ["top", "right", "bottom", "left"]);
    rectInsets(this, options);
    if (!anchor) rectRadii(this, options);
  }
  render(index2, scales, channels, dimensions, context) {
    const { marginTop, marginRight, marginBottom, marginLeft, width, height } = dimensions;
    const { anchor, insetTop, insetRight, insetBottom, insetLeft } = this;
    const { rx, ry, rx1y1, rx1y2, rx2y1, rx2y2 } = this;
    const x12 = marginLeft + insetLeft;
    const x2 = width - marginRight - insetRight;
    const y12 = marginTop + insetTop;
    const y2 = height - marginBottom - insetBottom;
    return create(anchor ? "svg:line" : rx1y1 || rx1y2 || rx2y1 || rx2y2 ? "svg:path" : "svg:rect", context).datum(0).call(applyIndirectStyles, this, dimensions, context).call(applyDirectStyles, this).call(applyChannelStyles, this, channels).call(applyTransform, this, {}).call(
      anchor === "left" ? (line3) => line3.attr("x1", x12).attr("x2", x12).attr("y1", y12).attr("y2", y2) : anchor === "right" ? (line3) => line3.attr("x1", x2).attr("x2", x2).attr("y1", y12).attr("y2", y2) : anchor === "top" ? (line3) => line3.attr("x1", x12).attr("x2", x2).attr("y1", y12).attr("y2", y12) : anchor === "bottom" ? (line3) => line3.attr("x1", x12).attr("x2", x2).attr("y1", y2).attr("y2", y2) : rx1y1 || rx1y2 || rx2y1 || rx2y2 ? (path2) => path2.call(applyRoundedRect, x12, y12, x2, y2, this) : (rect2) => rect2.attr("x", x12).attr("y", y12).attr("width", x2 - x12).attr("height", y2 - y12).attr("rx", rx).attr("ry", ry)
    ).node();
  }
};
function frame(options) {
  return new Frame(options);
}
var defaults$e = {
  ariaLabel: "tip",
  fill: "var(--plot-background)",
  stroke: "currentColor",
  pool: true
};
var ignoreChannels = /* @__PURE__ */ new Set(["geometry", "href", "src", "ariaLabel", "scales", "contours"]);
var Tip = class extends Mark {
  constructor(data, options = {}) {
    if (options.tip) options = { ...options, tip: false };
    if (options.title === void 0 && isIterable(data) && isTextual(data)) options = { ...options, title: identity$13 };
    const {
      x: x2,
      y: y2,
      x1: x12,
      x2: x22,
      y1: y12,
      y2: y22,
      anchor,
      preferredAnchor = "bottom",
      monospace,
      fontFamily = monospace ? "ui-monospace, monospace" : void 0,
      fontSize,
      fontStyle,
      fontVariant,
      fontWeight,
      lineHeight = 1,
      lineWidth = 20,
      frameAnchor,
      format: format3,
      textAnchor = "start",
      textOverflow,
      textPadding = 8,
      title,
      pointerSize = 12,
      pathFilter = "drop-shadow(0 3px 4px rgba(0,0,0,0.2))"
    } = options;
    super(
      data,
      {
        x: { value: x12 != null && x22 != null ? null : x2, scale: "x", optional: true },
        // ignore midpoint
        y: { value: y12 != null && y22 != null ? null : y2, scale: "y", optional: true },
        // ignore midpoint
        x1: { value: x12, scale: "x", optional: x22 == null },
        y1: { value: y12, scale: "y", optional: y22 == null },
        x2: { value: x22, scale: "x", optional: x12 == null },
        y2: { value: y22, scale: "y", optional: y12 == null },
        title: { value: title, optional: true }
        // filter: defined
      },
      options,
      defaults$e
    );
    this.anchor = maybeAnchor$3(anchor, "anchor");
    this.preferredAnchor = maybeAnchor$3(preferredAnchor, "preferredAnchor");
    this.frameAnchor = maybeFrameAnchor(frameAnchor);
    this.textAnchor = impliedString(textAnchor, "middle");
    this.textPadding = +textPadding;
    this.pointerSize = +pointerSize;
    this.pathFilter = string2(pathFilter);
    this.lineHeight = +lineHeight;
    this.lineWidth = +lineWidth;
    this.textOverflow = maybeTextOverflow(textOverflow);
    this.monospace = !!monospace;
    this.fontFamily = string2(fontFamily);
    this.fontSize = number$12(fontSize);
    this.fontStyle = string2(fontStyle);
    this.fontVariant = string2(fontVariant);
    this.fontWeight = string2(fontWeight);
    for (const key in defaults$e) if (key in this.channels) this[key] = defaults$e[key];
    this.splitLines = splitter2(this);
    this.clipLine = clipper(this);
    this.format = typeof format3 === "string" || typeof format3 === "function" ? { title: format3 } : { ...format3 };
  }
  render(index2, scales, values2, dimensions, context) {
    const mark = this;
    const { x: x2, y: y2, fx, fy } = scales;
    const { ownerSVGElement: svg, document: document2 } = context;
    const { anchor, monospace, lineHeight, lineWidth } = this;
    const { textPadding: r, pointerSize: m, pathFilter } = this;
    const { marginTop, marginLeft } = dimensions;
    const { x1: X12, y1: Y12, x2: X22, y2: Y22, x: X = X12 ?? X22, y: Y = Y12 ?? Y22 } = values2;
    const ox2 = fx ? fx(index2.fx) - marginLeft : 0;
    const oy2 = fy ? fy(index2.fy) - marginTop : 0;
    const [cx, cy] = applyFrameAnchor(this, dimensions);
    const px = anchorX$1(values2, cx);
    const py = anchorY$1(values2, cy);
    const widthof = monospace ? monospaceWidth : defaultWidth;
    const ee = widthof(ellipsis);
    let sources, format3;
    if ("title" in values2) {
      sources = getSourceChannels.call(this, { title: values2.channels.title }, scales);
      format3 = formatTitle;
    } else {
      sources = getSourceChannels.call(this, values2.channels, scales);
      format3 = formatChannels;
    }
    const T = new Array(index2.length);
    for (const i of index2) T[i] = format3.call(mark, i, index2, sources, scales, values2);
    index2 = index2.filter((i) => T[i] != null);
    const g = create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyIndirectTextStyles, this).call(applyTransform, this, { x: X && x2, y: Y && y2 }).call(
      (g2) => g2.selectAll().data(index2).enter().append("g").attr("transform", (i) => `translate(${Math.round(px(i))},${Math.round(py(i))})`).call(applyDirectStyles, this).call((g3) => g3.append("path").attr("filter", pathFilter)).call(
        (g3) => g3.append("text").each(function(i) {
          const that = select(this);
          this.setAttribute("fill", "currentColor");
          this.setAttribute("fill-opacity", 1);
          this.setAttribute("stroke", "none");
          const lines = T[i];
          if (typeof lines === "string") {
            for (const line3 of mark.splitLines(lines)) {
              renderLine(that, { value: mark.clipLine(line3) });
            }
          } else {
            const labels = /* @__PURE__ */ new Set();
            for (const line3 of lines) {
              const { label = "" } = line3;
              if (label && labels.has(label)) continue;
              else labels.add(label);
              renderLine(that, line3);
            }
          }
        })
      )
    );
    function renderLine(selection2, { label, value: value2, color: color3, opacity: opacity2 }) {
      label ??= "", value2 ??= "";
      const swatch = color3 != null || opacity2 != null;
      let title;
      let w = lineWidth * 100;
      const [j] = cut(label, w, widthof, ee);
      if (j >= 0) {
        label = label.slice(0, j).trimEnd() + ellipsis;
        title = value2.trim();
        value2 = "";
      } else {
        if (label || !value2 && !swatch) value2 = " " + value2;
        const [k2] = cut(value2, w - widthof(label), widthof, ee);
        if (k2 >= 0) {
          title = value2.trim();
          value2 = value2.slice(0, k2).trimEnd() + ellipsis;
        }
      }
      const line3 = selection2.append("tspan").attr("x", 0).attr("dy", `${lineHeight}em`).text("\u200B");
      if (label) line3.append("tspan").attr("font-weight", "bold").text(label);
      if (value2) line3.append(() => document2.createTextNode(value2));
      if (swatch) line3.append("tspan").text(" \u25A0").attr("fill", color3).attr("fill-opacity", opacity2).style("user-select", "none");
      if (title) line3.append("title").text(title);
    }
    function postrender() {
      const { width, height } = dimensions.facet ?? dimensions;
      g.selectChildren().each(function(i) {
        let { x: tx, width: w, height: h } = this.getBBox();
        w = Math.round(w), h = Math.round(h);
        let a2 = anchor;
        if (a2 === void 0) {
          const x3 = px(i) + ox2;
          const y3 = py(i) + oy2;
          const fitLeft = x3 + w + m + r * 2 < width;
          const fitRight = x3 - w - m - r * 2 > 0;
          const fitTop = y3 + h + m + r * 2 < height;
          const fitBottom = y3 - h - m - r * 2 > 0;
          a2 = fitLeft && fitRight ? fitTop && fitBottom ? mark.preferredAnchor : fitBottom ? "bottom" : "top" : fitTop && fitBottom ? fitLeft ? "left" : "right" : (fitLeft || fitRight) && (fitTop || fitBottom) ? `${fitBottom ? "bottom" : "top"}-${fitLeft ? "left" : "right"}` : mark.preferredAnchor;
        }
        const path2 = this.firstChild;
        const text2 = this.lastChild;
        path2.setAttribute("d", getPath(a2, m, r, w, h));
        if (tx) for (const t of text2.childNodes) t.setAttribute("x", -tx);
        text2.setAttribute("y", `${+getLineOffset(a2, text2.childNodes.length, lineHeight).toFixed(6)}em`);
        text2.setAttribute("transform", `translate(${getTextTranslate(a2, m, r, w, h)})`);
      });
      g.attr("visibility", null);
    }
    if (index2.length) {
      g.attr("visibility", "hidden");
      if (svg.isConnected) Promise.resolve().then(postrender);
      else if (typeof requestAnimationFrame !== "undefined") requestAnimationFrame(postrender);
    }
    return g.node();
  }
};
function tip(data, { x: x2, y: y2, ...options } = {}) {
  if (options.frameAnchor === void 0) [x2, y2] = maybeTuple(x2, y2);
  return new Tip(data, { ...options, x: x2, y: y2 });
}
function getLineOffset(anchor, length2, lineHeight) {
  return /^top(?:-|$)/.test(anchor) ? 0.94 - lineHeight : /^bottom(?:-|$)/ ? -0.29 - length2 * lineHeight : length2 / 2 * lineHeight;
}
function getTextTranslate(anchor, m, r, width, height) {
  switch (anchor) {
    case "middle":
      return [-width / 2, height / 2];
    case "top-left":
      return [r, m / 2 + r];
    case "top":
      return [-width / 2, m / 2 + r];
    case "top-right":
      return [-width - r, m / 2 + r];
    case "right":
      return [-m / 2 - width - r, height / 2];
    case "bottom-left":
      return [r, -m / 2 - r];
    case "bottom":
      return [-width / 2, -m / 2 - r];
    case "bottom-right":
      return [-width - r, -m / 2 - r];
    case "left":
      return [r + m / 2, height / 2];
  }
}
function getPath(anchor, m, r, width, height) {
  const w = width + r * 2;
  const h = height + r * 2;
  switch (anchor) {
    case "middle":
      return `M${-w / 2},${-h / 2}h${w}v${h}h${-w}z`;
    case "top-left":
      return `M0,0l${m / 2},${m / 2}h${w - m / 2}v${h}h${-w}z`;
    case "top":
      return `M0,0l${m / 2},${m / 2}h${(w - m) / 2}v${h}h${-w}v${-h}h${(w - m) / 2}z`;
    case "top-right":
      return `M0,0l${-m / 2},${m / 2}h${m / 2 - w}v${h}h${w}z`;
    case "right":
      return `M0,0l${-m / 2},${-m / 2}v${m / 2 - h / 2}h${-w}v${h}h${w}v${m / 2 - h / 2}z`;
    case "bottom-left":
      return `M0,0l${m / 2},${-m / 2}h${w - m / 2}v${-h}h${-w}z`;
    case "bottom":
      return `M0,0l${m / 2},${-m / 2}h${(w - m) / 2}v${-h}h${-w}v${h}h${(w - m) / 2}z`;
    case "bottom-right":
      return `M0,0l${-m / 2},${-m / 2}h${m / 2 - w}v${-h}h${w}z`;
    case "left":
      return `M0,0l${m / 2},${-m / 2}v${m / 2 - h / 2}h${w}v${h}h${-w}v${m / 2 - h / 2}z`;
  }
}
function getSourceChannels(channels, scales) {
  const sources = {};
  let format3 = this.format;
  format3 = maybeExpandPairedFormat(format3, channels, "x");
  format3 = maybeExpandPairedFormat(format3, channels, "y");
  this.format = format3;
  for (const key in format3) {
    const value2 = format3[key];
    if (value2 === null || value2 === false) {
      continue;
    } else if (key === "fx" || key === "fy") {
      sources[key] = true;
    } else {
      const source = getSource(channels, key);
      if (source) sources[key] = source;
    }
  }
  for (const key in channels) {
    if (key in sources || key in format3 || ignoreChannels.has(key)) continue;
    if ((key === "x" || key === "y") && channels.geometry) continue;
    const source = getSource(channels, key);
    if (source) {
      if (source.scale == null && source.defaultScale) continue;
      sources[key] = source;
    }
  }
  if (this.facet) {
    if (scales.fx && !("fx" in format3)) sources.fx = true;
    if (scales.fy && !("fy" in format3)) sources.fy = true;
  }
  for (const key in sources) {
    const format4 = this.format[key];
    const scale2 = scales[key];
    const value2 = sources[key]?.value ?? scale2?.domain() ?? [];
    if (typeof format4 === "string") {
      this.format[key] = (isTemporal(value2) ? utcFormat : format)(format4);
    } else if (format4 === void 0 || format4 === true) {
      this.format[key] = scale2?.bandwidth ? inferTickFormat(scale2, scale2.domain()) : isYearIntegers(value2) ? String : formatDefault;
    }
  }
  return sources;
}
function maybeExpandPairedFormat(format3, channels, key) {
  if (!(key in format3)) return format3;
  const key1 = `${key}1`;
  const key2 = `${key}2`;
  if ((key1 in format3 || !(key1 in channels)) && (key2 in format3 || !(key2 in channels))) return format3;
  const entries = Object.entries(format3);
  const value2 = format3[key];
  entries.splice(entries.findIndex(([name]) => name === key) + 1, 0, [key1, value2], [key2, value2]);
  return Object.fromEntries(entries);
}
function formatTitle(i, index2, { title }) {
  return this.format.title(title.value[i], i);
}
function* formatChannels(i, index2, channels, scales, values2) {
  for (const key in channels) {
    if (key === "fx" || key === "fy") {
      yield {
        label: formatLabel(scales, channels, key),
        value: this.format[key](index2[key], i)
      };
      continue;
    }
    if (key === "x1" && "x2" in channels) continue;
    if (key === "y1" && "y2" in channels) continue;
    const channel = channels[key];
    if (key === "x2" && "x1" in channels) {
      yield {
        label: formatPairLabel(scales, channels, "x"),
        value: formatPair(this.format.x2, channels.x1, channel, i)
      };
    } else if (key === "y2" && "y1" in channels) {
      yield {
        label: formatPairLabel(scales, channels, "y"),
        value: formatPair(this.format.y2, channels.y1, channel, i)
      };
    } else {
      const value2 = channel.value[i];
      const scale2 = channel.scale;
      if (!defined(value2) && scale2 == null) continue;
      yield {
        label: formatLabel(scales, channels, key),
        value: this.format[key](value2, i),
        color: scale2 === "color" ? values2[key][i] : null,
        opacity: scale2 === "opacity" ? values2[key][i] : null
      };
    }
  }
}
function formatPair(formatValue, c1, c22, i) {
  return c22.hint?.length ? `${formatValue(c22.value[i] - c1.value[i], i)}` : `${formatValue(c1.value[i], i)}\u2013${formatValue(c22.value[i], i)}`;
}
function formatPairLabel(scales, channels, key) {
  const l1 = formatLabel(scales, channels, `${key}1`, key);
  const l2 = formatLabel(scales, channels, `${key}2`, key);
  return l1 === l2 ? l1 : `${l1}\u2013${l2}`;
}
function formatLabel(scales, channels, key, defaultLabel = key) {
  const channel = channels[key];
  const scale2 = scales[channel?.scale ?? key];
  return String(scale2?.label ?? channel?.label ?? defaultLabel);
}
function plot(options = {}) {
  const { facet, style, title, subtitle, caption, ariaLabel, ariaDescription } = options;
  const className = maybeClassName(options.className);
  const marks2 = options.marks === void 0 ? [] : flatMarks(options.marks);
  marks2.push(...inferTips(marks2));
  const topFacetState = maybeTopFacet(facet, options);
  const facetStateByMark = /* @__PURE__ */ new Map();
  for (const mark of marks2) {
    const facetState = maybeMarkFacet(mark, topFacetState, options);
    if (facetState) facetStateByMark.set(mark, facetState);
  }
  const channelsByScale = /* @__PURE__ */ new Map();
  if (topFacetState) addScaleChannels(channelsByScale, [topFacetState], options);
  addScaleChannels(channelsByScale, facetStateByMark, options);
  const axes = flatMarks(inferAxes(marks2, channelsByScale, options));
  for (const mark of axes) {
    const facetState = maybeMarkFacet(mark, topFacetState, options);
    if (facetState) facetStateByMark.set(mark, facetState);
  }
  marks2.unshift(...axes);
  let facets = createFacets(channelsByScale, options);
  if (facets !== void 0) {
    const topFacetsIndex = topFacetState ? facetFilter(facets, topFacetState) : void 0;
    for (const mark of marks2) {
      if (mark.facet === null || mark.facet === "super") continue;
      const facetState = facetStateByMark.get(mark);
      if (facetState === void 0) continue;
      facetState.facetsIndex = mark.fx != null || mark.fy != null ? facetFilter(facets, facetState) : topFacetsIndex;
    }
    const nonEmpty = /* @__PURE__ */ new Set();
    for (const { facetsIndex } of facetStateByMark.values()) {
      facetsIndex?.forEach((index2, i) => {
        if (index2?.length > 0) {
          nonEmpty.add(i);
        }
      });
    }
    facets.forEach(
      0 < nonEmpty.size && nonEmpty.size < facets.length ? (f, i) => f.empty = !nonEmpty.has(i) : (f) => f.empty = false
    );
    for (const mark of marks2) {
      if (mark.facet === "exclude") {
        const facetState = facetStateByMark.get(mark);
        if (facetState !== void 0) facetState.facetsIndex = facetExclude(facetState.facetsIndex);
      }
    }
  }
  for (const key of registry.keys()) {
    if (isScaleOptions(options[key]) && key !== "fx" && key !== "fy") {
      channelsByScale.set(key, []);
    }
  }
  const stateByMark = /* @__PURE__ */ new Map();
  for (const mark of marks2) {
    if (stateByMark.has(mark)) throw new Error("duplicate mark; each mark must be unique");
    const { facetsIndex, channels: facetChannels } = facetStateByMark.get(mark) ?? {};
    const { data, facets: facets2, channels } = mark.initialize(facetsIndex, facetChannels, options);
    applyScaleTransforms(channels, options);
    stateByMark.set(mark, { data, facets: facets2, channels });
  }
  const scaleDescriptors = createScales(addScaleChannels(channelsByScale, stateByMark, options), options);
  const dimensions = createDimensions(scaleDescriptors, marks2, options);
  autoScaleRange(scaleDescriptors, dimensions);
  const scales = createScaleFunctions(scaleDescriptors);
  const { fx, fy } = scales;
  const subdimensions = fx || fy ? innerDimensions(scaleDescriptors, dimensions) : dimensions;
  const superdimensions = fx || fy ? actualDimensions(scales, dimensions) : dimensions;
  const context = createContext(options);
  const document2 = context.document;
  const svg = creator("svg").call(document2.documentElement);
  let figure = svg;
  context.ownerSVGElement = svg;
  context.className = className;
  context.projection = createProjection(options, subdimensions);
  context.path = function() {
    return index(this.projection ?? xyProjection(scales));
  };
  context.filterFacets = (data, channels) => {
    return facetFilter(facets, { channels, groups: facetGroups(data, channels) });
  };
  context.getMarkState = (mark) => {
    const state = stateByMark.get(mark);
    const facetState = facetStateByMark.get(mark);
    return { ...state, channels: { ...state.channels, ...facetState?.channels } };
  };
  context.dispatchValue = (value2) => {
    if (figure.value === value2) return;
    figure.value = value2;
    figure.dispatchEvent(new context.document.defaultView.Event("input", { bubbles: true }));
  };
  const newByScale = /* @__PURE__ */ new Set();
  for (const [mark, state] of stateByMark) {
    if (mark.initializer != null) {
      const dimensions2 = mark.facet === "super" ? superdimensions : subdimensions;
      const update = mark.initializer(state.data, state.facets, state.channels, scales, dimensions2, context);
      if (update.data !== void 0) {
        state.data = update.data;
      }
      if (update.facets !== void 0) {
        state.facets = update.facets;
      }
      if (update.channels !== void 0) {
        const { fx: fx2, fy: fy2, ...channels } = update.channels;
        inferChannelScales(channels);
        Object.assign(state.channels, channels);
        for (const channel of Object.values(channels)) {
          const { scale: scale2 } = channel;
          if (scale2 != null && !isPosition(registry.get(scale2))) {
            applyScaleTransform(channel, options);
            newByScale.add(scale2);
          }
        }
        if (fx2 != null || fy2 != null) facetStateByMark.set(mark, true);
      }
    }
  }
  if (newByScale.size) {
    const newChannelsByScale = /* @__PURE__ */ new Map();
    addScaleChannels(newChannelsByScale, stateByMark, options, (key) => newByScale.has(key));
    addScaleChannels(channelsByScale, stateByMark, options, (key) => newByScale.has(key));
    const newScaleDescriptors = inheritScaleLabels(createScales(newChannelsByScale, options), scaleDescriptors);
    const { scales: newExposedScales, ...newScales } = createScaleFunctions(newScaleDescriptors);
    Object.assign(scaleDescriptors, newScaleDescriptors);
    Object.assign(scales, newScales);
    Object.assign(scales.scales, newExposedScales);
  }
  let facetDomains, facetTranslate;
  if (facets !== void 0) {
    facetDomains = { x: fx?.domain(), y: fy?.domain() };
    facets = recreateFacets(facets, facetDomains);
    facetTranslate = facetTranslator(fx, fy, dimensions);
  }
  for (const [mark, state] of stateByMark) {
    state.values = mark.scale(state.channels, scales, context);
  }
  const { width, height } = dimensions;
  select(svg).attr("class", className).attr("fill", "currentColor").attr("font-family", "system-ui, sans-serif").attr("font-size", 10).attr("text-anchor", "middle").attr("width", width).attr("height", height).attr("viewBox", `0 0 ${width} ${height}`).attr("aria-label", ariaLabel).attr("aria-description", ariaDescription).call(
    (svg2) => (
      // Warning: if you edit this, change defaultClassName.
      svg2.append("style").text(
        `:where(.${className}) {
  --plot-background: white;
  display: block;
  height: auto;
  height: intrinsic;
  max-width: 100%;
}
:where(.${className} text),
:where(.${className} tspan) {
  white-space: pre;
}`
      )
    )
  ).call(applyInlineStyles, style);
  for (const mark of marks2) {
    const { channels, values: values2, facets: indexes } = stateByMark.get(mark);
    if (facets === void 0 || mark.facet === "super") {
      let index2 = null;
      if (indexes) {
        index2 = indexes[0];
        index2 = mark.filter(index2, channels, values2);
        if (index2.length === 0) continue;
      }
      const node = mark.render(index2, scales, values2, superdimensions, context);
      if (node == null) continue;
      svg.appendChild(node);
    } else {
      let g;
      for (const f of facets) {
        if (!(mark.facetAnchor?.(facets, facetDomains, f) ?? !f.empty)) continue;
        let index2 = null;
        if (indexes) {
          const faceted = facetStateByMark.has(mark);
          index2 = indexes[faceted ? f.i : 0];
          index2 = mark.filter(index2, channels, values2);
          if (index2.length === 0) continue;
          if (!faceted && index2 === indexes[0]) index2 = subarray(index2);
          index2.fx = f.x, index2.fy = f.y, index2.fi = f.i;
        }
        const node = mark.render(index2, scales, values2, subdimensions, context);
        if (node == null) continue;
        (g ??= select(svg).append("g")).append(() => node).datum(f);
        for (const name of ["aria-label", "aria-description", "aria-hidden", "transform"]) {
          if (node.hasAttribute(name)) {
            g.attr(name, node.getAttribute(name));
            node.removeAttribute(name);
          }
        }
      }
      g?.selectChildren().each(facetTranslate);
    }
  }
  const legends = createLegends(scaleDescriptors, context, options);
  const { figure: figured = title != null || subtitle != null || caption != null || legends.length > 0 } = options;
  if (figured) {
    figure = document2.createElement("figure");
    figure.className = `${className}-figure`;
    figure.style.maxWidth = "initial";
    if (title != null) figure.append(createTitleElement(document2, title, "h2"));
    if (subtitle != null) figure.append(createTitleElement(document2, subtitle, "h3"));
    figure.append(...legends, svg);
    if (caption != null) figure.append(createFigcaption(document2, caption));
    if ("value" in svg) figure.value = svg.value, delete svg.value;
  }
  figure.scale = exposeScales(scales.scales, context);
  figure.legend = exposeLegends(scaleDescriptors, context, options);
  const w = consumeWarnings();
  if (w > 0) {
    select(svg).append("text").attr("x", width).attr("y", 20).attr("dy", "-1em").attr("text-anchor", "end").attr("font-family", "initial").text("\u26A0\uFE0F").append("title").text(`${w.toLocaleString("en-US")} warning${w === 1 ? "" : "s"}. Please check the console.`);
  }
  return figure;
}
function createTitleElement(document2, contents, tag) {
  if (contents.ownerDocument) return contents;
  const e = document2.createElement(tag);
  e.append(contents);
  return e;
}
function createFigcaption(document2, caption) {
  const e = document2.createElement("figcaption");
  e.append(caption);
  return e;
}
function flatMarks(marks2) {
  return marks2.flat(Infinity).filter((mark) => mark != null).map(markify);
}
function markify(mark) {
  return typeof mark.render === "function" ? mark : new Render(mark);
}
var Render = class extends Mark {
  constructor(render) {
    if (typeof render !== "function") throw new TypeError("invalid mark; missing render function");
    super();
    this.render = render;
  }
  render() {
  }
};
function applyScaleTransforms(channels, options) {
  for (const name in channels) applyScaleTransform(channels[name], options);
  return channels;
}
function applyScaleTransform(channel, options) {
  const { scale: scale2, transform: t = true } = channel;
  if (scale2 == null || !t) return;
  const {
    type,
    percent,
    interval,
    transform: transform2 = percent ? (x2) => x2 == null ? NaN : x2 * 100 : maybeIntervalTransform(interval, type)
  } = options[scale2] ?? {};
  if (transform2 == null) return;
  channel.value = map$1(channel.value, transform2);
  channel.transform = false;
}
function inferChannelScales(channels) {
  for (const name in channels) {
    inferChannelScale(name, channels[name]);
  }
}
function addScaleChannels(channelsByScale, stateByMark, options, filter3 = yes) {
  for (const { channels } of stateByMark.values()) {
    for (const name in channels) {
      const channel = channels[name];
      const { scale: scale2 } = channel;
      if (scale2 != null && filter3(scale2)) {
        if (scale2 === "projection") {
          if (!hasProjection(options)) {
            const gx = options.x?.domain === void 0;
            const gy = options.y?.domain === void 0;
            if (gx || gy) {
              const [x2, y2] = getGeometryChannels(channel);
              if (gx) addScaleChannel(channelsByScale, "x", x2);
              if (gy) addScaleChannel(channelsByScale, "y", y2);
            }
          }
        } else {
          addScaleChannel(channelsByScale, scale2, channel);
        }
      }
    }
  }
  return channelsByScale;
}
function addScaleChannel(channelsByScale, scale2, channel) {
  const scaleChannels = channelsByScale.get(scale2);
  if (scaleChannels !== void 0) scaleChannels.push(channel);
  else channelsByScale.set(scale2, [channel]);
}
function maybeTopFacet(facet, options) {
  if (facet == null) return;
  const { x: x2, y: y2 } = facet;
  if (x2 == null && y2 == null) return;
  const data = dataify(facet.data);
  if (data == null) throw new Error("missing facet data");
  const channels = {};
  if (x2 != null) channels.fx = createChannel(data, { value: x2, scale: "fx" });
  if (y2 != null) channels.fy = createChannel(data, { value: y2, scale: "fy" });
  applyScaleTransforms(channels, options);
  const groups = facetGroups(data, channels);
  return { channels, groups, data: facet.data };
}
function maybeMarkFacet(mark, topFacetState, options) {
  if (mark.facet === null || mark.facet === "super") return;
  const { fx, fy } = mark;
  if (fx != null || fy != null) {
    const data2 = dataify(mark.data ?? fx ?? fy);
    if (data2 === void 0) throw new Error(`missing facet data in ${mark.ariaLabel}`);
    if (data2 === null) return;
    const channels2 = {};
    if (fx != null) channels2.fx = createChannel(data2, { value: fx, scale: "fx" });
    if (fy != null) channels2.fy = createChannel(data2, { value: fy, scale: "fy" });
    applyScaleTransforms(channels2, options);
    return { channels: channels2, groups: facetGroups(data2, channels2) };
  }
  if (topFacetState === void 0) return;
  const { channels, groups, data } = topFacetState;
  if (mark.facet !== "auto" || mark.data === data) return { channels, groups };
  if (data.length > 0 && (groups.size > 1 || groups.size === 1 && channels.fx && channels.fy && [...groups][0][1].size > 1) && lengthof(dataify(mark.data)) === lengthof(data)) {
    warn(
      `Warning: the ${mark.ariaLabel} mark appears to use faceted data, but isn\u2019t faceted. The mark data has the same length as the facet data and the mark facet option is "auto", but the mark data and facet data are distinct. If this mark should be faceted, set the mark facet option to true; otherwise, suppress this warning by setting the mark facet option to false.`
    );
  }
}
function derive(mark, options = {}) {
  return initializer({ ...options, x: null, y: null }, (data, facets, channels, scales, dimensions, context) => {
    return context.getMarkState(mark);
  });
}
function inferTips(marks2) {
  const tips = [];
  for (const mark of marks2) {
    let tipOptions = mark.tip;
    if (tipOptions) {
      if (tipOptions === true) tipOptions = {};
      else if (typeof tipOptions === "string") tipOptions = { pointer: tipOptions };
      let { pointer: p, preferredAnchor: a2 } = tipOptions;
      p = /^x$/i.test(p) ? pointerX : /^y$/i.test(p) ? pointerY : pointer2;
      tipOptions = p(derive(mark, tipOptions));
      tipOptions.title = null;
      if (a2 === void 0) tipOptions.preferredAnchor = p === pointerY ? "left" : "bottom";
      const t = tip(mark.data, tipOptions);
      t.facet = mark.facet;
      t.facetAnchor = mark.facetAnchor;
      tips.push(t);
    }
  }
  return tips;
}
function inferAxes(marks2, channelsByScale, options) {
  let {
    projection: projection3,
    x: x2 = {},
    y: y2 = {},
    fx = {},
    fy = {},
    axis: axis2,
    grid,
    facet = {},
    facet: { axis: facetAxis = axis2, grid: facetGrid } = facet,
    x: { axis: xAxis = axis2, grid: xGrid = xAxis === null ? null : grid } = x2,
    y: { axis: yAxis = axis2, grid: yGrid = yAxis === null ? null : grid } = y2,
    fx: { axis: fxAxis = facetAxis, grid: fxGrid = fxAxis === null ? null : facetGrid } = fx,
    fy: { axis: fyAxis = facetAxis, grid: fyGrid = fyAxis === null ? null : facetGrid } = fy
  } = options;
  if (projection3 || !isScaleOptions(x2) && !hasPositionChannel("x", marks2)) xAxis = xGrid = null;
  if (projection3 || !isScaleOptions(y2) && !hasPositionChannel("y", marks2)) yAxis = yGrid = null;
  if (!channelsByScale.has("fx")) fxAxis = fxGrid = null;
  if (!channelsByScale.has("fy")) fyAxis = fyGrid = null;
  if (xAxis === void 0) xAxis = !hasAxis(marks2, "x");
  if (yAxis === void 0) yAxis = !hasAxis(marks2, "y");
  if (fxAxis === void 0) fxAxis = !hasAxis(marks2, "fx");
  if (fyAxis === void 0) fyAxis = !hasAxis(marks2, "fy");
  if (xAxis === true) xAxis = "bottom";
  if (yAxis === true) yAxis = "left";
  if (fxAxis === true) fxAxis = xAxis === "top" || xAxis === null ? "bottom" : "top";
  if (fyAxis === true) fyAxis = yAxis === "right" || yAxis === null ? "left" : "right";
  const axes = [];
  maybeGrid(axes, fyGrid, gridFy, fy);
  maybeAxis(axes, fyAxis, axisFy, "right", "left", facet, fy);
  maybeGrid(axes, fxGrid, gridFx, fx);
  maybeAxis(axes, fxAxis, axisFx, "top", "bottom", facet, fx);
  maybeGrid(axes, yGrid, gridY, y2);
  maybeAxis(axes, yAxis, axisY, "left", "right", options, y2);
  maybeGrid(axes, xGrid, gridX, x2);
  maybeAxis(axes, xAxis, axisX, "bottom", "top", options, x2);
  return axes;
}
function maybeAxis(axes, axis2, axisType, primary, secondary, defaults2, options) {
  if (!axis2) return;
  const both = isBoth(axis2);
  options = axisOptions(both ? primary : axis2, defaults2, options);
  const { line: line3 } = options;
  if ((axisType === axisY || axisType === axisX) && line3 && !isNone(line3)) axes.push(frame(lineOptions(options)));
  axes.push(axisType(options));
  if (both) axes.push(axisType({ ...options, anchor: secondary, label: null }));
}
function maybeGrid(axes, grid, gridType, options) {
  if (!grid || isNone(grid)) return;
  axes.push(gridType(gridOptions(grid, options)));
}
function isBoth(value2) {
  return /^\s*both\s*$/i.test(value2);
}
function axisOptions(anchor, defaults2, {
  line: line3 = defaults2.line,
  ticks: ticks2,
  tickSize,
  tickSpacing,
  tickPadding,
  tickFormat: tickFormat2,
  tickRotate,
  fontVariant,
  ariaLabel,
  ariaDescription,
  label = defaults2.label,
  labelAnchor,
  labelArrow = defaults2.labelArrow,
  labelOffset
}) {
  return {
    anchor,
    line: line3,
    ticks: ticks2,
    tickSize,
    tickSpacing,
    tickPadding,
    tickFormat: tickFormat2,
    tickRotate,
    fontVariant,
    ariaLabel,
    ariaDescription,
    label,
    labelAnchor,
    labelArrow,
    labelOffset
  };
}
function lineOptions(options) {
  const { anchor, line: line3 } = options;
  return { anchor, facetAnchor: anchor + "-empty", stroke: line3 === true ? void 0 : line3 };
}
function gridOptions(grid, {
  stroke = isColor(grid) ? grid : void 0,
  ticks: ticks2 = isGridTicks(grid) ? grid : void 0,
  tickSpacing,
  ariaLabel,
  ariaDescription
}) {
  return {
    stroke,
    ticks: ticks2,
    tickSpacing,
    ariaLabel,
    ariaDescription
  };
}
function isGridTicks(grid) {
  switch (typeof grid) {
    case "number":
      return true;
    case "string":
      return !isColor(grid);
  }
  return isIterable(grid) || typeof grid?.range === "function";
}
function hasAxis(marks2, k2) {
  const prefix = `${k2}-axis `;
  return marks2.some((m) => m.ariaLabel?.startsWith(prefix));
}
function hasPositionChannel(k2, marks2) {
  for (const mark of marks2) {
    for (const key in mark.channels) {
      const { scale: scale2 } = mark.channels[key];
      if (scale2 === k2 || scale2 === "projection") {
        return true;
      }
    }
  }
  return false;
}
function inheritScaleLabels(newScales, scales) {
  for (const key in newScales) {
    const newScale = newScales[key];
    const scale2 = scales[key];
    if (newScale.label === void 0 && scale2) {
      newScale.label = scale2.label;
    }
  }
  return newScales;
}
function actualDimensions({ fx, fy }, dimensions) {
  const { marginTop, marginRight, marginBottom, marginLeft, width, height } = outerDimensions(dimensions);
  const fxr = fx && outerRange(fx);
  const fyr = fy && outerRange(fy);
  return {
    marginTop: fy ? fyr[0] : marginTop,
    marginRight: fx ? width - fxr[1] : marginRight,
    marginBottom: fy ? height - fyr[1] : marginBottom,
    marginLeft: fx ? fxr[0] : marginLeft,
    // Some marks, namely the x- and y-axis labels, want to know what the
    // desired (rather than actual) margins are for positioning.
    inset: {
      marginTop: dimensions.marginTop,
      marginRight: dimensions.marginRight,
      marginBottom: dimensions.marginBottom,
      marginLeft: dimensions.marginLeft
    },
    width,
    height
  };
}
function outerRange(scale2) {
  const domain = scale2.domain();
  if (domain.length === 0) return [0, scale2.bandwidth()];
  let x12 = scale2(domain[0]);
  let x2 = scale2(domain[domain.length - 1]);
  if (x2 < x12) [x12, x2] = [x2, x12];
  return [x12, x2 + scale2.bandwidth()];
}
var curves = /* @__PURE__ */ new Map([
  ["basis", basis2],
  ["basis-closed", basisClosed2],
  ["basis-open", basisOpen],
  ["bundle", bundle],
  ["bump-x", bumpX],
  ["bump-y", bumpY],
  ["cardinal", cardinal],
  ["cardinal-closed", cardinalClosed],
  ["cardinal-open", cardinalOpen],
  ["catmull-rom", catmullRom],
  ["catmull-rom-closed", catmullRomClosed],
  ["catmull-rom-open", catmullRomOpen],
  ["linear", curveLinear],
  ["linear-closed", linearClosed],
  ["monotone-x", monotoneX],
  ["monotone-y", monotoneY],
  ["natural", natural],
  ["step", step],
  ["step-after", stepAfter],
  ["step-before", stepBefore]
]);
function maybeCurve(curve = curveLinear, tension) {
  if (typeof curve === "function") return curve;
  const c3 = curves.get(`${curve}`.toLowerCase());
  if (!c3) throw new Error(`unknown curve: ${curve}`);
  if (tension !== void 0) {
    if ("beta" in c3) {
      return c3.beta(tension);
    } else if ("tension" in c3) {
      return c3.tension(tension);
    } else if ("alpha" in c3) {
      return c3.alpha(tension);
    }
  }
  return c3;
}
function maybeCurveAuto(curve = curveAuto, tension) {
  return typeof curve !== "function" && `${curve}`.toLowerCase() === "auto" ? curveAuto : maybeCurve(curve, tension);
}
function curveAuto(context) {
  return curveLinear(context);
}
function binX(outputs = { y: "count" }, options = {}) {
  [outputs, options] = mergeOptions$1(outputs, options);
  const { x: x2, y: y2 } = options;
  return binn(maybeBinValue(x2, options, identity$13), null, null, y2, outputs, maybeInsetX(options));
}
function binY(outputs = { x: "count" }, options = {}) {
  [outputs, options] = mergeOptions$1(outputs, options);
  const { x: x2, y: y2 } = options;
  return binn(null, maybeBinValue(y2, options, identity$13), x2, null, outputs, maybeInsetY(options));
}
function bin(outputs = { fill: "count" }, options = {}) {
  [outputs, options] = mergeOptions$1(outputs, options);
  const { x: x2, y: y2 } = maybeBinValueTuple(options);
  return binn(x2, y2, null, null, outputs, maybeInsetX(maybeInsetY(options)));
}
function maybeDenseInterval(bin2, k2, options = {}) {
  if (options?.interval == null) return options;
  const { reduce = reduceFirst$1 } = options;
  const outputs = { filter: null };
  if (options[k2] != null) outputs[k2] = reduce;
  if (options[`${k2}1`] != null) outputs[`${k2}1`] = reduce;
  if (options[`${k2}2`] != null) outputs[`${k2}2`] = reduce;
  return bin2(outputs, options);
}
function maybeDenseIntervalX({ x: x2 = indexOf, ...options } = {}) {
  return maybeDenseInterval(binX, "y", withTip({ x: x2, ...maybeIdentityY(options) }, "x"));
}
function maybeDenseIntervalY({ y: y2 = indexOf, ...options } = {}) {
  return maybeDenseInterval(binY, "x", withTip({ y: y2, ...maybeIdentityX(options) }, "y"));
}
function binn(bx, by, gx, gy, {
  data: reduceData = reduceIdentity,
  // TODO avoid materializing when unused?
  filter: filter3 = reduceCount,
  // return only non-empty bins by default
  sort: sort3,
  reverse: reverse3,
  ...outputs
  // output channel definitions
} = {}, inputs = {}) {
  bx = maybeBin(bx);
  by = maybeBin(by);
  outputs = maybeBinOutputs(outputs, inputs);
  reduceData = maybeBinReduce(reduceData, identity$13);
  sort3 = sort3 == null ? void 0 : maybeBinOutput("sort", sort3, inputs);
  filter3 = filter3 == null ? void 0 : maybeBinEvaluator("filter", filter3, inputs);
  if (gx != null && hasOutput(outputs, "x", "x1", "x2")) gx = null;
  if (gy != null && hasOutput(outputs, "y", "y1", "y2")) gy = null;
  const [BX1, setBX1] = maybeColumn(bx);
  const [BX2, setBX2] = maybeColumn(bx);
  const [BY1, setBY1] = maybeColumn(by);
  const [BY2, setBY2] = maybeColumn(by);
  const [k2, gk] = gx != null ? [gx, "x"] : gy != null ? [gy, "y"] : [];
  const [GK, setGK] = maybeColumn(k2);
  const {
    x: x2,
    y: y2,
    z,
    fill,
    stroke,
    x1: x12,
    x2: x22,
    // consumed if x is an output
    y1: y12,
    y2: y22,
    // consumed if y is an output
    domain,
    cumulative,
    thresholds,
    interval,
    ...options
  } = inputs;
  const [GZ, setGZ] = maybeColumn(z);
  const [vfill] = maybeColorChannel(fill);
  const [vstroke] = maybeColorChannel(stroke);
  const [GF, setGF] = maybeColumn(vfill);
  const [GS, setGS] = maybeColumn(vstroke);
  return {
    ..."z" in inputs && { z: GZ || z },
    ..."fill" in inputs && { fill: GF || fill },
    ..."stroke" in inputs && { stroke: GS || stroke },
    ...basic(options, (data, facets, plotOptions) => {
      const K2 = maybeApplyInterval(valueof(data, k2), plotOptions?.[gk]);
      const Z = valueof(data, z);
      const F = valueof(data, vfill);
      const S = valueof(data, vstroke);
      const G = maybeSubgroup(outputs, { z: Z, fill: F, stroke: S });
      const groupFacets = [];
      const groupData = [];
      const GK2 = K2 && setGK([]);
      const GZ2 = Z && setGZ([]);
      const GF2 = F && setGF([]);
      const GS2 = S && setGS([]);
      const BX12 = bx && setBX1([]);
      const BX22 = bx && setBX2([]);
      const BY12 = by && setBY1([]);
      const BY22 = by && setBY2([]);
      const bin2 = bing(bx, by, data);
      let i = 0;
      for (const o of outputs) o.initialize(data);
      if (sort3) sort3.initialize(data);
      if (filter3) filter3.initialize(data);
      for (const facet of facets) {
        const groupFacet = [];
        for (const o of outputs) o.scope("facet", facet);
        if (sort3) sort3.scope("facet", facet);
        if (filter3) filter3.scope("facet", facet);
        for (const [f, I] of maybeGroup(facet, G)) {
          for (const [k3, g] of maybeGroup(I, K2)) {
            for (const [b, extent3] of bin2(g)) {
              if (G) extent3.z = f;
              if (filter3 && !filter3.reduce(b, extent3)) continue;
              groupFacet.push(i++);
              groupData.push(reduceData.reduceIndex(b, data, extent3));
              if (K2) GK2.push(k3);
              if (Z) GZ2.push(G === Z ? f : Z[(b.length > 0 ? b : g)[0]]);
              if (F) GF2.push(G === F ? f : F[(b.length > 0 ? b : g)[0]]);
              if (S) GS2.push(G === S ? f : S[(b.length > 0 ? b : g)[0]]);
              if (BX12) BX12.push(extent3.x1), BX22.push(extent3.x2);
              if (BY12) BY12.push(extent3.y1), BY22.push(extent3.y2);
              for (const o of outputs) o.reduce(b, extent3);
              if (sort3) sort3.reduce(b, extent3);
            }
          }
        }
        groupFacets.push(groupFacet);
      }
      maybeSort(groupFacets, sort3, reverse3);
      return { data: groupData, facets: groupFacets };
    }),
    ...!hasOutput(outputs, "x") && (BX1 ? { x1: BX1, x2: BX2, x: mid(BX1, BX2) } : { x: x2, x1: x12, x2: x22 }),
    ...!hasOutput(outputs, "y") && (BY1 ? { y1: BY1, y2: BY2, y: mid(BY1, BY2) } : { y: y2, y1: y12, y2: y22 }),
    ...GK && { [gk]: GK },
    ...Object.fromEntries(outputs.map(({ name, output }) => [name, output]))
  };
}
function mergeOptions$1({ cumulative, domain, thresholds, interval, ...outputs }, options) {
  return [outputs, { cumulative, domain, thresholds, interval, ...options }];
}
function maybeBinValue(value2, { cumulative, domain, thresholds, interval }, defaultValue) {
  value2 = { ...maybeValue(value2) };
  if (value2.domain === void 0) value2.domain = domain;
  if (value2.cumulative === void 0) value2.cumulative = cumulative;
  if (value2.thresholds === void 0) value2.thresholds = thresholds;
  if (value2.interval === void 0) value2.interval = interval;
  if (value2.value === void 0) value2.value = defaultValue;
  value2.thresholds = maybeThresholds(value2.thresholds, value2.interval);
  return value2;
}
function maybeBinValueTuple(options) {
  let { x: x2, y: y2 } = options;
  x2 = maybeBinValue(x2, options);
  y2 = maybeBinValue(y2, options);
  [x2.value, y2.value] = maybeTuple(x2.value, y2.value);
  return { x: x2, y: y2 };
}
function maybeBin(options) {
  if (options == null) return;
  const { value: value2, cumulative, domain = extent, thresholds } = options;
  const bin2 = (data) => {
    let V = valueof(data, value2);
    let T;
    if (isTemporal(V) || isTimeThresholds(thresholds)) {
      V = map$1(V, coerceDate, Float64Array);
      let [min3, max2] = typeof domain === "function" ? domain(V) : domain;
      let t = typeof thresholds === "function" && !isInterval(thresholds) ? thresholds(V, min3, max2) : thresholds;
      if (typeof t === "number") t = utcTickInterval(min3, max2, t);
      if (isInterval(t)) {
        if (domain === extent) {
          min3 = t.floor(min3);
          max2 = t.offset(t.floor(max2));
        }
        t = t.range(min3, t.offset(max2));
      }
      T = t;
    } else {
      V = coerceNumbers(V);
      let [min3, max2] = typeof domain === "function" ? domain(V) : domain;
      let t = typeof thresholds === "function" && !isInterval(thresholds) ? thresholds(V, min3, max2) : thresholds;
      if (typeof t === "number") {
        if (domain === extent) {
          let step2 = tickIncrement(min3, max2, t);
          if (isFinite(step2)) {
            if (step2 > 0) {
              let r0 = Math.round(min3 / step2);
              let r1 = Math.round(max2 / step2);
              if (!(r0 * step2 <= min3)) --r0;
              if (!(r1 * step2 > max2)) ++r1;
              let n = r1 - r0 + 1;
              t = new Float64Array(n);
              for (let i = 0; i < n; ++i) t[i] = (r0 + i) * step2;
            } else if (step2 < 0) {
              step2 = -step2;
              let r0 = Math.round(min3 * step2);
              let r1 = Math.round(max2 * step2);
              if (!(r0 / step2 <= min3)) --r0;
              if (!(r1 / step2 > max2)) ++r1;
              let n = r1 - r0 + 1;
              t = new Float64Array(n);
              for (let i = 0; i < n; ++i) t[i] = (r0 + i) / step2;
            } else {
              t = [min3];
            }
          } else {
            t = [min3];
          }
        } else {
          t = ticks(min3, max2, t);
        }
      } else if (isInterval(t)) {
        if (domain === extent) {
          min3 = t.floor(min3);
          max2 = t.offset(t.floor(max2));
        }
        t = t.range(min3, t.offset(max2));
      }
      T = t;
    }
    const E2 = [];
    if (T.length === 1) E2.push([T[0], T[0]]);
    else for (let i = 1; i < T.length; ++i) E2.push([T[i - 1], T[i]]);
    E2.bin = (cumulative < 0 ? bin1cn : cumulative > 0 ? bin1cp : bin1)(E2, T, V);
    return E2;
  };
  bin2.label = labelof(value2);
  return bin2;
}
function maybeThresholds(thresholds, interval, defaultThresholds = thresholdAuto) {
  if (thresholds === void 0) {
    return interval === void 0 ? defaultThresholds : maybeRangeInterval(interval);
  }
  if (typeof thresholds === "string") {
    switch (thresholds.toLowerCase()) {
      case "freedman-diaconis":
        return thresholdFreedmanDiaconis;
      case "scott":
        return thresholdScott;
      case "sturges":
        return thresholdSturges;
      case "auto":
        return thresholdAuto;
    }
    return utcInterval(thresholds);
  }
  return thresholds;
}
function maybeBinOutputs(outputs, inputs) {
  return maybeOutputs(outputs, inputs, maybeBinOutput);
}
function maybeBinOutput(name, reduce, inputs) {
  return maybeOutput(name, reduce, inputs, maybeBinEvaluator);
}
function maybeBinEvaluator(name, reduce, inputs) {
  return maybeEvaluator(name, reduce, inputs, maybeBinReduce);
}
function maybeBinReduce(reduce, value2) {
  return maybeReduce$1(reduce, value2, maybeBinReduceFallback);
}
function maybeBinReduceFallback(reduce) {
  switch (`${reduce}`.toLowerCase()) {
    case "x":
      return reduceX;
    case "x1":
      return reduceX1;
    case "x2":
      return reduceX2;
    case "y":
      return reduceY;
    case "y1":
      return reduceY1;
    case "y2":
      return reduceY2;
    case "z":
      return reduceZ;
  }
  throw new Error(`invalid bin reduce: ${reduce}`);
}
function thresholdAuto(values2, min3, max2) {
  return Math.min(200, thresholdScott(values2, min3, max2));
}
function isTimeThresholds(t) {
  return isTimeInterval(t) || isIterable(t) && isTemporal(t);
}
function bing(bx, by, data) {
  const EX = bx?.(data);
  const EY = by?.(data);
  return EX && EY ? function* (I) {
    const X = EX.bin(I);
    for (const [ix, [x12, x2]] of EX.entries()) {
      const Y = EY.bin(X[ix]);
      for (const [iy, [y12, y2]] of EY.entries()) {
        yield [Y[iy], { data, x1: x12, y1: y12, x2, y2 }];
      }
    }
  } : EX ? function* (I) {
    const X = EX.bin(I);
    for (const [i, [x12, x2]] of EX.entries()) {
      yield [X[i], { data, x1: x12, x2 }];
    }
  } : function* (I) {
    const Y = EY.bin(I);
    for (const [i, [y12, y2]] of EY.entries()) {
      yield [Y[i], { data, y1: y12, y2 }];
    }
  };
}
function bin1(E2, T, V) {
  T = coerceNumbers(T);
  return (I) => {
    const B3 = E2.map(() => []);
    for (const i of I) B3[bisectRight(T, V[i]) - 1]?.push(i);
    return B3;
  };
}
function bin1cp(E2, T, V) {
  const bin2 = bin1(E2, T, V);
  return (I) => {
    const B3 = bin2(I);
    for (let i = 1, n = B3.length; i < n; ++i) {
      const C3 = B3[i - 1];
      const b = B3[i];
      for (const j of C3) b.push(j);
    }
    return B3;
  };
}
function bin1cn(E2, T, V) {
  const bin2 = bin1(E2, T, V);
  return (I) => {
    const B3 = bin2(I);
    for (let i = B3.length - 2; i >= 0; --i) {
      const C3 = B3[i + 1];
      const b = B3[i];
      for (const j of C3) b.push(j);
    }
    return B3;
  };
}
function mid1(x12, x2) {
  const m = (+x12 + +x2) / 2;
  return x12 instanceof Date ? new Date(m) : m;
}
var reduceX = {
  reduceIndex(I, X, { x1: x12, x2 }) {
    return mid1(x12, x2);
  }
};
var reduceY = {
  reduceIndex(I, X, { y1: y12, y2 }) {
    return mid1(y12, y2);
  }
};
var reduceX1 = {
  reduceIndex(I, X, { x1: x12 }) {
    return x12;
  }
};
var reduceX2 = {
  reduceIndex(I, X, { x2 }) {
    return x2;
  }
};
var reduceY1 = {
  reduceIndex(I, X, { y1: y12 }) {
    return y12;
  }
};
var reduceY2 = {
  reduceIndex(I, X, { y2 }) {
    return y2;
  }
};
var areaDefaults = {
  ariaLabel: "area",
  strokeWidth: 1,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeMiterlimit: 1
};
var areaLineDefaults = {
  ariaLabel: "area-line",
  fillOpacity: 0.3,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeMiterlimit: 1
};
var Area = class extends Mark {
  constructor(data, options = {}, defaults2 = areaDefaults) {
    const { x1: x12, y1: y12, x2, y2, z, curve, tension } = options;
    super(
      data,
      {
        x1: { value: x12, scale: "x" },
        y1: { value: y12, scale: "y" },
        x2: { value: x2, scale: "x", optional: true },
        y2: { value: y2, scale: "y", optional: true },
        z: { value: maybeZ(options), optional: true }
      },
      options,
      defaults2
    );
    this.z = z;
    this.curve = maybeCurve(curve, tension);
  }
  filter(index2) {
    return index2;
  }
  render(index2, scales, channels, dimensions, context) {
    const { x1: X12, y1: Y12, x2: X22 = X12, y2: Y22 = Y12 } = channels;
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, scales, 0, 0).call(
      (g) => g.selectAll().data(groupIndex(index2, [X12, Y12, X22, Y22], this, channels)).enter().append("path").call(applyDirectStyles, this).call(applyGroupedChannelStyles, this, channels).attr(
        "d",
        area2().curve(this.curve).defined((i) => i >= 0).x0((i) => X12[i]).y0((i) => Y12[i]).x1((i) => X22[i]).y1((i) => Y22[i])
      )
    ).node();
  }
};
var AreaLine = class extends Area {
  constructor(data, options = {}) {
    super(data, options, areaLineDefaults);
    markers(this, options);
  }
  render(index2, scales, channels, dimensions, context) {
    const { x1: X12, y1: Y12, x2: X22 = X12, y2: Y22 = Y12 } = channels;
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, scales, 0, 0).call(
      (g) => g.selectAll().data(groupIndex(index2, [X12, Y12, X22, Y22], this, channels)).enter().append("g").call(applyDirectStyles, this).call(applyGroupedChannelStyles, this, channels).call(
        (e) => e.append("path").attr("stroke", "none").attr(
          "d",
          area2().curve(this.curve).defined((i) => i >= 0).x0((i) => X12[i]).y0((i) => Y12[i]).x1((i) => X22[i]).y1((i) => Y22[i])
        )
      ).call(
        (e) => e.append("path").call(applyGroupedMarkers, this, channels, context).attr("fill", "none").attr("transform", offset ? `translate(${offset},${offset})` : null).attr(
          "d",
          line().curve(this.curve).defined((i) => i >= 0).x((i) => X22[i]).y((i) => Y22[i])
        )
      )
    ).node();
  }
};
function area3(data, options) {
  if (options === void 0) return areaY(data, { x: first, y: second2 });
  return new Area(data, options);
}
function areaX(data, options) {
  const { x: x2, y: y2, line: line3, color: color3, stroke = color3, fill = color3, z = x2 === fill || x2 === stroke ? null : void 0, ...rest } = maybeDenseIntervalY(options);
  return new (line3 ? AreaLine : Area)(data, maybeStackX({ ...rest, x: x2, y1: y2, y2: void 0, z, stroke, fill }));
}
function areaY(data, options) {
  const { x: x2, y: y2, line: line3, color: color3, stroke = color3, fill = color3, z = y2 === fill || y2 === stroke ? null : void 0, ...rest } = maybeDenseIntervalX(options);
  return new (line3 ? AreaLine : Area)(data, maybeStackY({ ...rest, x1: x2, x2: void 0, y: y2, z, stroke, fill }));
}
var defaults$d = {
  ariaLabel: "link",
  fill: "none",
  stroke: "currentColor",
  strokeMiterlimit: 1
};
var Link = class extends Mark {
  constructor(data, options = {}) {
    const { x1: x12, y1: y12, x2, y2, curve, tension } = options;
    super(
      data,
      {
        x1: { value: x12, scale: "x" },
        y1: { value: y12, scale: "y" },
        x2: { value: x2, scale: "x", optional: true },
        y2: { value: y2, scale: "y", optional: true }
      },
      options,
      defaults$d
    );
    this.curve = maybeCurveAuto(curve, tension);
    markers(this, options);
  }
  project(channels, values2, context) {
    if (this.curve !== curveAuto) {
      super.project(channels, values2, context);
    }
  }
  render(index2, scales, channels, dimensions, context) {
    const { x1: X12, y1: Y12, x2: X22 = X12, y2: Y22 = Y12 } = channels;
    const { curve } = this;
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, scales).call(
      (g) => g.selectAll().data(index2).enter().append("path").call(applyDirectStyles, this).attr(
        "d",
        curve === curveAuto && context.projection ? sphereLink(context.path(), X12, Y12, X22, Y22) : (i) => {
          const p = pathRound();
          const c3 = curve(p);
          c3.lineStart();
          c3.point(X12[i], Y12[i]);
          c3.point(X22[i], Y22[i]);
          c3.lineEnd();
          return p;
        }
      ).call(applyChannelStyles, this, channels).call(applyMarkers, this, channels, context)
    ).node();
  }
};
function sphereLink(path2, X12, Y12, X22, Y22) {
  X12 = coerceNumbers(X12);
  Y12 = coerceNumbers(Y12);
  X22 = coerceNumbers(X22);
  Y22 = coerceNumbers(Y22);
  return (i) => path2({
    type: "LineString",
    coordinates: [
      [X12[i], Y12[i]],
      [X22[i], Y22[i]]
    ]
  });
}
function link2(data, { x: x2, x1: x12, x2: x22, y: y2, y1: y12, y2: y22, ...options } = {}) {
  [x12, x22] = maybeSameValue(x2, x12, x22);
  [y12, y22] = maybeSameValue(y2, y12, y22);
  return new Link(data, { ...options, x1: x12, x2: x22, y1: y12, y2: y22 });
}
function maybeSameValue(x2, x12, x22) {
  if (x2 === void 0) {
    if (x12 === void 0) {
      if (x22 !== void 0) return [x22];
    } else {
      if (x22 === void 0) return [x12];
    }
  } else if (x12 === void 0) {
    return x22 === void 0 ? [x2] : [x2, x22];
  } else if (x22 === void 0) {
    return [x2, x12];
  }
  return [x12, x22];
}
var defaults$c = {
  ariaLabel: "arrow",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeMiterlimit: 1,
  strokeWidth: 1.5
};
var Arrow = class extends Mark {
  constructor(data, options = {}) {
    const {
      x1: x12,
      y1: y12,
      x2,
      y2,
      bend = 0,
      headAngle = 60,
      headLength = 8,
      // Disable the arrow with headLength = 0; or, use Plot.link.
      inset = 0,
      insetStart = inset,
      insetEnd = inset,
      sweep
    } = options;
    super(
      data,
      {
        x1: { value: x12, scale: "x" },
        y1: { value: y12, scale: "y" },
        x2: { value: x2, scale: "x", optional: true },
        y2: { value: y2, scale: "y", optional: true }
      },
      options,
      defaults$c
    );
    this.bend = bend === true ? 22.5 : Math.max(-90, Math.min(90, bend));
    this.headAngle = +headAngle;
    this.headLength = +headLength;
    this.insetStart = +insetStart;
    this.insetEnd = +insetEnd;
    this.sweep = maybeSweep(sweep);
  }
  render(index2, scales, channels, dimensions, context) {
    const { x1: X12, y1: Y12, x2: X22 = X12, y2: Y22 = Y12, SW } = channels;
    const { strokeWidth, bend, headAngle, headLength, insetStart, insetEnd } = this;
    const sw = SW ? (i) => SW[i] : constant5(strokeWidth === void 0 ? 1 : strokeWidth);
    const wingAngle = headAngle * radians3 / 2;
    const wingScale = headLength / 1.5;
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, scales).call(
      (g) => g.selectAll().data(index2).enter().append("path").call(applyDirectStyles, this).attr("d", (i) => {
        let x12 = X12[i], y12 = Y12[i], x2 = X22[i], y2 = Y22[i];
        const lineLength = Math.hypot(x2 - x12, y2 - y12);
        if (lineLength <= insetStart + insetEnd) return null;
        let lineAngle = Math.atan2(y2 - y12, x2 - x12);
        const headLength2 = Math.min(wingScale * sw(i), lineLength / 3);
        const bendAngle = this.sweep(x12, y12, x2, y2) * bend * radians3;
        const r = Math.hypot(lineLength / Math.tan(bendAngle), lineLength) / 2;
        if (insetStart || insetEnd) {
          if (r < 1e5) {
            const sign3 = Math.sign(bendAngle);
            const [cx, cy] = pointPointCenter([x12, y12], [x2, y2], r, sign3);
            if (insetStart) {
              [x12, y12] = circleCircleIntersect([cx, cy, r], [x12, y12, insetStart], -sign3 * Math.sign(insetStart));
            }
            if (insetEnd) {
              const [x5, y5] = circleCircleIntersect([cx, cy, r], [x2, y2, insetEnd], sign3 * Math.sign(insetEnd));
              lineAngle += Math.atan2(y5 - cy, x5 - cx) - Math.atan2(y2 - cy, x2 - cx);
              x2 = x5, y2 = y5;
            }
          } else {
            const dx = x2 - x12, dy = y2 - y12, d = Math.hypot(dx, dy);
            if (insetStart) x12 += dx / d * insetStart, y12 += dy / d * insetStart;
            if (insetEnd) x2 -= dx / d * insetEnd, y2 -= dy / d * insetEnd;
          }
        }
        const endAngle = lineAngle + bendAngle;
        const leftAngle = endAngle + wingAngle;
        const rightAngle = endAngle - wingAngle;
        const x3 = x2 - headLength2 * Math.cos(leftAngle);
        const y3 = y2 - headLength2 * Math.sin(leftAngle);
        const x4 = x2 - headLength2 * Math.cos(rightAngle);
        const y4 = y2 - headLength2 * Math.sin(rightAngle);
        const a2 = r < 1e5 ? `A${r},${r} 0,0,${bendAngle > 0 ? 1 : 0} ` : `L`;
        const h = headLength2 ? `M${x3},${y3}L${x2},${y2}L${x4},${y4}` : "";
        return `M${x12},${y12}${a2}${x2},${y2}${h}`;
      }).call(applyChannelStyles, this, channels)
    ).node();
  }
};
function maybeSweep(sweep = 1) {
  if (typeof sweep === "number") return constant5(Math.sign(sweep));
  if (typeof sweep === "function") return (x12, y12, x2, y2) => Math.sign(sweep(x12, y12, x2, y2));
  switch (keyword(sweep, "sweep", ["+x", "-x", "+y", "-y"])) {
    case "+x":
      return (x12, y12, x2) => ascending(x12, x2);
    case "-x":
      return (x12, y12, x2) => descending(x12, x2);
    case "+y":
      return (x12, y12, x2, y2) => ascending(y12, y2);
    case "-y":
      return (x12, y12, x2, y2) => descending(y12, y2);
  }
}
function pointPointCenter([ax, ay], [bx, by], r, sign3) {
  const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
  const k2 = sign3 * Math.sqrt(r * r - d * d / 4) / d;
  return [(ax + bx) / 2 - dy * k2, (ay + by) / 2 + dx * k2];
}
function circleCircleIntersect([ax, ay, ar], [bx, by, br], sign3) {
  const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
  const x2 = (dx * dx + dy * dy - br * br + ar * ar) / (2 * d);
  const y2 = sign3 * Math.sqrt(ar * ar - x2 * x2);
  return [ax + (dx * x2 + dy * y2) / d, ay + (dy * x2 - dx * y2) / d];
}
function arrow(data, { x: x2, x1: x12, x2: x22, y: y2, y1: y12, y2: y22, ...options } = {}) {
  [x12, x22] = maybeSameValue(x2, x12, x22);
  [y12, y22] = maybeSameValue(y2, y12, y22);
  return new Arrow(data, { ...options, x1: x12, x2: x22, y1: y12, y2: y22 });
}
var barDefaults = {
  ariaLabel: "bar"
};
var AbstractBar = class extends Mark {
  constructor(data, channels, options = {}, defaults2 = barDefaults) {
    super(data, channels, options, defaults2);
    rectInsets(this, options);
    rectRadii(this, options);
  }
  render(index2, scales, channels, dimensions, context) {
    const { rx, ry, rx1y1, rx1y2, rx2y1, rx2y2 } = this;
    const x2 = this._x(scales, channels, dimensions);
    const y2 = this._y(scales, channels, dimensions);
    const w = this._width(scales, channels, dimensions);
    const h = this._height(scales, channels, dimensions);
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(this._transform, this, scales).call(
      (g) => g.selectAll().data(index2).enter().call(
        rx1y1 || rx1y2 || rx2y1 || rx2y2 ? (g2) => g2.append("path").call(applyDirectStyles, this).call(applyRoundedRect, x2, y2, add(x2, w), add(y2, h), this).call(applyChannelStyles, this, channels) : (g2) => g2.append("rect").call(applyDirectStyles, this).attr("x", x2).attr("width", w).attr("y", y2).attr("height", h).call(applyAttr, "rx", rx).call(applyAttr, "ry", ry).call(applyChannelStyles, this, channels)
      )
    ).node();
  }
  _x(scales, { x: X }, { marginLeft }) {
    const { insetLeft } = this;
    return X ? (i) => X[i] + insetLeft : marginLeft + insetLeft;
  }
  _y(scales, { y: Y }, { marginTop }) {
    const { insetTop } = this;
    return Y ? (i) => Y[i] + insetTop : marginTop + insetTop;
  }
  _width({ x: x2 }, { x: X }, { marginRight, marginLeft, width }) {
    const { insetLeft, insetRight } = this;
    const bandwidth = X && x2 ? x2.bandwidth() : width - marginRight - marginLeft;
    return Math.max(0, bandwidth - insetLeft - insetRight);
  }
  _height({ y: y2 }, { y: Y }, { marginTop, marginBottom, height }) {
    const { insetTop, insetBottom } = this;
    const bandwidth = Y && y2 ? y2.bandwidth() : height - marginTop - marginBottom;
    return Math.max(0, bandwidth - insetTop - insetBottom);
  }
};
function add(a2, b) {
  return typeof a2 === "function" && typeof b === "function" ? (i) => a2(i) + b(i) : typeof a2 === "function" ? (i) => a2(i) + b : typeof b === "function" ? (i) => a2 + b(i) : a2 + b;
}
var BarX = class extends AbstractBar {
  constructor(data, options = {}, defaults2) {
    const { x1: x12, x2, y: y2 } = options;
    super(
      data,
      {
        x1: { value: x12, scale: "x" },
        x2: { value: x2, scale: "x" },
        y: { value: y2, scale: "y", type: "band", optional: true }
      },
      options,
      defaults2
    );
  }
  _transform(selection2, mark, { x: x2 }) {
    selection2.call(applyTransform, mark, { x: x2 }, 0, 0);
  }
  _x({ x: x2 }, { x1: X12, x2: X22 }, { marginLeft }) {
    const { insetLeft } = this;
    return isCollapsed(x2) ? marginLeft + insetLeft : (i) => Math.min(X12[i], X22[i]) + insetLeft;
  }
  _width({ x: x2 }, { x1: X12, x2: X22 }, { marginRight, marginLeft, width }) {
    const { insetLeft, insetRight } = this;
    return isCollapsed(x2) ? width - marginRight - marginLeft - insetLeft - insetRight : (i) => Math.max(0, Math.abs(X22[i] - X12[i]) - insetLeft - insetRight);
  }
};
var BarY = class extends AbstractBar {
  constructor(data, options = {}, defaults2) {
    const { x: x2, y1: y12, y2 } = options;
    super(
      data,
      {
        y1: { value: y12, scale: "y" },
        y2: { value: y2, scale: "y" },
        x: { value: x2, scale: "x", type: "band", optional: true }
      },
      options,
      defaults2
    );
  }
  _transform(selection2, mark, { y: y2 }) {
    selection2.call(applyTransform, mark, { y: y2 }, 0, 0);
  }
  _y({ y: y2 }, { y1: Y12, y2: Y22 }, { marginTop }) {
    const { insetTop } = this;
    return isCollapsed(y2) ? marginTop + insetTop : (i) => Math.min(Y12[i], Y22[i]) + insetTop;
  }
  _height({ y: y2 }, { y1: Y12, y2: Y22 }, { marginTop, marginBottom, height }) {
    const { insetTop, insetBottom } = this;
    return isCollapsed(y2) ? height - marginTop - marginBottom - insetTop - insetBottom : (i) => Math.max(0, Math.abs(Y22[i] - Y12[i]) - insetTop - insetBottom);
  }
};
function barX(data, options = {}) {
  if (!hasXY(options)) options = { ...options, y: indexOf, x2: identity$13 };
  return new BarX(data, maybeStackX(maybeIntervalX(maybeIdentityX(options))));
}
function barY(data, options = {}) {
  if (!hasXY(options)) options = { ...options, x: indexOf, y2: identity$13 };
  return new BarY(data, maybeStackY(maybeIntervalY(maybeIdentityY(options))));
}
var defaults$b = {
  ariaLabel: "cell"
};
var Cell = class extends AbstractBar {
  constructor(data, { x: x2, y: y2, ...options } = {}) {
    super(
      data,
      {
        x: { value: x2, scale: "x", type: "band", optional: true },
        y: { value: y2, scale: "y", type: "band", optional: true }
      },
      options,
      defaults$b
    );
  }
  _transform(selection2, mark) {
    selection2.call(applyTransform, mark, {}, 0, 0);
  }
};
function cell(data, { x: x2, y: y2, ...options } = {}) {
  [x2, y2] = maybeTuple(x2, y2);
  return new Cell(data, { ...options, x: x2, y: y2 });
}
function cellX(data, { x: x2 = indexOf, fill, stroke, ...options } = {}) {
  if (fill === void 0 && maybeColorChannel(stroke)[0] === void 0) fill = identity$13;
  return new Cell(data, { ...options, x: x2, fill, stroke });
}
function cellY(data, { y: y2 = indexOf, fill, stroke, ...options } = {}) {
  if (fill === void 0 && maybeColorChannel(stroke)[0] === void 0) fill = identity$13;
  return new Cell(data, { ...options, y: y2, fill, stroke });
}
var defaults$a = {
  ariaLabel: "dot",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5
};
function withDefaultSort(options) {
  return options.sort === void 0 && options.reverse === void 0 ? sort2({ channel: "-r" }, options) : options;
}
var Dot = class extends Mark {
  constructor(data, options = {}) {
    const { x: x2, y: y2, r, rotate, symbol: symbol2 = circle, frameAnchor } = options;
    const [vrotate, crotate] = maybeNumberChannel(rotate, 0);
    const [vsymbol, csymbol] = maybeSymbolChannel(symbol2);
    const [vr, cr] = maybeNumberChannel(r, vsymbol == null ? 3 : 4.5);
    super(
      data,
      {
        x: { value: x2, scale: "x", optional: true },
        y: { value: y2, scale: "y", optional: true },
        r: { value: vr, scale: "r", filter: positive, optional: true },
        rotate: { value: vrotate, optional: true },
        symbol: { value: vsymbol, scale: "auto", optional: true }
      },
      withDefaultSort(options),
      defaults$a
    );
    this.r = cr;
    this.rotate = crotate;
    this.symbol = csymbol;
    this.frameAnchor = maybeFrameAnchor(frameAnchor);
    const { channels } = this;
    const { symbol: symbolChannel } = channels;
    if (symbolChannel) {
      const { fill: fillChannel, stroke: strokeChannel } = channels;
      symbolChannel.hint = {
        fill: fillChannel ? fillChannel.value === symbolChannel.value ? "color" : "currentColor" : this.fill ?? "currentColor",
        stroke: strokeChannel ? strokeChannel.value === symbolChannel.value ? "color" : "currentColor" : this.stroke ?? "none"
      };
    }
  }
  render(index2, scales, channels, dimensions, context) {
    const { x: x2, y: y2 } = scales;
    const { x: X, y: Y, r: R, rotate: A5, symbol: S } = channels;
    const { r, rotate, symbol: symbol2 } = this;
    const [cx, cy] = applyFrameAnchor(this, dimensions);
    const circle3 = symbol2 === circle;
    const size = R ? void 0 : r * r * Math.PI;
    if (negative(r)) index2 = [];
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, { x: X && x2, y: Y && y2 }).call(
      (g) => g.selectAll().data(index2).enter().append(circle3 ? "circle" : "path").call(applyDirectStyles, this).call(
        circle3 ? (selection2) => {
          selection2.attr("cx", X ? (i) => X[i] : cx).attr("cy", Y ? (i) => Y[i] : cy).attr("r", R ? (i) => R[i] : r);
        } : (selection2) => {
          selection2.attr(
            "transform",
            template`translate(${X ? (i) => X[i] : cx},${Y ? (i) => Y[i] : cy})${A5 ? (i) => ` rotate(${A5[i]})` : rotate ? ` rotate(${rotate})` : ``}`
          ).attr(
            "d",
            R && S ? (i) => {
              const p = pathRound();
              S[i].draw(p, R[i] * R[i] * Math.PI);
              return p;
            } : R ? (i) => {
              const p = pathRound();
              symbol2.draw(p, R[i] * R[i] * Math.PI);
              return p;
            } : S ? (i) => {
              const p = pathRound();
              S[i].draw(p, size);
              return p;
            } : (() => {
              const p = pathRound();
              symbol2.draw(p, size);
              return p;
            })()
          );
        }
      ).call(applyChannelStyles, this, channels)
    ).node();
  }
};
function dot(data, { x: x2, y: y2, ...options } = {}) {
  if (options.frameAnchor === void 0) [x2, y2] = maybeTuple(x2, y2);
  return new Dot(data, { ...options, x: x2, y: y2 });
}
function dotX(data, { x: x2 = identity$13, ...options } = {}) {
  return new Dot(data, maybeIntervalMidY({ ...options, x: x2 }));
}
function dotY(data, { y: y2 = identity$13, ...options } = {}) {
  return new Dot(data, maybeIntervalMidX({ ...options, y: y2 }));
}
function circle2(data, options) {
  return dot(data, { ...options, symbol: "circle" });
}
function hexagon(data, options) {
  return dot(data, { ...options, symbol: "hexagon" });
}
var defaults$9 = {
  ariaLabel: "line",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeMiterlimit: 1
};
var Line = class extends Mark {
  constructor(data, options = {}) {
    const { x: x2, y: y2, z, curve, tension } = options;
    super(
      data,
      {
        x: { value: x2, scale: "x" },
        y: { value: y2, scale: "y" },
        z: { value: maybeZ(options), optional: true }
      },
      options,
      defaults$9
    );
    this.z = z;
    this.curve = maybeCurveAuto(curve, tension);
    markers(this, options);
  }
  filter(index2) {
    return index2;
  }
  project(channels, values2, context) {
    if (this.curve !== curveAuto) {
      super.project(channels, values2, context);
    }
  }
  render(index2, scales, channels, dimensions, context) {
    const { x: X, y: Y } = channels;
    const { curve } = this;
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, scales).call(
      (g) => g.selectAll().data(groupIndex(index2, [X, Y], this, channels)).enter().append("path").call(applyDirectStyles, this).call(applyGroupedChannelStyles, this, channels).call(applyGroupedMarkers, this, channels, context).attr(
        "d",
        curve === curveAuto && context.projection ? sphereLine(context.path(), X, Y) : line().curve(curve).defined((i) => i >= 0).x((i) => X[i]).y((i) => Y[i])
      )
    ).node();
  }
};
function sphereLine(path2, X, Y) {
  X = coerceNumbers(X);
  Y = coerceNumbers(Y);
  return (I) => {
    let line3 = [];
    const lines = [line3];
    for (const i of I) {
      if (i === -1) {
        line3 = [];
        lines.push(line3);
      } else {
        line3.push([X[i], Y[i]]);
      }
    }
    return path2({ type: "MultiLineString", coordinates: lines });
  };
}
function line2(data, { x: x2, y: y2, ...options } = {}) {
  [x2, y2] = maybeTuple(x2, y2);
  return new Line(data, { ...options, x: x2, y: y2 });
}
function lineX(data, options) {
  const { x: x2, y: y2, stroke, z = stroke === x2 ? null : void 0, ...rest } = maybeDenseIntervalY(options);
  return new Line(data, { ...rest, x: x2, y: y2, z, stroke });
}
function lineY(data, options) {
  const { x: x2, y: y2, stroke, z = stroke === y2 ? null : void 0, ...rest } = maybeDenseIntervalX(options);
  return new Line(data, { ...rest, x: x2, y: y2, z, stroke });
}
function autoSpec(data, options) {
  options = normalizeOptions(options);
  const { x: x2, y: y2, color: color3, size } = options;
  const X = materializeValue(data, x2);
  const Y = materializeValue(data, y2);
  const C3 = materializeValue(data, color3);
  const S = materializeValue(data, size);
  let {
    fx,
    fy,
    x: { value: xValue, reduce: xReduce, zero: xZero, ...xOptions },
    y: { value: yValue, reduce: yReduce, zero: yZero, ...yOptions },
    color: { value: colorValue, color: colorColor, reduce: colorReduce },
    size: { value: sizeValue, reduce: sizeReduce },
    // TODO constant radius?
    mark
  } = options;
  if (xReduce === void 0)
    xReduce = yReduce == null && xValue == null && sizeValue == null && yValue != null ? "count" : null;
  if (yReduce === void 0)
    yReduce = xReduce == null && yValue == null && sizeValue == null && xValue != null ? "count" : null;
  if (sizeReduce === void 0 && sizeValue == null && colorReduce == null && xReduce == null && yReduce == null && (xValue == null || isOrdinal(X)) && (yValue == null || isOrdinal(Y))) {
    sizeReduce = "count";
  }
  if (xZero === void 0) xZero = isZeroReducer(xReduce) ? true : void 0;
  if (yZero === void 0) yZero = isZeroReducer(yReduce) ? true : void 0;
  if (xValue == null && yValue == null) throw new Error("must specify x or y");
  if (xReduce != null && yValue == null) throw new Error("reducing x requires y");
  if (yReduce != null && xValue == null) throw new Error("reducing y requires x");
  if (mark === void 0) {
    mark = sizeValue != null || sizeReduce != null ? "dot" : isZeroReducer(xReduce) || isZeroReducer(yReduce) || colorReduce != null ? "bar" : xValue != null && yValue != null ? isOrdinal(X) || isOrdinal(Y) || xReduce == null && yReduce == null && !isMonotonic(X) && !isMonotonic(Y) ? "dot" : "line" : xValue != null || yValue != null ? "rule" : null;
  }
  let Z;
  let colorMode;
  let markImpl;
  switch (mark) {
    case "dot":
      markImpl = dot;
      colorMode = "stroke";
      break;
    case "line":
      markImpl = X && Y || xReduce != null || yReduce != null ? yZero || yReduce != null || X && isMonotonic(X) ? lineY : xZero || xReduce != null || Y && isMonotonic(Y) ? lineX : line2 : X ? lineX : lineY;
      colorMode = "stroke";
      if (isHighCardinality(C3)) Z = null;
      break;
    case "area":
      markImpl = !(yZero || yReduce != null) && (xZero || xReduce != null || Y && isMonotonic(Y)) ? areaX : areaY;
      colorMode = "fill";
      if (isHighCardinality(C3)) Z = null;
      break;
    case "rule":
      markImpl = X ? ruleX : ruleY;
      colorMode = "stroke";
      break;
    case "bar":
      markImpl = xReduce != null ? isOrdinal(Y) ? isSelectReducer(xReduce) && X && isOrdinal(X) ? cell : barX : rectX : yReduce != null ? isOrdinal(X) ? isSelectReducer(yReduce) && Y && isOrdinal(Y) ? cell : barY : rectY : colorReduce != null || sizeReduce != null ? X && isOrdinal(X) && Y && isOrdinal(Y) ? cell : X && isOrdinal(X) ? barY : Y && isOrdinal(Y) ? barX : rect : X && isNumeric(X) && !(Y && isNumeric(Y)) ? barX : Y && isNumeric(Y) && !(X && isNumeric(X)) ? barY : cell;
      colorMode = "fill";
      break;
    default:
      throw new Error(`invalid mark: ${mark}`);
  }
  let markOptions2 = {
    fx,
    fy,
    x: X ?? void 0,
    // treat null x as undefined for implicit stack
    y: Y ?? void 0,
    // treat null y as undefined for implicit stack
    [colorMode]: C3 ?? colorColor,
    z: Z,
    r: S ?? void 0,
    // treat null size as undefined for default constant radius
    tip: true
  };
  let transformImpl;
  let transformOptions = { [colorMode]: colorReduce ?? void 0, r: sizeReduce ?? void 0 };
  if (xReduce != null && yReduce != null) {
    throw new Error(`cannot reduce both x and y`);
  } else if (yReduce != null) {
    transformOptions.y = yReduce;
    transformImpl = isOrdinal(X) ? groupX : binX;
  } else if (xReduce != null) {
    transformOptions.x = xReduce;
    transformImpl = isOrdinal(Y) ? groupY : binY;
  } else if (colorReduce != null || sizeReduce != null) {
    if (X && Y) {
      transformImpl = isOrdinal(X) && isOrdinal(Y) ? group2 : isOrdinal(X) ? binY : isOrdinal(Y) ? binX : bin;
    } else if (X) {
      transformImpl = isOrdinal(X) ? groupX : binX;
    } else if (Y) {
      transformImpl = isOrdinal(Y) ? groupY : binY;
    }
  }
  if (transformImpl === bin || transformImpl === binX) markOptions2.x = { value: X, ...xOptions };
  if (transformImpl === bin || transformImpl === binY) markOptions2.y = { value: Y, ...yOptions };
  if (xZero === void 0)
    xZero = X && !(transformImpl === bin || transformImpl === binX) && (markImpl === barX || markImpl === areaX || markImpl === rectX || markImpl === ruleY);
  if (yZero === void 0)
    yZero = Y && !(transformImpl === bin || transformImpl === binY) && (markImpl === barY || markImpl === areaY || markImpl === rectY || markImpl === ruleX);
  return {
    fx: fx ?? null,
    fy: fy ?? null,
    x: {
      value: xValue ?? null,
      reduce: xReduce ?? null,
      zero: !!xZero,
      ...xOptions
    },
    y: {
      value: yValue ?? null,
      reduce: yReduce ?? null,
      zero: !!yZero,
      ...yOptions
    },
    color: {
      value: colorValue ?? null,
      reduce: colorReduce ?? null,
      ...colorColor !== void 0 && { color: colorColor }
    },
    size: {
      value: sizeValue ?? null,
      reduce: sizeReduce ?? null
    },
    mark,
    markImpl: implNames[markImpl],
    markOptions: markOptions2,
    transformImpl: implNames[transformImpl],
    transformOptions,
    colorMode
  };
}
function auto(data, options) {
  const spec = autoSpec(data, options);
  const {
    fx,
    fy,
    x: { zero: xZero },
    y: { zero: yZero },
    markOptions: markOptions2,
    transformOptions,
    colorMode
  } = spec;
  const markImpl = impls[spec.markImpl];
  const transformImpl = impls[spec.transformImpl];
  const frames = fx != null || fy != null ? frame({ strokeOpacity: 0.1 }) : null;
  const rules = [xZero ? ruleX([0]) : null, yZero ? ruleY([0]) : null];
  const mark = markImpl(data, transformImpl ? transformImpl(transformOptions, markOptions2) : markOptions2);
  return colorMode === "stroke" ? marks(frames, rules, mark) : marks(frames, mark, rules);
}
function isMonotonic(values2) {
  let previous;
  let previousOrder;
  for (const value2 of values2) {
    if (value2 == null) continue;
    if (previous === void 0) {
      previous = value2;
      continue;
    }
    const order = Math.sign(ascending(previous, value2));
    if (!order) continue;
    if (previousOrder !== void 0 && order !== previousOrder) return false;
    previous = value2;
    previousOrder = order;
  }
  return true;
}
function normalizeOptions({ x: x2, y: y2, color: color3, size, fx, fy, mark } = {}) {
  if (!isOptions(x2)) x2 = makeOptions(x2);
  if (!isOptions(y2)) y2 = makeOptions(y2);
  if (!isOptions(color3)) color3 = isColor(color3) ? { color: color3 } : makeOptions(color3);
  if (!isOptions(size)) size = makeOptions(size);
  if (isOptions(fx)) ({ value: fx } = makeOptions(fx));
  if (isOptions(fy)) ({ value: fy } = makeOptions(fy));
  if (mark != null) mark = `${mark}`.toLowerCase();
  return { x: x2, y: y2, color: color3, size, fx, fy, mark };
}
function materializeValue(data, options) {
  const V = valueof(data, options.value);
  if (V) V.label = labelof(options.value);
  return V;
}
function makeOptions(value2) {
  return isReducer(value2) ? { reduce: value2 } : { value: value2 };
}
function isZeroReducer(reduce) {
  return /^(?:distinct|count|sum|proportion)$/i.test(reduce);
}
function isSelectReducer(reduce) {
  return /^(?:first|last|mode)$/i.test(reduce);
}
function isReducer(reduce) {
  if (reduce == null) return false;
  if (typeof reduce.reduceIndex === "function") return true;
  if (typeof reduce.reduce === "function" && isObject(reduce)) return true;
  if (/^p\d{2}$/i.test(reduce)) return true;
  switch (`${reduce}`.toLowerCase()) {
    case "first":
    case "last":
    case "count":
    case "distinct":
    case "sum":
    case "proportion":
    case "proportion-facet":
    // TODO remove me?
    case "deviation":
    case "min":
    case "min-index":
    // TODO remove me?
    case "max":
    case "max-index":
    // TODO remove me?
    case "mean":
    case "median":
    case "variance":
    case "mode":
      return true;
  }
  return false;
}
function isHighCardinality(value2) {
  return value2 ? new InternSet(value2).size > value2.length >> 1 : false;
}
var impls = {
  dot,
  line: line2,
  lineX,
  lineY,
  areaX,
  areaY,
  ruleX,
  ruleY,
  barX,
  barY,
  rect,
  rectX,
  rectY,
  cell,
  bin,
  binX,
  binY,
  group: group2,
  groupX,
  groupY
};
var implNames = Object.fromEntries(Object.entries(impls).map(([name, impl]) => [impl, name]));
function mapX(mapper, options = {}) {
  let { x: x2, x1: x12, x2: x22 } = options;
  if (x2 === void 0 && x12 === void 0 && x22 === void 0) options = { ...options, x: x2 = identity$13 };
  const outputs = {};
  if (x2 != null) outputs.x = mapper;
  if (x12 != null) outputs.x1 = mapper;
  if (x22 != null) outputs.x2 = mapper;
  return map2(outputs, options);
}
function mapY(mapper, options = {}) {
  let { y: y2, y1: y12, y2: y22 } = options;
  if (y2 === void 0 && y12 === void 0 && y22 === void 0) options = { ...options, y: y2 = identity$13 };
  const outputs = {};
  if (y2 != null) outputs.y = mapper;
  if (y12 != null) outputs.y1 = mapper;
  if (y22 != null) outputs.y2 = mapper;
  return map2(outputs, options);
}
function map2(outputs = {}, options = {}) {
  const z = maybeZ(options);
  const channels = Object.entries(outputs).map(([key, map3]) => {
    const input = maybeInput(key, options);
    if (input == null) throw new Error(`missing channel: ${key}`);
    const [output, setOutput] = column(input);
    return { key, input, output, setOutput, map: maybeMap(map3) };
  });
  return {
    ...basic(options, (data, facets) => {
      const Z = valueof(data, z);
      const X = channels.map(({ input }) => valueof(data, input));
      const MX = channels.map(({ setOutput }) => setOutput(new Array(data.length)));
      for (const facet of facets) {
        for (const I of Z ? group(facet, (i) => Z[i]).values() : [facet]) {
          channels.forEach(({ map: map3 }, i) => map3.mapIndex(I, X[i], MX[i]));
        }
      }
      return { data, facets };
    }),
    ...Object.fromEntries(channels.map(({ key, output }) => [key, output]))
  };
}
function maybeMap(map3) {
  if (map3 == null) throw new Error("missing map");
  if (typeof map3.mapIndex === "function") return map3;
  if (typeof map3.map === "function" && isObject(map3)) return mapMap(map3);
  if (typeof map3 === "function") return mapFunction(taker(map3));
  switch (`${map3}`.toLowerCase()) {
    case "cumsum":
      return mapCumsum;
    case "rank":
      return mapFunction((I, V) => rank(I, (i) => V[i]));
    case "quantile":
      return mapFunction((I, V) => rankQuantile(I, (i) => V[i]));
  }
  throw new Error(`invalid map: ${map3}`);
}
function mapMap(map3) {
  console.warn("deprecated map interface; implement mapIndex instead.");
  return { mapIndex: map3.map.bind(map3) };
}
function rankQuantile(I, f) {
  const n = count(I, f) - 1;
  return rank(I, f).map((r) => r / n);
}
function mapFunction(f) {
  return {
    mapIndex(I, S, T) {
      const M2 = f(I, S);
      if (M2.length !== I.length) throw new Error("map function returned a mismatched length");
      for (let i = 0, n = I.length; i < n; ++i) T[I[i]] = M2[i];
    }
  };
}
var mapCumsum = {
  mapIndex(I, S, T) {
    let sum3 = 0;
    for (const i of I) T[i] = sum3 += S[i];
  }
};
function windowX(windowOptions = {}, options) {
  if (arguments.length === 1) options = windowOptions;
  return mapX(window$1(windowOptions), options);
}
function windowY(windowOptions = {}, options) {
  if (arguments.length === 1) options = windowOptions;
  return mapY(window$1(windowOptions), options);
}
function window$1(options = {}) {
  if (typeof options === "number") options = { k: options };
  let { k: k2, reduce, shift, anchor, strict } = options;
  if (anchor === void 0 && shift !== void 0) {
    anchor = maybeShift(shift);
    warn(`Warning: the shift option is deprecated; please use anchor "${anchor}" instead.`);
  }
  if (!((k2 = Math.floor(k2)) > 0)) throw new Error(`invalid k: ${k2}`);
  return maybeReduce(reduce)(k2, maybeAnchor$1(anchor, k2), strict);
}
function maybeAnchor$1(anchor = "middle", k2) {
  switch (`${anchor}`.toLowerCase()) {
    case "middle":
      return k2 - 1 >> 1;
    case "start":
      return 0;
    case "end":
      return k2 - 1;
  }
  throw new Error(`invalid anchor: ${anchor}`);
}
function maybeShift(shift) {
  switch (`${shift}`.toLowerCase()) {
    case "centered":
      return "middle";
    case "leading":
      return "start";
    case "trailing":
      return "end";
  }
  throw new Error(`invalid shift: ${shift}`);
}
function maybeReduce(reduce = "mean") {
  if (typeof reduce === "string") {
    if (/^p\d{2}$/i.test(reduce)) return reduceAccessor(percentile(reduce));
    switch (reduce.toLowerCase()) {
      case "deviation":
        return reduceAccessor(deviation);
      case "max":
        return reduceArray((I, V) => max(I, (i) => V[i]));
      case "mean":
        return reduceMean;
      case "median":
        return reduceAccessor(median);
      case "min":
        return reduceArray((I, V) => min(I, (i) => V[i]));
      case "mode":
        return reduceArray((I, V) => mode(I, (i) => V[i]));
      case "sum":
        return reduceSum;
      case "variance":
        return reduceAccessor(variance);
      case "difference":
        return reduceDifference;
      case "ratio":
        return reduceRatio;
      case "first":
        return reduceFirst;
      case "last":
        return reduceLast;
    }
  }
  if (typeof reduce !== "function") throw new Error(`invalid reduce: ${reduce}`);
  return reduceArray(taker(reduce));
}
function reduceAccessor(f) {
  return (k2, s2, strict) => strict ? {
    mapIndex(I, S, T) {
      const v = (i) => S[i] == null ? NaN : +S[i];
      let nans = 0;
      for (let i = 0; i < k2 - 1; ++i) if (isNaN(v(i))) ++nans;
      for (let i = 0, n = I.length - k2 + 1; i < n; ++i) {
        if (isNaN(v(i + k2 - 1))) ++nans;
        T[I[i + s2]] = nans === 0 ? f(subarray(I, i, i + k2), v) : NaN;
        if (isNaN(v(i))) --nans;
      }
    }
  } : {
    mapIndex(I, S, T) {
      const v = (i) => S[i] == null ? NaN : +S[i];
      for (let i = -s2; i < 0; ++i) {
        T[I[i + s2]] = f(subarray(I, 0, i + k2), v);
      }
      for (let i = 0, n = I.length - s2; i < n; ++i) {
        T[I[i + s2]] = f(subarray(I, i, i + k2), v);
      }
    }
  };
}
function reduceArray(f) {
  return (k2, s2, strict) => strict ? {
    mapIndex(I, S, T) {
      let count3 = 0;
      for (let i = 0; i < k2 - 1; ++i) count3 += defined(S[I[i]]);
      for (let i = 0, n = I.length - k2 + 1; i < n; ++i) {
        count3 += defined(S[I[i + k2 - 1]]);
        if (count3 === k2) T[I[i + s2]] = f(subarray(I, i, i + k2), S);
        count3 -= defined(S[I[i]]);
      }
    }
  } : {
    mapIndex(I, S, T) {
      for (let i = -s2; i < 0; ++i) {
        T[I[i + s2]] = f(subarray(I, 0, i + k2), S);
      }
      for (let i = 0, n = I.length - s2; i < n; ++i) {
        T[I[i + s2]] = f(subarray(I, i, i + k2), S);
      }
    }
  };
}
function reduceSum(k2, s2, strict) {
  return strict ? {
    mapIndex(I, S, T) {
      let nans = 0;
      let sum3 = 0;
      for (let i = 0; i < k2 - 1; ++i) {
        const v = S[I[i]];
        if (v === null || isNaN(v)) ++nans;
        else sum3 += +v;
      }
      for (let i = 0, n = I.length - k2 + 1; i < n; ++i) {
        const a2 = S[I[i]];
        const b = S[I[i + k2 - 1]];
        if (b === null || isNaN(b)) ++nans;
        else sum3 += +b;
        T[I[i + s2]] = nans === 0 ? sum3 : NaN;
        if (a2 === null || isNaN(a2)) --nans;
        else sum3 -= +a2;
      }
    }
  } : {
    mapIndex(I, S, T) {
      let sum3 = 0;
      const n = I.length;
      for (let i = 0, j = Math.min(n, k2 - s2 - 1); i < j; ++i) {
        sum3 += +S[I[i]] || 0;
      }
      for (let i = -s2, j = n - s2; i < j; ++i) {
        sum3 += +S[I[i + k2 - 1]] || 0;
        T[I[i + s2]] = sum3;
        sum3 -= +S[I[i]] || 0;
      }
    }
  };
}
function reduceMean(k2, s2, strict) {
  if (strict) {
    const sum3 = reduceSum(k2, s2, strict);
    return {
      mapIndex(I, S, T) {
        sum3.mapIndex(I, S, T);
        for (let i = 0, n = I.length - k2 + 1; i < n; ++i) {
          T[I[i + s2]] /= k2;
        }
      }
    };
  } else {
    return {
      mapIndex(I, S, T) {
        let sum3 = 0;
        let count3 = 0;
        const n = I.length;
        for (let i = 0, j = Math.min(n, k2 - s2 - 1); i < j; ++i) {
          let v = S[I[i]];
          if (v !== null && !isNaN(v = +v)) sum3 += v, ++count3;
        }
        for (let i = -s2, j = n - s2; i < j; ++i) {
          let a2 = S[I[i + k2 - 1]];
          let b = S[I[i]];
          if (a2 !== null && !isNaN(a2 = +a2)) sum3 += a2, ++count3;
          T[I[i + s2]] = sum3 / count3;
          if (b !== null && !isNaN(b = +b)) sum3 -= b, --count3;
        }
      }
    };
  }
}
function firstDefined(S, I, i, k2) {
  for (let j = i + k2; i < j; ++i) {
    const v = S[I[i]];
    if (defined(v)) return v;
  }
}
function lastDefined(S, I, i, k2) {
  for (let j = i + k2 - 1; j >= i; --j) {
    const v = S[I[j]];
    if (defined(v)) return v;
  }
}
function firstNumber(S, I, i, k2) {
  for (let j = i + k2; i < j; ++i) {
    let v = S[I[i]];
    if (v !== null && !isNaN(v = +v)) return v;
  }
}
function lastNumber(S, I, i, k2) {
  for (let j = i + k2 - 1; j >= i; --j) {
    let v = S[I[j]];
    if (v !== null && !isNaN(v = +v)) return v;
  }
}
function reduceDifference(k2, s2, strict) {
  return strict ? {
    mapIndex(I, S, T) {
      for (let i = 0, n = I.length - k2; i < n; ++i) {
        const a2 = S[I[i]];
        const b = S[I[i + k2 - 1]];
        T[I[i + s2]] = a2 === null || b === null ? NaN : b - a2;
      }
    }
  } : {
    mapIndex(I, S, T) {
      for (let i = -s2, n = I.length - k2 + s2 + 1; i < n; ++i) {
        T[I[i + s2]] = lastNumber(S, I, i, k2) - firstNumber(S, I, i, k2);
      }
    }
  };
}
function reduceRatio(k2, s2, strict) {
  return strict ? {
    mapIndex(I, S, T) {
      for (let i = 0, n = I.length - k2; i < n; ++i) {
        const a2 = S[I[i]];
        const b = S[I[i + k2 - 1]];
        T[I[i + s2]] = a2 === null || b === null ? NaN : b / a2;
      }
    }
  } : {
    mapIndex(I, S, T) {
      for (let i = -s2, n = I.length - k2 + s2 + 1; i < n; ++i) {
        T[I[i + s2]] = lastNumber(S, I, i, k2) / firstNumber(S, I, i, k2);
      }
    }
  };
}
function reduceFirst(k2, s2, strict) {
  return strict ? {
    mapIndex(I, S, T) {
      for (let i = 0, n = I.length - k2; i < n; ++i) {
        T[I[i + s2]] = S[I[i]];
      }
    }
  } : {
    mapIndex(I, S, T) {
      for (let i = -s2, n = I.length - k2 + s2 + 1; i < n; ++i) {
        T[I[i + s2]] = firstDefined(S, I, i, k2);
      }
    }
  };
}
function reduceLast(k2, s2, strict) {
  return strict ? {
    mapIndex(I, S, T) {
      for (let i = 0, n = I.length - k2; i < n; ++i) {
        T[I[i + s2]] = S[I[i + k2 - 1]];
      }
    }
  } : {
    mapIndex(I, S, T) {
      for (let i = -s2, n = I.length - k2 + s2 + 1; i < n; ++i) {
        T[I[i + s2]] = lastDefined(S, I, i, k2);
      }
    }
  };
}
var defaults$8 = {
  n: 20,
  k: 2,
  color: "currentColor",
  opacity: 0.2,
  strict: true,
  anchor: "end"
};
function bollingerX(data, {
  x: x2 = identity$13,
  y: y2,
  k: k2 = defaults$8.k,
  color: color3 = defaults$8.color,
  opacity: opacity2 = defaults$8.opacity,
  fill = color3,
  fillOpacity = opacity2,
  stroke = color3,
  strokeOpacity,
  strokeWidth,
  ...options
} = {}) {
  return marks(
    isNoneish(fill) ? null : areaX(
      data,
      map2(
        { x1: bollinger({ k: -k2, ...options }), x2: bollinger({ k: k2, ...options }) },
        { x1: x2, x2, y: y2, fill, fillOpacity, ...options }
      )
    ),
    isNoneish(stroke) ? null : lineX(data, map2({ x: bollinger(options) }, { x: x2, y: y2, stroke, strokeOpacity, strokeWidth, ...options }))
  );
}
function bollingerY(data, {
  x: x2,
  y: y2 = identity$13,
  k: k2 = defaults$8.k,
  color: color3 = defaults$8.color,
  opacity: opacity2 = defaults$8.opacity,
  fill = color3,
  fillOpacity = opacity2,
  stroke = color3,
  strokeOpacity,
  strokeWidth,
  ...options
} = {}) {
  return marks(
    isNoneish(fill) ? null : areaY(
      data,
      map2(
        { y1: bollinger({ k: -k2, ...options }), y2: bollinger({ k: k2, ...options }) },
        { x: x2, y1: y2, y2, fill, fillOpacity, ...options }
      )
    ),
    isNoneish(stroke) ? null : lineY(data, map2({ y: bollinger(options) }, { x: x2, y: y2, stroke, strokeOpacity, strokeWidth, ...options }))
  );
}
function bollinger({ n = defaults$8.n, k: k2 = 0, strict = defaults$8.strict, anchor = defaults$8.anchor } = {}) {
  return window$1({ k: n, reduce: (Y) => mean(Y) + k2 * (deviation(Y) || 0), strict, anchor });
}
var defaults$7 = {
  ariaLabel: "tick",
  fill: null,
  stroke: "currentColor"
};
var AbstractTick = class extends Mark {
  constructor(data, channels, options) {
    super(data, channels, options, defaults$7);
    markers(this, options);
  }
  render(index2, scales, channels, dimensions, context) {
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(this._transform, this, scales).call(
      (g) => g.selectAll().data(index2).enter().append("line").call(applyDirectStyles, this).attr("x1", this._x1(scales, channels, dimensions)).attr("x2", this._x2(scales, channels, dimensions)).attr("y1", this._y1(scales, channels, dimensions)).attr("y2", this._y2(scales, channels, dimensions)).call(applyChannelStyles, this, channels).call(applyMarkers, this, channels, context)
    ).node();
  }
};
var TickX = class extends AbstractTick {
  constructor(data, options = {}) {
    const { x: x2, y: y2, inset = 0, insetTop = inset, insetBottom = inset } = options;
    super(
      data,
      {
        x: { value: x2, scale: "x" },
        y: { value: y2, scale: "y", type: "band", optional: true }
      },
      options
    );
    this.insetTop = number$12(insetTop);
    this.insetBottom = number$12(insetBottom);
  }
  _transform(selection2, mark, { x: x2 }) {
    selection2.call(applyTransform, mark, { x: x2 }, offset, 0);
  }
  _x1(scales, { x: X }) {
    return (i) => X[i];
  }
  _x2(scales, { x: X }) {
    return (i) => X[i];
  }
  _y1({ y: y2 }, { y: Y }, { marginTop }) {
    const { insetTop } = this;
    return Y && y2 ? (i) => Y[i] + insetTop : marginTop + insetTop;
  }
  _y2({ y: y2 }, { y: Y }, { height, marginBottom }) {
    const { insetBottom } = this;
    return Y && y2 ? (i) => Y[i] + y2.bandwidth() - insetBottom : height - marginBottom - insetBottom;
  }
};
var TickY = class extends AbstractTick {
  constructor(data, options = {}) {
    const { x: x2, y: y2, inset = 0, insetRight = inset, insetLeft = inset } = options;
    super(
      data,
      {
        y: { value: y2, scale: "y" },
        x: { value: x2, scale: "x", type: "band", optional: true }
      },
      options
    );
    this.insetRight = number$12(insetRight);
    this.insetLeft = number$12(insetLeft);
  }
  _transform(selection2, mark, { y: y2 }) {
    selection2.call(applyTransform, mark, { y: y2 }, 0, offset);
  }
  _x1({ x: x2 }, { x: X }, { marginLeft }) {
    const { insetLeft } = this;
    return X && x2 ? (i) => X[i] + insetLeft : marginLeft + insetLeft;
  }
  _x2({ x: x2 }, { x: X }, { width, marginRight }) {
    const { insetRight } = this;
    return X && x2 ? (i) => X[i] + x2.bandwidth() - insetRight : width - marginRight - insetRight;
  }
  _y1(scales, { y: Y }) {
    return (i) => Y[i];
  }
  _y2(scales, { y: Y }) {
    return (i) => Y[i];
  }
};
function tickX(data, { x: x2 = identity$13, ...options } = {}) {
  return new TickX(data, { ...options, x: x2 });
}
function tickY(data, { y: y2 = identity$13, ...options } = {}) {
  return new TickY(data, { ...options, y: y2 });
}
function boxX(data, {
  x: x2 = identity$13,
  y: y2 = null,
  r,
  fill = "light-dark(#ccc, #555)",
  fillOpacity,
  stroke = "currentColor",
  strokeOpacity,
  strokeWidth = 2,
  sort: sort3,
  ...options
} = {}) {
  const group3 = y2 != null ? groupY : groupZ$1;
  return marks(
    ruleY(data, group3({ x1: loqr1, x2: hiqr2 }, { x: x2, y: y2, stroke, strokeOpacity, ...options })),
    barX(data, group3({ x1: "p25", x2: "p75" }, { x: x2, y: y2, fill, fillOpacity, ...options })),
    tickX(data, group3({ x: "p50" }, { x: x2, y: y2, stroke, strokeOpacity, strokeWidth, sort: sort3, ...options })),
    dot(data, map2({ x: oqr }, { x: x2, y: y2, z: y2, r, stroke, strokeOpacity, ...options }))
  );
}
function boxY(data, {
  y: y2 = identity$13,
  x: x2 = null,
  r,
  fill = "light-dark(#ccc, #555)",
  fillOpacity,
  stroke = "currentColor",
  strokeOpacity,
  strokeWidth = 2,
  sort: sort3,
  ...options
} = {}) {
  const group3 = x2 != null ? groupX : groupZ$1;
  return marks(
    ruleX(data, group3({ y1: loqr1, y2: hiqr2 }, { x: x2, y: y2, stroke, strokeOpacity, ...options })),
    barY(data, group3({ y1: "p25", y2: "p75" }, { x: x2, y: y2, fill, fillOpacity, ...options })),
    tickY(data, group3({ y: "p50" }, { x: x2, y: y2, stroke, strokeOpacity, strokeWidth, sort: sort3, ...options })),
    dot(data, map2({ y: oqr }, { x: x2, y: y2, z: x2, r, stroke, strokeOpacity, ...options }))
  );
}
function oqr(values2) {
  const r1 = loqr1(values2);
  const r2 = hiqr2(values2);
  return values2.map((v) => v < r1 || v > r2 ? v : NaN);
}
function loqr1(values2) {
  const lo = quartile1(values2) * 2.5 - quartile3(values2) * 1.5;
  return min(values2, (d) => d >= lo ? d : NaN);
}
function hiqr2(values2) {
  const hi = quartile3(values2) * 2.5 - quartile1(values2) * 1.5;
  return max(values2, (d) => d <= hi ? d : NaN);
}
function quartile1(values2) {
  return quantile(values2, 0.25);
}
function quartile3(values2) {
  return quantile(values2, 0.75);
}
var defaults$6 = {
  ariaLabel: "raster",
  stroke: null,
  pixelSize: 1
};
function number5(input, name) {
  const x2 = +input;
  if (isNaN(x2)) throw new Error(`invalid ${name}: ${input}`);
  return x2;
}
function integer(input, name) {
  const x2 = Math.floor(input);
  if (isNaN(x2)) throw new Error(`invalid ${name}: ${input}`);
  return x2;
}
var AbstractRaster = class extends Mark {
  constructor(data, channels, options = {}, defaults2) {
    let {
      width,
      height,
      x: x2,
      y: y2,
      x1: x12 = x2 == null ? 0 : void 0,
      y1: y12 = y2 == null ? 0 : void 0,
      x2: x22 = x2 == null ? width : void 0,
      y2: y22 = y2 == null ? height : void 0,
      colorSpace = "srgb",
      pixelSize = defaults2.pixelSize,
      blur = 0,
      interpolate
    } = options;
    if (width != null) width = integer(width, "width");
    if (height != null) height = integer(height, "height");
    if (x12 != null) x12 = number5(x12, "x1");
    if (y12 != null) y12 = number5(y12, "y1");
    if (x22 != null) x22 = number5(x22, "x2");
    if (y22 != null) y22 = number5(y22, "y2");
    if (x2 == null && (x12 == null || x22 == null)) throw new Error("missing x");
    if (y2 == null && (y12 == null || y22 == null)) throw new Error("missing y");
    if (data != null && width != null && height != null) {
      if (x2 === void 0 && x12 != null && x22 != null) x2 = denseX(x12, x22, width);
      if (y2 === void 0 && y12 != null && y22 != null) y2 = denseY(y12, y22, width, height);
    }
    super(
      data,
      {
        x: { value: x2, scale: "x", optional: true },
        y: { value: y2, scale: "y", optional: true },
        x1: { value: x12 == null ? null : [x12], scale: "x", optional: true, filter: null },
        y1: { value: y12 == null ? null : [y12], scale: "y", optional: true, filter: null },
        x2: { value: x22 == null ? null : [x22], scale: "x", optional: true, filter: null },
        y2: { value: y22 == null ? null : [y22], scale: "y", optional: true, filter: null },
        ...channels
      },
      options,
      defaults2
    );
    this.width = width;
    this.height = height;
    this.pixelSize = number5(pixelSize, "pixelSize");
    this.blur = number5(blur, "blur");
    this.interpolate = x2 == null || y2 == null ? null : maybeInterpolate(interpolate);
    this.colorSpace = String(colorSpace).toLowerCase();
  }
};
var Raster = class extends AbstractRaster {
  constructor(data, options = {}) {
    const { imageRendering } = options;
    if (data == null) {
      const { fill, fillOpacity } = options;
      if (maybeNumberChannel(fillOpacity)[0] !== void 0) options = sampler("fillOpacity", options);
      if (maybeColorChannel(fill)[0] !== void 0) options = sampler("fill", options);
    }
    super(data, void 0, options, defaults$6);
    this.imageRendering = impliedString(imageRendering, "auto");
  }
  // Ignore the color scale, so the fill channel is returned unscaled.
  scale(channels, { color: color3, ...scales }, context) {
    return super.scale(channels, scales, context);
  }
  render(index2, scales, values2, dimensions, context) {
    const color3 = scales[values2.channels.fill?.scale] ?? ((x3) => x3);
    const { x: X, y: Y } = values2;
    const { document: document2 } = context;
    const [x12, y12, x2, y2] = renderBounds(values2, dimensions, context);
    const dx = x2 - x12;
    const dy = y2 - y12;
    const { pixelSize: k2, width: w = Math.round(Math.abs(dx) / k2), height: h = Math.round(Math.abs(dy) / k2) } = this;
    const n = w * h;
    let { fill: F, fillOpacity: FO } = values2;
    let offset2 = 0;
    if (this.interpolate) {
      const kx2 = w / dx;
      const ky2 = h / dy;
      const IX = map$1(X, (x3) => (x3 - x12) * kx2, Float64Array);
      const IY = map$1(Y, (y3) => (y3 - y12) * ky2, Float64Array);
      if (F) F = this.interpolate(index2, w, h, IX, IY, F);
      if (FO) FO = this.interpolate(index2, w, h, IX, IY, FO);
    } else if (this.data == null && index2) offset2 = index2.fi * n;
    const colorConverter = this.colorConverter ??= getColorConverter(this.colorSpace, context);
    const canvas = document2.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const context2d = canvas.getContext("2d", { colorSpace: this.colorSpace });
    const image2 = context2d.createImageData(w, h);
    const imageData = image2.data;
    let rgba2 = colorConverter(this.fill ?? "black");
    let a2 = this.fillOpacity ?? 1;
    for (let i = 0; i < n; ++i) {
      const j = i << 2;
      if (F) rgba2 = colorConverter(color3(F[i + offset2]));
      if (FO) a2 = FO[i + offset2];
      imageData[j + 0] = rgba2[0];
      imageData[j + 1] = rgba2[1];
      imageData[j + 2] = rgba2[2];
      imageData[j + 3] = rgba2[3] * a2;
    }
    if (this.blur > 0) blurImage(image2, this.blur);
    context2d.putImageData(image2, 0, 0);
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, scales).call(
      (g) => g.append("image").attr("transform", `translate(${x12},${y12}) scale(${Math.sign(x2 - x12)},${Math.sign(y2 - y12)})`).attr("width", Math.abs(dx)).attr("height", Math.abs(dy)).attr("preserveAspectRatio", "none").call(applyAttr, "image-rendering", this.imageRendering).call(applyDirectStyles, this).attr("xlink:href", canvas.toDataURL())
    ).node();
  }
};
function maybeTuples(k2, data, options) {
  if (arguments.length < 3) options = data, data = null;
  let { x: x2, y: y2, [k2]: z, ...rest } = options;
  if (x2 === void 0 && y2 === void 0 && isTuples(data)) {
    x2 = first, y2 = second2;
    if (z === void 0) z = third;
  }
  return [data, { ...rest, x: x2, y: y2, [k2]: z }];
}
function raster() {
  const [data, options] = maybeTuples("fill", ...arguments);
  return new Raster(
    data,
    data == null || options.fill !== void 0 || options.fillOpacity !== void 0 ? options : { ...options, fill: identity$13 }
  );
}
function renderBounds({ x1: x12, y1: y12, x2, y2 }, dimensions, { projection: projection3 }) {
  const { width, height, marginTop, marginRight, marginBottom, marginLeft } = dimensions;
  return [
    x12 && projection3 == null ? x12[0] : marginLeft,
    y12 && projection3 == null ? y12[0] : marginTop,
    x2 && projection3 == null ? x2[0] : width - marginRight,
    y2 && projection3 == null ? y2[0] : height - marginBottom
  ];
}
function rasterBounds({ x1: x12, y1: y12, x2, y2 }, scales, dimensions, context) {
  const channels = {};
  if (x12) channels.x1 = x12;
  if (y12) channels.y1 = y12;
  if (x2) channels.x2 = x2;
  if (y2) channels.y2 = y2;
  return renderBounds(valueObject(channels, scales), dimensions, context);
}
function sampler(name, options = {}) {
  const { [name]: value2 } = options;
  if (typeof value2 !== "function") throw new Error(`invalid ${name}: not a function`);
  return initializer({ ...options, [name]: void 0 }, function(data, facets, channels, scales, dimensions, context) {
    const { x: x2, y: y2 } = scales;
    if (!x2) throw new Error("missing scale: x");
    if (!y2) throw new Error("missing scale: y");
    const [x12, y12, x22, y22] = rasterBounds(channels, scales, dimensions, context);
    const dx = x22 - x12;
    const dy = y22 - y12;
    const { pixelSize: k2 } = this;
    const { width: w = Math.round(Math.abs(dx) / k2), height: h = Math.round(Math.abs(dy) / k2) } = options;
    const V = new Array(w * h * (facets ? facets.length : 1));
    const kx2 = dx / w;
    const ky2 = dy / h;
    let i = 0;
    for (const facet of facets ?? [void 0]) {
      for (let yi = 0.5; yi < h; ++yi) {
        for (let xi = 0.5; xi < w; ++xi, ++i) {
          V[i] = value2(x2.invert(x12 + xi * kx2), y2.invert(y12 + yi * ky2), facet);
        }
      }
    }
    return { data: V, facets, channels: { [name]: { value: V, scale: "auto" } } };
  });
}
function maybeInterpolate(interpolate) {
  if (typeof interpolate === "function") return interpolate;
  if (interpolate == null) return interpolateNone;
  switch (`${interpolate}`.toLowerCase()) {
    case "none":
      return interpolateNone;
    case "nearest":
      return interpolateNearest;
    case "barycentric":
      return interpolatorBarycentric();
    case "random-walk":
      return interpolatorRandomWalk();
  }
  throw new Error(`invalid interpolate: ${interpolate}`);
}
function interpolateNone(index2, width, height, X, Y, V) {
  const W = new Array(width * height);
  for (const i of index2) {
    if (X[i] < 0 || X[i] >= width || Y[i] < 0 || Y[i] >= height) continue;
    W[Math.floor(Y[i]) * width + Math.floor(X[i])] = V[i];
  }
  return W;
}
function interpolatorBarycentric({ random = lcg(42) } = {}) {
  return (index2, width, height, X, Y, V) => {
    const { points, triangles, hull: hull2 } = Delaunay.from(
      index2,
      (i) => X[i],
      (i) => Y[i]
    );
    const W = new V.constructor(width * height).fill(NaN);
    const S = new Uint8Array(width * height);
    const mix = mixer(V, random);
    for (let i = 0; i < triangles.length; i += 3) {
      const ta = triangles[i];
      const tb = triangles[i + 1];
      const tc = triangles[i + 2];
      const Ax = points[2 * ta];
      const Bx = points[2 * tb];
      const Cx = points[2 * tc];
      const Ay = points[2 * ta + 1];
      const By = points[2 * tb + 1];
      const Cy = points[2 * tc + 1];
      const x12 = Math.min(Ax, Bx, Cx);
      const x2 = Math.max(Ax, Bx, Cx);
      const y12 = Math.min(Ay, By, Cy);
      const y2 = Math.max(Ay, By, Cy);
      const z = (By - Cy) * (Ax - Cx) + (Ay - Cy) * (Cx - Bx);
      if (!z) continue;
      const va = V[index2[ta]];
      const vb = V[index2[tb]];
      const vc = V[index2[tc]];
      for (let x3 = Math.floor(x12); x3 < x2; ++x3) {
        for (let y3 = Math.floor(y12); y3 < y2; ++y3) {
          if (x3 < 0 || x3 >= width || y3 < 0 || y3 >= height) continue;
          const xp = x3 + 0.5;
          const yp = y3 + 0.5;
          const s2 = Math.sign(z);
          const ga = (By - Cy) * (xp - Cx) + (yp - Cy) * (Cx - Bx);
          if (ga * s2 < 0) continue;
          const gb = (Cy - Ay) * (xp - Cx) + (yp - Cy) * (Ax - Cx);
          if (gb * s2 < 0) continue;
          const gc = z - (ga + gb);
          if (gc * s2 < 0) continue;
          const i2 = x3 + width * y3;
          W[i2] = mix(va, ga / z, vb, gb / z, vc, gc / z, x3, y3);
          S[i2] = 1;
        }
      }
    }
    extrapolateBarycentric(W, S, X, Y, V, width, height, hull2, index2, mix);
    return W;
  };
}
function extrapolateBarycentric(W, S, X, Y, V, width, height, hull2, index2, mix) {
  X = Float64Array.from(hull2, (i) => X[index2[i]]);
  Y = Float64Array.from(hull2, (i) => Y[index2[i]]);
  V = Array.from(hull2, (i) => V[index2[i]]);
  const n = X.length;
  const rays = Array.from({ length: n }, (_, j) => ray(j, X, Y));
  let k2 = 0;
  for (let y2 = 0; y2 < height; ++y2) {
    const yp = y2 + 0.5;
    for (let x2 = 0; x2 < width; ++x2) {
      const i = x2 + width * y2;
      if (!S[i]) {
        const xp = x2 + 0.5;
        for (let l = 0; l < n; ++l) {
          const j = (n + k2 + (l % 2 ? (l + 1) / 2 : -l / 2)) % n;
          if (rays[j](xp, yp)) {
            const t = segmentProject(X.at(j - 1), Y.at(j - 1), X[j], Y[j], xp, yp);
            W[i] = mix(V.at(j - 1), t, V[j], 1 - t, V[j], 0, x2, y2);
            k2 = j;
            break;
          }
        }
      }
    }
  }
}
function segmentProject(x12, y12, x2, y2, x3, y3) {
  const dx = x2 - x12;
  const dy = y2 - y12;
  const a2 = dx * (x2 - x3) + dy * (y2 - y3);
  const b = dx * (x3 - x12) + dy * (y3 - y12);
  return a2 > 0 && b > 0 ? a2 / (a2 + b) : +(a2 > b);
}
function cross3(xa, ya, xb, yb) {
  return xa * yb - xb * ya;
}
function ray(j, X, Y) {
  const n = X.length;
  const xc = X.at(j - 2);
  const yc = Y.at(j - 2);
  const xa = X.at(j - 1);
  const ya = Y.at(j - 1);
  const xb = X[j];
  const yb = Y[j];
  const xd = X.at(j + 1 - n);
  const yd = Y.at(j + 1 - n);
  const dxab = xa - xb;
  const dyab = ya - yb;
  const dxca = xc - xa;
  const dyca = yc - ya;
  const dxbd = xb - xd;
  const dybd = yb - yd;
  const hab = Math.hypot(dxab, dyab);
  const hca = Math.hypot(dxca, dyca);
  const hbd = Math.hypot(dxbd, dybd);
  return (x2, y2) => {
    const dxa = x2 - xa;
    const dya = y2 - ya;
    const dxb = x2 - xb;
    const dyb = y2 - yb;
    return cross3(dxa, dya, dxb, dyb) > -1e-6 && cross3(dxa, dya, dxab, dyab) * hca - cross3(dxa, dya, dxca, dyca) * hab > -1e-6 && cross3(dxb, dyb, dxbd, dybd) * hab - cross3(dxb, dyb, dxab, dyab) * hbd <= 0;
  };
}
function interpolateNearest(index2, width, height, X, Y, V) {
  const W = new V.constructor(width * height);
  const delaunay = Delaunay.from(
    index2,
    (i) => X[i],
    (i) => Y[i]
  );
  let iy, ix;
  for (let y2 = 0.5, k2 = 0; y2 < height; ++y2) {
    ix = iy;
    for (let x2 = 0.5; x2 < width; ++x2, ++k2) {
      ix = delaunay.find(x2, y2, ix);
      if (x2 === 0.5) iy = ix;
      W[k2] = V[index2[ix]];
    }
  }
  return W;
}
function interpolatorRandomWalk({ random = lcg(42), minDistance = 0.5, maxSteps = 2 } = {}) {
  return (index2, width, height, X, Y, V) => {
    const W = new V.constructor(width * height);
    const delaunay = Delaunay.from(
      index2,
      (i) => X[i],
      (i) => Y[i]
    );
    let iy, ix, iw;
    for (let y2 = 0.5, k2 = 0; y2 < height; ++y2) {
      ix = iy;
      for (let x2 = 0.5; x2 < width; ++x2, ++k2) {
        let cx = x2;
        let cy = y2;
        iw = ix = delaunay.find(cx, cy, ix);
        if (x2 === 0.5) iy = ix;
        let distance;
        let step2 = 0;
        while ((distance = Math.hypot(X[index2[iw]] - cx, Y[index2[iw]] - cy)) > minDistance && step2 < maxSteps) {
          const angle = random(x2, y2, step2) * 2 * Math.PI;
          cx += Math.cos(angle) * distance;
          cy += Math.sin(angle) * distance;
          iw = delaunay.find(cx, cy, iw);
          ++step2;
        }
        W[k2] = V[index2[iw]];
      }
    }
    return W;
  };
}
function blend(a2, ca, b, cb, c3, cc) {
  return ca * a2 + cb * b + cc * c3;
}
function pick(random) {
  return (a2, ca, b, cb, c3, cc, x2, y2) => {
    const u2 = random(x2, y2);
    return u2 < ca ? a2 : u2 < ca + cb ? b : c3;
  };
}
function mixer(F, random) {
  return isNumeric(F) || isTemporal(F) ? blend : pick(random);
}
function denseX(x12, x2, width) {
  return {
    transform(data) {
      const n = data.length;
      const X = new Float64Array(n);
      const kx2 = (x2 - x12) / width;
      const x02 = x12 + kx2 / 2;
      for (let i = 0; i < n; ++i) X[i] = i % width * kx2 + x02;
      return X;
    }
  };
}
function denseY(y12, y2, width, height) {
  return {
    transform(data) {
      const n = data.length;
      const Y = new Float64Array(n);
      const ky2 = (y2 - y12) / height;
      const y02 = y12 + ky2 / 2;
      for (let i = 0; i < n; ++i) Y[i] = Math.floor(i / width) % height * ky2 + y02;
      return Y;
    }
  };
}
var transparent = new Uint8ClampedArray(4);
function getColorConverter(colorSpace, { document: document2 }) {
  const cache = /* @__PURE__ */ new Map();
  const canvas = document2.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { colorSpace, willReadFrequently: true });
  return (color3) => {
    if (color3 == null) return transparent;
    let data = cache.get(color3);
    if (data !== void 0) return data;
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = color3;
    context.fillRect(0, 0, 1, 1);
    data = context.getImageData(0, 0, 1, 1).data;
    cache.set(color3, data);
    return data;
  };
}
var defaults$5 = {
  ariaLabel: "contour",
  fill: "none",
  stroke: "currentColor",
  strokeMiterlimit: 1,
  pixelSize: 2
};
var Contour = class extends AbstractRaster {
  constructor(data, { smooth = true, value: value2, ...options } = {}) {
    const channels = styles({}, options, defaults$5);
    if (value2 === void 0) {
      for (const key in channels) {
        if (channels[key].value != null) {
          if (value2 !== void 0) throw new Error("ambiguous contour value");
          value2 = options[key];
          options[key] = "value";
        }
      }
    }
    if (value2 != null) {
      const v = { transform: (D3) => D3.map((d) => d.value), label: labelof(value2) };
      for (const key in channels) {
        if (options[key] === "value") {
          options[key] = v;
        }
      }
    }
    if (data == null) {
      if (value2 == null) throw new Error("missing contour value");
      options = sampler("value", { value: value2, ...options });
      value2 = null;
    } else {
      let { interpolate } = options;
      if (value2 === void 0) value2 = identity$13;
      if (interpolate === void 0) options.interpolate = "nearest";
    }
    super(data, { value: { value: value2, optional: true } }, contourGeometry(options), defaults$5);
    const contourChannels = { geometry: { value: identity$13 } };
    for (const key in this.channels) {
      const channel = this.channels[key];
      const { scale: scale2 } = channel;
      if (scale2 === "x" || scale2 === "y" || key === "value") continue;
      contourChannels[key] = channel;
      delete this.channels[key];
    }
    this.contourChannels = contourChannels;
    this.smooth = !!smooth;
  }
  filter(index2, { x: x2, y: y2, value: value2, ...channels }, values2) {
    return super.filter(index2, channels, values2);
  }
  render(index2, scales, channels, dimensions, context) {
    const { geometry: G } = channels;
    const path2 = index();
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, scales).call((g) => {
      g.selectAll().data(index2).enter().append("path").call(applyDirectStyles, this).attr("d", (i) => path2(G[i])).call(applyChannelStyles, this, channels);
    }).node();
  }
};
function contourGeometry({ thresholds, interval, ...options }) {
  thresholds = maybeThresholds(thresholds, interval, thresholdSturges);
  return initializer(options, function(data, facets, channels, scales, dimensions, context) {
    const [x12, y12, x2, y2] = rasterBounds(channels, scales, dimensions, context);
    const dx = x2 - x12;
    const dy = y2 - y12;
    const { pixelSize: k2, width: w = Math.round(Math.abs(dx) / k2), height: h = Math.round(Math.abs(dy) / k2) } = this;
    const kx2 = w / dx;
    const ky2 = h / dy;
    const V = channels.value.value;
    const VV = [];
    if (this.interpolate) {
      const { x: X, y: Y } = applyPosition(channels, scales, context);
      const IX = map$1(X, (x3) => (x3 - x12) * kx2, Float64Array);
      const IY = map$1(Y, (y3) => (y3 - y12) * ky2, Float64Array);
      const ichannels = [channels.x, channels.y, channels.value];
      const ivalues = [IX, IY, V];
      for (const facet of facets) {
        const index2 = this.filter(facet, ichannels, ivalues);
        VV.push(this.interpolate(index2, w, h, IX, IY, V));
      }
    } else if (facets) {
      const n = w * h;
      const m = facets.length;
      for (let i = 0; i < m; ++i) VV.push(V.slice(i * n, i * n + n));
    } else {
      VV.push(V);
    }
    if (this.blur > 0) for (const V2 of VV) blur2({ data: V2, width: w, height: h }, this.blur);
    const T = maybeTicks(thresholds, V, ...finiteExtent(VV));
    if (T === null) throw new Error(`unsupported thresholds: ${thresholds}`);
    const { contour: contour2 } = Contours().size([w, h]).smooth(this.smooth);
    const contourData = [];
    const contourFacets = [];
    for (const V2 of VV) {
      contourFacets.push(range(contourData.length, contourData.push(...map$1(T, (t) => contour2(V2, t)))));
    }
    for (const { coordinates } of contourData) {
      for (const rings of coordinates) {
        for (const ring of rings) {
          for (const point3 of ring) {
            point3[0] = point3[0] / kx2 + x12;
            point3[1] = point3[1] / ky2 + y12;
          }
        }
      }
    }
    return {
      data: contourData,
      facets: contourFacets,
      channels: createChannels(this.contourChannels, contourData)
    };
  });
}
function maybeTicks(thresholds, V, min3, max2) {
  if (typeof thresholds?.range === "function") return thresholds.range(thresholds.floor(min3), max2);
  if (typeof thresholds === "function") thresholds = thresholds(V, min3, max2);
  if (typeof thresholds !== "number") return arrayify2(thresholds);
  const tz = ticks(...nice(min3, max2, thresholds), thresholds);
  while (tz[tz.length - 1] >= max2) tz.pop();
  while (tz[1] < min3) tz.shift();
  return tz;
}
function contour() {
  return new Contour(...maybeTuples("value", ...arguments));
}
function finiteExtent(VV) {
  return [min(VV, (V) => min(V, finite2)), max(VV, (V) => max(V, finite2))];
}
function finite2(x2) {
  return isFinite(x2) ? x2 : NaN;
}
function crosshair(data, options) {
  return crosshairK(pointer2, data, options);
}
function crosshairX(data, options = {}) {
  return crosshairK(pointerX, data, options);
}
function crosshairY(data, options = {}) {
  return crosshairK(pointerY, data, options);
}
function crosshairK(pointer3, data, options = {}) {
  const { x: x2, y: y2, maxRadius } = options;
  const p = pointer3({ px: x2, py: y2, maxRadius });
  const M2 = [];
  if (x2 != null) M2.push(ruleX(data, ruleOptions("x", { ...p, inset: -6 }, options)));
  if (y2 != null) M2.push(ruleY(data, ruleOptions("y", { ...p, inset: -6 }, options)));
  if (x2 != null) M2.push(text(data, textOptions("x", { ...p, dy: 9, frameAnchor: "bottom", lineAnchor: "top" }, options)));
  if (y2 != null) M2.push(text(data, textOptions("y", { ...p, dx: -9, frameAnchor: "left", textAnchor: "end" }, options)));
  for (const m of M2) m.ariaLabel = `crosshair ${m.ariaLabel}`;
  return marks(...M2);
}
function markOptions(k2, { channels: pointerChannels, ...pointerOptions }, { facet, facetAnchor, fx, fy, [k2]: p, channels, transform: transform2, initializer: initializer2 }) {
  return {
    ...pointerOptions,
    facet,
    facetAnchor,
    fx,
    fy,
    [k2]: p,
    channels: { ...pointerChannels, ...channels },
    transform: transform2,
    initializer: pxpy(k2, initializer2)
  };
}
function pxpy(k2, i) {
  if (i == null) return i;
  return function(data, facets, { x: x12, y: y12, px, py, ...c1 }, ...args) {
    const { channels: { x: x2, y: y2, ...c3 } = {}, ...rest } = i.call(this, data, facets, { ...c1, x: px, y: py }, ...args);
    return {
      channels: {
        ...c3,
        ...x2 && { px: x2, ...k2 === "x" && { x: x2 } },
        ...y2 && { py: y2, ...k2 === "y" && { y: y2 } }
      },
      ...rest
    };
  };
}
function ruleOptions(k2, pointerOptions, options) {
  const {
    color: color3 = "currentColor",
    opacity: opacity2 = 0.2,
    ruleStroke: stroke = color3,
    ruleStrokeOpacity: strokeOpacity = opacity2,
    ruleStrokeWidth: strokeWidth
  } = options;
  return {
    ...markOptions(k2, pointerOptions, options),
    stroke,
    strokeOpacity,
    strokeWidth
  };
}
function textOptions(k2, pointerOptions, options) {
  const {
    color: color3 = "currentColor",
    textFill: fill = color3,
    textFillOpacity: fillOpacity,
    textStroke: stroke = "var(--plot-background)",
    textStrokeOpacity: strokeOpacity,
    textStrokeWidth: strokeWidth = 5
  } = options;
  return {
    ...markOptions(k2, pointerOptions, textChannel(k2, options)),
    fill,
    fillOpacity,
    stroke,
    strokeOpacity,
    strokeWidth
  };
}
function textChannel(source, options) {
  return initializer(options, (data, facets, channels) => {
    return { channels: { text: { value: getSource(channels, source)?.value } } };
  });
}
var delaunayLinkDefaults = {
  ariaLabel: "delaunay link",
  fill: "none",
  stroke: "currentColor",
  strokeMiterlimit: 1
};
var delaunayMeshDefaults = {
  ariaLabel: "delaunay mesh",
  fill: null,
  stroke: "currentColor",
  strokeOpacity: 0.2
};
var hullDefaults = {
  ariaLabel: "hull",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeMiterlimit: 1
};
var voronoiDefaults = {
  ariaLabel: "voronoi",
  fill: "none",
  stroke: "currentColor",
  strokeMiterlimit: 1
};
var voronoiMeshDefaults = {
  ariaLabel: "voronoi mesh",
  fill: null,
  stroke: "currentColor",
  strokeOpacity: 0.2
};
var DelaunayLink = class extends Mark {
  constructor(data, options = {}) {
    const { x: x2, y: y2, z, curve, tension } = options;
    super(
      data,
      {
        x: { value: x2, scale: "x", optional: true },
        y: { value: y2, scale: "y", optional: true },
        z: { value: z, optional: true }
      },
      options,
      delaunayLinkDefaults
    );
    this.curve = maybeCurve(curve, tension);
    markers(this, options);
  }
  render(index2, scales, channels, dimensions, context) {
    const { x: x2, y: y2 } = scales;
    const { x: X, y: Y, z: Z } = channels;
    const { curve } = this;
    const [cx, cy] = applyFrameAnchor(this, dimensions);
    const xi = X ? (i) => X[i] : constant5(cx);
    const yi = Y ? (i) => Y[i] : constant5(cy);
    const mark = this;
    function links(index3) {
      let i = -1;
      const newIndex = [];
      const newChannels = {};
      for (const k2 in channels) newChannels[k2] = [];
      const X12 = [];
      const X22 = [];
      const Y12 = [];
      const Y22 = [];
      function link3(ti, tj) {
        ti = index3[ti];
        tj = index3[tj];
        newIndex.push(++i);
        X12[i] = xi(ti);
        Y12[i] = yi(ti);
        X22[i] = xi(tj);
        Y22[i] = yi(tj);
        for (const k2 in channels) newChannels[k2].push(channels[k2][tj]);
      }
      const { halfedges, hull: hull2, triangles } = Delaunay.from(index3, xi, yi);
      for (let i2 = 0; i2 < halfedges.length; ++i2) {
        const j = halfedges[i2];
        if (j > i2) link3(triangles[i2], triangles[j]);
      }
      for (let i2 = 0; i2 < hull2.length; ++i2) {
        link3(hull2[i2], hull2[(i2 + 1) % hull2.length]);
      }
      select(this).selectAll().data(newIndex).enter().append("path").call(applyDirectStyles, mark).attr("d", (i2) => {
        const p = pathRound();
        const c3 = curve(p);
        c3.lineStart();
        c3.point(X12[i2], Y12[i2]);
        c3.point(X22[i2], Y22[i2]);
        c3.lineEnd();
        return p;
      }).call(applyChannelStyles, mark, newChannels).call(applyMarkers, mark, newChannels, context);
    }
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, { x: X && x2, y: Y && y2 }).call(
      Z ? (g) => g.selectAll().data(group(index2, (i) => Z[i]).values()).enter().append("g").each(links) : (g) => g.datum(index2).each(links)
    ).node();
  }
};
var AbstractDelaunayMark = class extends Mark {
  constructor(data, options = {}, defaults2, zof = ({ z }) => z) {
    const { x: x2, y: y2 } = options;
    super(
      data,
      {
        x: { value: x2, scale: "x", optional: true },
        y: { value: y2, scale: "y", optional: true },
        z: { value: zof(options), optional: true }
      },
      options,
      defaults2
    );
  }
  render(index2, scales, channels, dimensions, context) {
    const { x: x2, y: y2 } = scales;
    const { x: X, y: Y, z: Z } = channels;
    const [cx, cy] = applyFrameAnchor(this, dimensions);
    const xi = X ? (i) => X[i] : constant5(cx);
    const yi = Y ? (i) => Y[i] : constant5(cy);
    const mark = this;
    function mesh(index3) {
      const delaunay = Delaunay.from(index3, xi, yi);
      select(this).append("path").datum(index3[0]).call(applyDirectStyles, mark).attr("d", mark._render(delaunay, dimensions)).call(applyChannelStyles, mark, channels);
    }
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, { x: X && x2, y: Y && y2 }).call(
      Z ? (g) => g.selectAll().data(group(index2, (i) => Z[i]).values()).enter().append("g").each(mesh) : (g) => g.datum(index2).each(mesh)
    ).node();
  }
};
var DelaunayMesh = class extends AbstractDelaunayMark {
  constructor(data, options = {}) {
    super(data, options, delaunayMeshDefaults);
    this.fill = "none";
  }
  _render(delaunay) {
    return delaunay.render();
  }
};
var Hull = class extends AbstractDelaunayMark {
  constructor(data, options = {}) {
    super(data, options, hullDefaults, maybeZ);
  }
  _render(delaunay) {
    return delaunay.renderHull();
  }
};
var Voronoi2 = class extends Mark {
  constructor(data, options = {}) {
    const { x: x2, y: y2, z } = options;
    super(
      data,
      {
        x: { value: x2, scale: "x", optional: true },
        y: { value: y2, scale: "y", optional: true },
        z: { value: z, optional: true }
      },
      initializer(options, function(data2, facets, channels, scales, dimensions, context) {
        let { x: X, y: Y, z: Z } = channels;
        ({ x: X, y: Y } = applyPosition(channels, scales, context));
        Z = Z?.value;
        const C3 = new Array((X ?? Y).length).fill(null);
        const [cx, cy] = applyFrameAnchor(this, dimensions);
        const xi = X ? (i) => X[i] : constant5(cx);
        const yi = Y ? (i) => Y[i] : constant5(cy);
        for (let I of facets) {
          if (X) I = I.filter((i) => defined(xi(i)));
          if (Y) I = I.filter((i) => defined(yi(i)));
          for (const [, J] of maybeGroup(I, Z)) {
            const delaunay = Delaunay.from(J, xi, yi);
            const voronoi2 = voronoiof(delaunay, dimensions);
            for (let i = 0, n = J.length; i < n; ++i) {
              C3[J[i]] = voronoi2.renderCell(i);
            }
          }
        }
        return { data: data2, facets, channels: { cells: { value: C3 } } };
      }),
      voronoiDefaults
    );
  }
  render(index2, scales, channels, dimensions, context) {
    const { x: x2, y: y2 } = scales;
    const { x: X, y: Y, cells: C3 } = channels;
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, { x: X && x2, y: Y && y2 }).call((g) => {
      g.selectAll().data(index2).enter().append("path").call(applyDirectStyles, this).attr("d", (i) => C3[i]).call(applyChannelStyles, this, channels);
    }).node();
  }
};
var VoronoiMesh = class extends AbstractDelaunayMark {
  constructor(data, options) {
    super(data, options, voronoiMeshDefaults);
    this.fill = "none";
  }
  _render(delaunay, dimensions) {
    return voronoiof(delaunay, dimensions).render();
  }
};
function voronoiof(delaunay, dimensions) {
  const { width, height, marginTop, marginRight, marginBottom, marginLeft } = dimensions;
  return delaunay.voronoi([marginLeft, marginTop, width - marginRight, height - marginBottom]);
}
function delaunayMark(DelaunayMark, data, { x: x2, y: y2, ...options } = {}) {
  [x2, y2] = maybeTuple(x2, y2);
  return new DelaunayMark(data, { ...options, x: x2, y: y2 });
}
function delaunayLink(data, options) {
  return delaunayMark(DelaunayLink, data, options);
}
function delaunayMesh(data, options) {
  return delaunayMark(DelaunayMesh, data, options);
}
function hull(data, options) {
  return delaunayMark(Hull, data, options);
}
function voronoi(data, { x: x2, y: y2, initializer: initializer2, ...options } = {}) {
  return delaunayMark(Voronoi2, data, { ...basic({ ...options, x: x2, y: y2 }, exclusiveFacets), initializer: initializer2 });
}
function voronoiMesh(data, options) {
  return delaunayMark(VoronoiMesh, data, options);
}
var defaults$4 = {
  ariaLabel: "density",
  fill: "none",
  stroke: "currentColor",
  strokeMiterlimit: 1
};
var Density = class extends Mark {
  constructor(data, { x: x2, y: y2, z, weight, fill, stroke, ...options } = {}) {
    const fillDensity = isDensity(fill) && (fill = "currentColor", true);
    const strokeDensity = isDensity(stroke) && (stroke = "currentColor", true);
    super(
      data,
      {
        x: { value: x2, scale: "x", optional: true },
        y: { value: y2, scale: "y", optional: true },
        z: { value: maybeZ({ z, fill, stroke }), optional: true },
        weight: { value: weight, optional: true }
      },
      densityInitializer({ ...options, fill, stroke }, fillDensity, strokeDensity),
      defaults$4
    );
    if (fillDensity) this.fill = void 0;
    if (strokeDensity) this.stroke = void 0;
    this.z = z;
  }
  filter(index2) {
    return index2;
  }
  render(index2, scales, channels, dimensions, context) {
    const { contours } = channels;
    const path2 = index();
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, {}).call(
      (g) => g.selectAll().data(index2).enter().append("path").call(applyDirectStyles, this).call(applyChannelStyles, this, channels).attr("d", (i) => path2(contours[i]))
    ).node();
  }
};
function density2(data, { x: x2, y: y2, ...options } = {}) {
  [x2, y2] = maybeTuple(x2, y2);
  return new Density(data, { ...options, x: x2, y: y2 });
}
var dropChannels = /* @__PURE__ */ new Set(["x", "y", "z", "weight"]);
function densityInitializer(options, fillDensity, strokeDensity) {
  const k2 = 100;
  let { bandwidth, thresholds } = options;
  bandwidth = bandwidth === void 0 ? 20 : +bandwidth;
  thresholds = thresholds === void 0 ? 20 : typeof thresholds?.[Symbol.iterator] === "function" ? coerceNumbers(thresholds) : +thresholds;
  return initializer(options, function(data, facets, channels, scales, dimensions, context) {
    const W = channels.weight ? coerceNumbers(channels.weight.value) : null;
    const Z = channels.z?.value;
    const { z } = this;
    const [cx, cy] = applyFrameAnchor(this, dimensions);
    const { width, height } = dimensions;
    const { x: X, y: Y } = applyPosition(channels, scales, context);
    const newChannels = Object.fromEntries(
      Object.entries(channels).filter(([key]) => !dropChannels.has(key)).map(([key, channel]) => [key, { ...channel, value: [] }])
    );
    const FD = fillDensity && [];
    const SD = strokeDensity && [];
    const density3 = density().x(X ? (i) => X[i] : cx).y(Y ? (i) => Y[i] : cy).weight(W ? (i) => W[i] : 1).size([width, height]).bandwidth(bandwidth);
    const facetsContours = [];
    for (const facet of facets) {
      const facetContours = [];
      facetsContours.push(facetContours);
      for (const index2 of Z ? groupZ(facet, Z, z) : [facet]) {
        const contour2 = density3.contours(index2);
        facetContours.push([index2, contour2]);
      }
    }
    let T = thresholds;
    if (!(T instanceof TypedArray)) {
      let maxValue = 0;
      for (const facetContours of facetsContours) {
        for (const [, contour2] of facetContours) {
          const max2 = contour2.max;
          if (max2 > maxValue) maxValue = max2;
        }
      }
      T = Float64Array.from({ length: thresholds - 1 }, (_, i) => maxValue * k2 * (i + 1) / thresholds);
    }
    const newFacets = [];
    const contours = [];
    for (const facetContours of facetsContours) {
      const newFacet = [];
      newFacets.push(newFacet);
      for (const [index2, contour2] of facetContours) {
        for (const t of T) {
          newFacet.push(contours.length);
          contours.push(contour2(t / k2));
          if (FD) FD.push(t);
          if (SD) SD.push(t);
          for (const key in newChannels) {
            newChannels[key].value.push(channels[key].value[index2[0]]);
          }
        }
      }
    }
    if (FD) FD.push(0);
    if (SD) SD.push(0);
    return {
      data,
      facets: newFacets,
      channels: {
        ...newChannels,
        ...FD && { fill: { value: FD, scale: "color" } },
        ...SD && { stroke: { value: SD, scale: "color" } },
        contours: { value: contours }
      }
    };
  });
}
function isDensity(value2) {
  return /^density$/i.test(value2);
}
function differenceX(data, options) {
  return differenceK("x", data, options);
}
function differenceY(data, options) {
  return differenceK("y", data, options);
}
function differenceK(k2, data, {
  x1: x12,
  x2,
  y1: y12,
  y2,
  x: x3 = x12 === void 0 && x2 === void 0 ? k2 === "y" ? indexOf : identity$13 : void 0,
  y: y3 = y12 === void 0 && y2 === void 0 ? k2 === "x" ? indexOf : identity$13 : void 0,
  fill,
  // ignored
  positiveFill = "#3ca951",
  negativeFill = "#4269d0",
  fillOpacity = 1,
  positiveFillOpacity = fillOpacity,
  negativeFillOpacity = fillOpacity,
  stroke,
  strokeOpacity,
  z = maybeColorChannel(stroke)[0],
  clip: clip2,
  // optional additional clip for area
  tip: tip2,
  render,
  ...options
} = {}) {
  [x12, x2] = memoTuple(x3, x12, x2);
  [y12, y2] = memoTuple(y3, y12, y2);
  if (x12 === x2 && y12 === y2) {
    if (k2 === "y") y12 = memo(0);
    else x12 = memo(0);
  }
  ({ tip: tip2 } = withTip({ tip: tip2 }, k2 === "y" ? "x" : "y"));
  return marks(
    !isNoneish(positiveFill) ? Object.assign(
      area3(data, {
        x1: x12,
        x2,
        y1: y12,
        y2,
        z,
        fill: positiveFill,
        fillOpacity: positiveFillOpacity,
        render: composeRender(render, clipDifference(k2, true)),
        clip: clip2,
        ...options
      }),
      { ariaLabel: "positive difference" }
    ) : null,
    !isNoneish(negativeFill) ? Object.assign(
      area3(data, {
        x1: x12,
        x2,
        y1: y12,
        y2,
        z,
        fill: negativeFill,
        fillOpacity: negativeFillOpacity,
        render: composeRender(render, clipDifference(k2, false)),
        clip: clip2,
        ...options
      }),
      { ariaLabel: "negative difference" }
    ) : null,
    line2(data, {
      x: x2,
      y: y2,
      z,
      stroke,
      strokeOpacity,
      tip: tip2,
      clip: true,
      ...options
    })
  );
}
function memoTuple(x2, x12, x22) {
  if (x12 === void 0 && x22 === void 0) {
    x12 = x22 = memo(x2);
  } else if (x12 === void 0) {
    x22 = memo(x22);
    x12 = x2 === void 0 ? x22 : memo(x2);
  } else if (x22 === void 0) {
    x12 = memo(x12);
    x22 = x2 === void 0 ? x12 : memo(x2);
  } else {
    x12 = memo(x12);
    x22 = memo(x22);
  }
  return [x12, x22];
}
function memo(v) {
  let V;
  const { value: value2, label = labelof(value2) } = maybeValue(v);
  return { transform: (data) => V || (V = valueof(data, value2)), label };
}
function clipDifference(k2, positive2) {
  const f = k2 === "x" ? "y" : "x";
  const f1 = `${f}1`;
  const f2 = `${f}2`;
  const k1 = `${k2}1`;
  const k22 = `${k2}2`;
  return (index2, scales, channels, dimensions, context, next) => {
    const { [f1]: F1, [f2]: F2 } = channels;
    const K1 = new Float32Array(F1.length);
    const K2 = new Float32Array(F2.length);
    const m = dimensions[k2 === "y" ? "height" : "width"];
    (positive2 === inferScaleOrder(scales[k2]) < 0 ? K1 : K2).fill(m);
    const oc = next(index2, scales, { ...channels, [f2]: F1, [k22]: K2 }, dimensions, context);
    const og = next(index2, scales, { ...channels, [f1]: F2, [k1]: K1 }, dimensions, context);
    const c3 = oc.querySelector("g") ?? oc;
    const g = og.querySelector("g") ?? og;
    for (let i = 0; c3.firstChild; i += 2) {
      const id = getClipId();
      const clipPath = create("svg:clipPath", context).attr("id", id).node();
      clipPath.appendChild(c3.firstChild);
      g.childNodes[i].setAttribute("clip-path", `url(#${id})`);
      g.insertBefore(clipPath, g.childNodes[i]);
    }
    return og;
  };
}
function centroid2({ geometry = identity$13, ...options } = {}) {
  const getG = memoize1((data) => valueof(data, geometry));
  return initializer(
    // Suppress defaults for x and y since they will be computed by the initializer.
    // Propagate the (memoized) geometry channel in case it’s still needed.
    { ...options, x: null, y: null, geometry: { transform: getG } },
    (data, facets, channels, scales, dimensions, context) => {
      const G = getG(data);
      const n = G.length;
      const X = new Float64Array(n);
      const Y = new Float64Array(n);
      const { centroid: centroid3 } = context.path();
      for (let i = 0; i < n; ++i) [X[i], Y[i]] = centroid3(G[i]);
      return {
        data,
        facets,
        channels: { x: { value: X, scale: null, source: null }, y: { value: Y, scale: null, source: null } }
      };
    }
  );
}
function geoCentroid({ geometry = identity$13, ...options } = {}) {
  const getG = memoize1((data) => valueof(data, geometry));
  const getC = memoize1((data) => valueof(getG(data), centroid));
  return {
    ...options,
    x: { transform: (data) => Float64Array.from(getC(data), ([x2]) => x2) },
    y: { transform: (data) => Float64Array.from(getC(data), ([, y2]) => y2) },
    geometry: { transform: getG }
  };
}
var defaults$3 = {
  ariaLabel: "geo",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeMiterlimit: 1
};
var Geo = class extends Mark {
  constructor(data, options = {}) {
    const [vr, cr] = maybeNumberChannel(options.r, 3);
    super(
      data,
      {
        x: { value: options.tip ? options.x : null, scale: "x", optional: true },
        y: { value: options.tip ? options.y : null, scale: "y", optional: true },
        r: { value: vr, scale: "r", filter: positive, optional: true },
        geometry: { value: options.geometry, scale: "projection" }
      },
      withDefaultSort(options),
      defaults$3
    );
    this.r = cr;
  }
  render(index2, scales, channels, dimensions, context) {
    const { geometry: G, r: R } = channels;
    const path2 = context.path();
    const { r } = this;
    if (negative(r)) index2 = [];
    else if (r !== void 0) path2.pointRadius(r);
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, scales).call((g) => {
      g.selectAll().data(index2).enter().append("path").call(applyDirectStyles, this).attr("d", R ? (i) => path2.pointRadius(R[i])(G[i]) : (i) => path2(G[i])).call(applyChannelStyles, this, channels);
    }).node();
  }
};
function geo(data, options = {}) {
  if (options.tip && options.x === void 0 && options.y === void 0) options = centroid2(options);
  else if (options.geometry === void 0) options = { ...options, geometry: identity$13 };
  return new Geo(data, options);
}
function sphere({ strokeWidth = 1.5, ...options } = {}) {
  return geo({ type: "Sphere" }, { strokeWidth, ...options });
}
function graticule2({ strokeOpacity = 0.1, ...options } = {}) {
  return geo(graticule10(), { strokeOpacity, ...options });
}
var ox = 0.5;
var oy = 0;
function hexbin(outputs = { fill: "count" }, { binWidth, ...options } = {}) {
  const { z } = options;
  binWidth = binWidth === void 0 ? 20 : number$12(binWidth);
  outputs = maybeGroupOutputs(outputs, options);
  if (hasOutput(outputs, "fill")) options.channels = { ...options.channels, fill: { value: [] } };
  if (options.symbol === void 0) options.symbol = "hexagon";
  if (options.r === void 0 && !hasOutput(outputs, "r")) options.r = binWidth / 2;
  return initializer(options, (data, facets, channels, scales, _, context) => {
    let { x: X, y: Y, z: Z, fill: F, stroke: S, symbol: Q } = channels;
    if (X === void 0) throw new Error("missing channel: x");
    if (Y === void 0) throw new Error("missing channel: y");
    ({ x: X, y: Y } = applyPosition(channels, scales, context));
    Z = Z ? Z.value : valueof(data, z);
    F = F?.value;
    S = S?.value;
    Q = Q?.value;
    const G = maybeSubgroup(outputs, { z: Z, fill: F, stroke: S, symbol: Q });
    const GZ = Z && [];
    const GF = F && [];
    const GS = S && [];
    const GQ = Q && [];
    const binFacets = [];
    const BX = [];
    const BY = [];
    let i = -1;
    for (const o of outputs) o.initialize(data);
    for (const facet of facets) {
      const binFacet = [];
      for (const o of outputs) o.scope("facet", facet);
      for (const [f, I] of maybeGroup(facet, G)) {
        for (const { index: b, extent: extent3 } of hbin(data, I, X, Y, binWidth)) {
          binFacet.push(++i);
          BX.push(extent3.x);
          BY.push(extent3.y);
          if (Z) GZ.push(G === Z ? f : Z[b[0]]);
          if (F) GF.push(G === F ? f : F[b[0]]);
          if (S) GS.push(G === S ? f : S[b[0]]);
          if (Q) GQ.push(G === Q ? f : Q[b[0]]);
          for (const o of outputs) o.reduce(b, extent3);
        }
      }
      binFacets.push(binFacet);
    }
    const sx = channels.x.scale;
    const sy = channels.y.scale;
    const binChannels = {
      x: { value: BX, source: scales[sx] ? { value: map$1(BX, scales[sx].invert), scale: sx } : null },
      y: { value: BY, source: scales[sy] ? { value: map$1(BY, scales[sy].invert), scale: sy } : null },
      ...Z && { z: { value: GZ } },
      ...F && { fill: { value: GF, scale: "auto" } },
      ...S && { stroke: { value: GS, scale: "auto" } },
      ...Q && { symbol: { value: GQ, scale: "auto" } },
      ...Object.fromEntries(
        outputs.map(({ name, output }) => [
          name,
          {
            scale: "auto",
            label: output.label,
            radius: name === "r" ? binWidth / 2 : void 0,
            value: output.transform()
          }
        ])
      )
    };
    return { data, facets: binFacets, channels: binChannels };
  });
}
function hbin(data, I, X, Y, dx) {
  const dy = dx * (1.5 / sqrt32);
  const bins = /* @__PURE__ */ new Map();
  for (const i of I) {
    let px = X[i], py = Y[i];
    if (isNaN(px) || isNaN(py)) continue;
    let pj = Math.round(py = (py - oy) / dy), pi5 = Math.round(px = (px - ox) / dx - (pj & 1) / 2), py1 = py - pj;
    if (Math.abs(py1) * 3 > 1) {
      let px1 = px - pi5, pi22 = pi5 + (px < pi5 ? -1 : 1) / 2, pj2 = pj + (py < pj ? -1 : 1), px2 = px - pi22, py2 = py - pj2;
      if (px1 * px1 + py1 * py1 > px2 * px2 + py2 * py2) pi5 = pi22 + (pj & 1 ? 1 : -1) / 2, pj = pj2;
    }
    const key = `${pi5},${pj}`;
    let bin2 = bins.get(key);
    if (bin2 === void 0) {
      bin2 = { index: [], extent: { data, x: (pi5 + (pj & 1) / 2) * dx + ox, y: pj * dy + oy } };
      bins.set(key, bin2);
    }
    bin2.index.push(i);
  }
  return bins.values();
}
var defaults$2 = {
  ariaLabel: "hexgrid",
  fill: "none",
  stroke: "currentColor",
  strokeOpacity: 0.1
};
function hexgrid(options) {
  return new Hexgrid(options);
}
var Hexgrid = class extends Mark {
  constructor({ binWidth = 20, clip: clip2 = true, ...options } = {}) {
    super(singleton, void 0, { clip: clip2, ...options }, defaults$2);
    this.binWidth = number$12(binWidth);
  }
  render(index2, scales, channels, dimensions, context) {
    const { binWidth } = this;
    const { marginTop, marginRight, marginBottom, marginLeft, width, height } = dimensions;
    const x02 = marginLeft - ox, x12 = width - marginRight - ox, y02 = marginTop - oy, y12 = height - marginBottom - oy, rx = binWidth / 2, ry = rx * sqrt4_3, hy = ry / 2, wx = rx * 2, wy = ry * 1.5, i0 = Math.floor(x02 / wx), i1 = Math.ceil(x12 / wx), j0 = Math.floor((y02 + hy) / wy), j1 = Math.ceil((y12 - hy) / wy) + 1, path2 = `m0,${round2(-ry)}l${round2(rx)},${round2(hy)}v${round2(ry)}l${round2(-rx)},${round2(hy)}`;
    let d = path2;
    for (let j = j0; j < j1; ++j) {
      for (let i = i0; i < i1; ++i) {
        d += `M${round2(i * wx + (j & 1) * rx)},${round2(j * wy)}${path2}`;
      }
    }
    return create("svg:g", context).datum(0).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, {}, offset + ox, offset + oy).call((g) => g.append("path").call(applyDirectStyles, this).call(applyChannelStyles, this, channels).attr("d", d)).node();
  }
};
function round2(x2) {
  return Math.round(x2 * 1e3) / 1e3;
}
var defaults$1 = {
  ariaLabel: "image",
  fill: null,
  stroke: null
};
function isPath(string3) {
  return /^\.*\//.test(string3);
}
function isUrl(string3) {
  return /^(blob|data|file|http|https):/i.test(string3);
}
function maybePathChannel(value2) {
  return typeof value2 === "string" && (isPath(value2) || isUrl(value2)) ? [void 0, value2] : [value2, void 0];
}
var Image = class extends Mark {
  constructor(data, options = {}) {
    let { x: x2, y: y2, r, width, height, rotate, src, preserveAspectRatio, crossOrigin, frameAnchor, imageRendering } = options;
    if (r == null) r = void 0;
    if (r === void 0 && width === void 0 && height === void 0) width = height = 16;
    else if (width === void 0 && height !== void 0) width = height;
    else if (height === void 0 && width !== void 0) height = width;
    const [vs, cs] = maybePathChannel(src);
    const [vr, cr] = maybeNumberChannel(r);
    const [vw, cw] = maybeNumberChannel(width, cr !== void 0 ? cr * 2 : void 0);
    const [vh, ch] = maybeNumberChannel(height, cr !== void 0 ? cr * 2 : void 0);
    const [va, ca] = maybeNumberChannel(rotate, 0);
    super(
      data,
      {
        x: { value: x2, scale: "x", optional: true },
        y: { value: y2, scale: "y", optional: true },
        r: { value: vr, scale: "r", filter: positive, optional: true },
        width: { value: vw, filter: positive, optional: true },
        height: { value: vh, filter: positive, optional: true },
        rotate: { value: va, optional: true },
        src: { value: vs, optional: true }
      },
      withDefaultSort(options),
      defaults$1
    );
    this.src = cs;
    this.width = cw;
    this.rotate = ca;
    this.height = ch;
    this.r = cr;
    this.preserveAspectRatio = impliedString(preserveAspectRatio, "xMidYMid");
    this.crossOrigin = string2(crossOrigin);
    this.frameAnchor = maybeFrameAnchor(frameAnchor);
    this.imageRendering = impliedString(imageRendering, "auto");
  }
  render(index2, scales, channels, dimensions, context) {
    const { x: x2, y: y2 } = scales;
    const { x: X, y: Y, width: W, height: H, r: R, rotate: A5, src: S } = channels;
    const { r, width, height, rotate } = this;
    const [cx, cy] = applyFrameAnchor(this, dimensions);
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, { x: X && x2, y: Y && y2 }).call(
      (g) => g.selectAll().data(index2).enter().append("image").call(applyDirectStyles, this).attr("x", position(X, W, R, cx, width, r)).attr("y", position(Y, H, R, cy, height, r)).attr("width", W ? (i) => W[i] : width !== void 0 ? width : R ? (i) => R[i] * 2 : r * 2).attr("height", H ? (i) => H[i] : height !== void 0 ? height : R ? (i) => R[i] * 2 : r * 2).attr("transform", A5 ? (i) => `rotate(${A5[i]})` : rotate ? `rotate(${rotate})` : null).attr("transform-origin", A5 || rotate ? template`${X ? (i) => X[i] : cx}px ${Y ? (i) => Y[i] : cy}px` : null).call(applyAttr, "href", S ? (i) => S[i] : this.src).call(applyAttr, "preserveAspectRatio", this.preserveAspectRatio).call(applyAttr, "crossorigin", this.crossOrigin).call(applyAttr, "image-rendering", this.imageRendering).call(applyAttr, "clip-path", R ? (i) => `circle(${R[i]}px)` : r !== void 0 ? `circle(${r}px)` : null).call(applyChannelStyles, this, channels)
    ).node();
  }
};
function position(X, W, R, x2, w, r) {
  return W && X ? (i) => X[i] - W[i] / 2 : W ? (i) => x2 - W[i] / 2 : X && w !== void 0 ? (i) => X[i] - w / 2 : w !== void 0 ? x2 - w / 2 : R && X ? (i) => X[i] - R[i] : R ? (i) => x2 - R[i] : X ? (i) => X[i] - r : x2 - r;
}
function image(data, { x: x2, y: y2, ...options } = {}) {
  if (options.frameAnchor === void 0) [x2, y2] = maybeTuple(x2, y2);
  return new Image(data, { ...options, x: x2, y: y2 });
}
function ibetainv(p, a2, b) {
  var EPS = 1e-8;
  var a1 = a2 - 1;
  var b1 = b - 1;
  var j = 0;
  var lna, lnb, t, u2, err, x2, w, afac;
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  {
    lna = Math.log(a2 / (a2 + b));
    lnb = Math.log(b / (a2 + b));
    t = Math.exp(a2 * lna) / a2;
    u2 = Math.exp(b * lnb) / b;
    w = t + u2;
    if (p < t / w) x2 = Math.pow(a2 * w * p, 1 / a2);
    else x2 = 1 - Math.pow(b * w * (1 - p), 1 / b);
  }
  afac = -gammaln(a2) - gammaln(b) + gammaln(a2 + b);
  for (; j < 10; j++) {
    if (x2 === 0 || x2 === 1) return x2;
    err = ibeta(x2, a2, b) - p;
    t = Math.exp(a1 * Math.log(x2) + b1 * Math.log(1 - x2) + afac);
    u2 = err / t;
    x2 -= t = u2 / (1 - 0.5 * Math.min(1, u2 * (a1 / x2 - b1 / (1 - x2))));
    if (x2 <= 0) x2 = 0.5 * (x2 + t);
    if (x2 >= 1) x2 = 0.5 * (x2 + t + 1);
    if (Math.abs(t) < EPS * x2 && j > 0) break;
  }
  return x2;
}
function ibeta(x2, a2, b) {
  var bt = x2 === 0 || x2 === 1 ? 0 : Math.exp(gammaln(a2 + b) - gammaln(a2) - gammaln(b) + a2 * Math.log(x2) + b * Math.log(1 - x2));
  if (x2 < 0 || x2 > 1) return false;
  if (x2 < (a2 + 1) / (a2 + b + 2))
    return bt * betacf(x2, a2, b) / a2;
  return 1 - bt * betacf(1 - x2, b, a2) / b;
}
function betacf(x2, a2, b) {
  var fpmin = 1e-30;
  var m = 1;
  var qab = a2 + b;
  var qap = a2 + 1;
  var qam = a2 - 1;
  var c3 = 1;
  var d = 1 - qab * x2 / qap;
  var m2, aa, del, h;
  if (Math.abs(d) < fpmin) d = fpmin;
  d = 1 / d;
  h = d;
  for (; m <= 100; m++) {
    m2 = 2 * m;
    aa = m * (b - m) * x2 / ((qam + m2) * (a2 + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c3 = 1 + aa / c3;
    if (Math.abs(c3) < fpmin) c3 = fpmin;
    d = 1 / d;
    h *= d * c3;
    aa = -(a2 + m) * (qab + m) * x2 / ((a2 + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c3 = 1 + aa / c3;
    if (Math.abs(c3) < fpmin) c3 = fpmin;
    d = 1 / d;
    del = d * c3;
    h *= del;
    if (Math.abs(del - 1) < 3e-7) break;
  }
  return h;
}
function gammaln(x2) {
  var j = 0;
  var cof = [
    76.18009172947146,
    -86.5053203294167,
    24.01409824083091,
    -1.231739572450155,
    0.001208650973866179,
    -5395239384953e-18
  ];
  var ser = 1.000000000190015;
  var xx, y2, tmp;
  tmp = (y2 = xx = x2) + 5.5;
  tmp -= (xx + 0.5) * Math.log(tmp);
  for (; j < 6; j++) ser += cof[j] / ++y2;
  return Math.log(2.506628274631 * ser / xx) - tmp;
}
function qt(p, dof) {
  var x2 = ibetainv(2 * Math.min(p, 1 - p), 0.5 * dof, 0.5);
  x2 = Math.sqrt(dof * (1 - x2) / x2);
  return p > 0.5 ? x2 : -x2;
}
var defaults = {
  ariaLabel: "linear-regression",
  fill: "currentColor",
  fillOpacity: 0.1,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeMiterlimit: 1
};
var LinearRegression = class extends Mark {
  constructor(data, options = {}) {
    const { x: x2, y: y2, z, ci = 0.95, precision = 4 } = options;
    super(
      data,
      {
        x: { value: x2, scale: "x" },
        y: { value: y2, scale: "y" },
        z: { value: maybeZ(options), optional: true }
      },
      options,
      defaults
    );
    this.z = z;
    this.ci = +ci;
    this.precision = +precision;
    if (!(0 <= this.ci && this.ci < 1)) throw new Error(`invalid ci; not in [0, 1): ${ci}`);
    if (!(this.precision > 0)) throw new Error(`invalid precision: ${precision}`);
  }
  render(index2, scales, channels, dimensions, context) {
    const { x: X, y: Y, z: Z } = channels;
    const { ci } = this;
    return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(applyTransform, this, scales).call(
      (g) => g.selectAll().data(Z ? groupZ(index2, Z, this.z) : [index2]).enter().call(
        (enter) => enter.append("path").attr("fill", "none").call(applyDirectStyles, this).call(applyGroupedChannelStyles, this, { ...channels, fill: null, fillOpacity: null }).attr("d", (I) => this._renderLine(I, X, Y)).call(
          ci && !isNone(this.fill) ? (path2) => path2.select(pathBefore).attr("stroke", "none").call(applyDirectStyles, this).call(applyGroupedChannelStyles, this, {
            ...channels,
            stroke: null,
            strokeOpacity: null,
            strokeWidth: null
          }).attr("d", (I) => this._renderBand(I, X, Y)) : () => {
          }
        )
      )
    ).node();
  }
};
function pathBefore() {
  return this.parentNode.insertBefore(this.ownerDocument.createElementNS(namespaces.svg, "path"), this);
}
var LinearRegressionX = class extends LinearRegression {
  constructor(data, options) {
    super(data, options);
  }
  _renderBand(I, X, Y) {
    const { ci, precision } = this;
    const [y12, y2] = extent(I, (i) => Y[i]);
    const f = linearRegressionF(I, Y, X);
    const g = confidenceIntervalF(I, Y, X, (1 - ci) / 2, f);
    return area2().y((y3) => y3).x0((y3) => g(y3, -1)).x1((y3) => g(y3, 1))(range(y12, y2 - precision / 2, precision).concat(y2));
  }
  _renderLine(I, X, Y) {
    const [y12, y2] = extent(I, (i) => Y[i]);
    const f = linearRegressionF(I, Y, X);
    return `M${f(y12)},${y12}L${f(y2)},${y2}`;
  }
};
var LinearRegressionY = class extends LinearRegression {
  constructor(data, options) {
    super(data, options);
  }
  _renderBand(I, X, Y) {
    const { ci, precision } = this;
    const [x12, x2] = extent(I, (i) => X[i]);
    const f = linearRegressionF(I, X, Y);
    const g = confidenceIntervalF(I, X, Y, (1 - ci) / 2, f);
    return area2().x((x3) => x3).y0((x3) => g(x3, -1)).y1((x3) => g(x3, 1))(range(x12, x2 - precision / 2, precision).concat(x2));
  }
  _renderLine(I, X, Y) {
    const [x12, x2] = extent(I, (i) => X[i]);
    const f = linearRegressionF(I, X, Y);
    return `M${x12},${f(x12)}L${x2},${f(x2)}`;
  }
};
function linearRegressionX(data, { y: y2 = indexOf, x: x2 = identity$13, stroke, fill = isNoneish(stroke) ? "currentColor" : stroke, ...options } = {}) {
  return new LinearRegressionX(data, maybeDenseIntervalY({ ...options, x: x2, y: y2, fill, stroke }));
}
function linearRegressionY(data, { x: x2 = indexOf, y: y2 = identity$13, stroke, fill = isNoneish(stroke) ? "currentColor" : stroke, ...options } = {}) {
  return new LinearRegressionY(data, maybeDenseIntervalX({ ...options, x: x2, y: y2, fill, stroke }));
}
function linearRegressionF(I, X, Y) {
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const i of I) {
    const xi = X[i];
    const yi = Y[i];
    sumX += xi;
    sumY += yi;
    sumXY += xi * yi;
    sumX2 += xi * xi;
  }
  const n = I.length;
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return (x2) => slope * x2 + intercept;
}
function confidenceIntervalF(I, X, Y, p, f) {
  const mean2 = sum(I, (i) => X[i]) / I.length;
  let a2 = 0, b = 0;
  for (const i of I) {
    a2 += (X[i] - mean2) ** 2;
    b += (Y[i] - f(X[i])) ** 2;
  }
  const sy = Math.sqrt(b / (I.length - 2));
  const t = qt(p, I.length - 2);
  return (x2, k2) => {
    const Y3 = f(x2);
    const se = sy * Math.sqrt(1 / I.length + (x2 - mean2) ** 2 / a2);
    return Y3 + k2 * t * se;
  };
}
function treeNode({
  path: path2 = identity$13,
  // the delimited path
  delimiter,
  // how the path is separated
  frameAnchor,
  treeLayout = tree,
  treeSort,
  treeSeparation,
  treeAnchor,
  treeFilter,
  ...options
} = {}) {
  treeAnchor = maybeTreeAnchor(treeAnchor);
  treeSort = maybeTreeSort(treeSort);
  if (treeFilter != null) treeFilter = maybeNodeValue(treeFilter);
  if (frameAnchor === void 0) frameAnchor = treeAnchor.frameAnchor;
  const normalize4 = normalizer(delimiter);
  const outputs = treeOutputs(options, maybeNodeValue);
  const [X, setX] = column();
  const [Y, setY] = column();
  return {
    x: X,
    y: Y,
    frameAnchor,
    ...basic(options, (data, facets) => {
      const P = normalize4(valueof(data, path2));
      const X3 = setX([]);
      const Y3 = setY([]);
      let treeIndex = -1;
      const treeData = [];
      const treeFacets = [];
      const rootof = stratify().path((i) => P[i]);
      const setData = isArray(data) ? (node) => node.data = data[node.data] : (node) => node.data = data.get(node.data);
      const layout = treeLayout();
      if (layout.nodeSize) layout.nodeSize([1, 1]);
      if (layout.separation && treeSeparation !== void 0) layout.separation(treeSeparation ?? one2);
      for (const o of outputs) o[output_values] = o[output_setValues]([]);
      for (const facet of facets) {
        const treeFacet = [];
        const root2 = rootof(facet.filter((i) => P[i] != null)).each(setData);
        if (treeSort != null) root2.sort(treeSort);
        layout(root2);
        for (const node of root2.descendants()) {
          if (treeFilter != null && !treeFilter(node)) continue;
          treeFacet.push(++treeIndex);
          treeData[treeIndex] = node.data;
          treeAnchor.position(node, treeIndex, X3, Y3);
          for (const o of outputs) o[output_values][treeIndex] = o[output_evaluate](node);
        }
        treeFacets.push(treeFacet);
      }
      return { data: treeData, facets: treeFacets };
    }),
    ...Object.fromEntries(outputs)
  };
}
function treeLink({
  path: path2 = identity$13,
  // the delimited path
  delimiter,
  // how the path is separated
  curve = "bump-x",
  stroke = "light-dark(#777, #aaa)",
  strokeWidth = 1.5,
  strokeOpacity = 0.5,
  treeLayout = tree,
  treeSort,
  treeSeparation,
  treeAnchor,
  treeFilter,
  ...options
} = {}) {
  treeAnchor = maybeTreeAnchor(treeAnchor);
  treeSort = maybeTreeSort(treeSort);
  if (treeFilter != null) treeFilter = maybeLinkValue(treeFilter);
  options = { curve, stroke, strokeWidth, strokeOpacity, ...options };
  const normalize4 = normalizer(delimiter);
  const outputs = treeOutputs(options, maybeLinkValue);
  const [X12, setX1] = column();
  const [X22, setX2] = column();
  const [Y12, setY1] = column();
  const [Y22, setY2] = column();
  return {
    x1: X12,
    x2: X22,
    y1: Y12,
    y2: Y22,
    ...basic(options, (data, facets) => {
      const P = normalize4(valueof(data, path2));
      const X13 = setX1([]);
      const X23 = setX2([]);
      const Y13 = setY1([]);
      const Y23 = setY2([]);
      let treeIndex = -1;
      const treeData = [];
      const treeFacets = [];
      const rootof = stratify().path((i) => P[i]);
      const layout = treeLayout();
      if (layout.nodeSize) layout.nodeSize([1, 1]);
      if (layout.separation && treeSeparation !== void 0) layout.separation(treeSeparation ?? one2);
      for (const o of outputs) o[output_values] = o[output_setValues]([]);
      for (const facet of facets) {
        const treeFacet = [];
        const root2 = rootof(facet.filter((i) => P[i] != null)).each((node) => node.data = data[node.data]);
        if (treeSort != null) root2.sort(treeSort);
        layout(root2);
        for (const { source, target } of root2.links()) {
          if (treeFilter != null && !treeFilter(target, source)) continue;
          treeFacet.push(++treeIndex);
          treeData[treeIndex] = target.data;
          treeAnchor.position(source, treeIndex, X13, Y13);
          treeAnchor.position(target, treeIndex, X23, Y23);
          for (const o of outputs) o[output_values][treeIndex] = o[output_evaluate](target, source);
        }
        treeFacets.push(treeFacet);
      }
      return { data: treeData, facets: treeFacets };
    }),
    ...Object.fromEntries(outputs)
  };
}
function maybeTreeAnchor(anchor = "left") {
  switch (`${anchor}`.trim().toLowerCase()) {
    case "left":
      return treeAnchorLeft;
    case "right":
      return treeAnchorRight;
  }
  throw new Error(`invalid tree anchor: ${anchor}`);
}
var treeAnchorLeft = {
  frameAnchor: "left",
  dx: 6,
  position({ x: x2, y: y2 }, i, X, Y) {
    X[i] = y2;
    Y[i] = -x2;
  }
};
var treeAnchorRight = {
  frameAnchor: "right",
  dx: -6,
  position({ x: x2, y: y2 }, i, X, Y) {
    X[i] = -y2;
    Y[i] = -x2;
  }
};
function maybeTreeSort(sort3) {
  return sort3 == null || typeof sort3 === "function" ? sort3 : `${sort3}`.trim().toLowerCase().startsWith("node:") ? nodeSort(maybeNodeValue(sort3)) : nodeSort(nodeData(sort3));
}
function nodeSort(value2) {
  return (a2, b) => ascendingDefined2(value2(a2), value2(b));
}
function nodeData(field2) {
  return (node) => node.data?.[field2];
}
function normalizer(delimiter = "/") {
  delimiter = `${delimiter}`;
  if (delimiter === "/") return (P) => P;
  if (delimiter.length !== 1) throw new Error("delimiter must be exactly one character");
  const delimiterCode = delimiter.charCodeAt(0);
  return (P) => P.map((p) => slashDelimiter(p, delimiterCode));
}
var CODE_BACKSLASH = 92;
var CODE_SLASH = 47;
function slashDelimiter(input, delimiterCode) {
  if (delimiterCode === CODE_BACKSLASH) throw new Error("delimiter cannot be backslash");
  let afterBackslash = false;
  for (let i = 0, n = input.length; i < n; ++i) {
    switch (input.charCodeAt(i)) {
      case CODE_BACKSLASH:
        if (!afterBackslash) {
          afterBackslash = true;
          continue;
        }
        break;
      case delimiterCode:
        if (afterBackslash) {
          input = input.slice(0, i - 1) + input.slice(i), --i, --n;
        } else {
          input = input.slice(0, i) + "/" + input.slice(i + 1);
        }
        break;
      case CODE_SLASH:
        if (afterBackslash) {
          input = input.slice(0, i) + "\\\\" + input.slice(i), i += 2, n += 2;
        } else {
          input = input.slice(0, i) + "\\" + input.slice(i), ++i, ++n;
        }
        break;
    }
    afterBackslash = false;
  }
  return input;
}
function slashUnescape(input) {
  let afterBackslash = false;
  for (let i = 0, n = input.length; i < n; ++i) {
    switch (input.charCodeAt(i)) {
      case CODE_BACKSLASH:
        if (!afterBackslash) {
          afterBackslash = true;
          continue;
        }
      // eslint-disable-next-line no-fallthrough
      case CODE_SLASH:
        if (afterBackslash) {
          input = input.slice(0, i - 1) + input.slice(i), --i, --n;
        }
        break;
    }
    afterBackslash = false;
  }
  return input;
}
function isNodeValue(option) {
  return isObject(option) && typeof option.node === "function";
}
function isLinkValue(option) {
  return isObject(option) && typeof option.link === "function";
}
function maybeNodeValue(value2) {
  if (isNodeValue(value2)) return value2.node;
  value2 = `${value2}`.trim().toLowerCase();
  if (!value2.startsWith("node:")) return;
  switch (value2) {
    case "node:name":
      return nodeName;
    case "node:path":
      return nodePath;
    case "node:internal":
      return nodeInternal;
    case "node:external":
      return nodeExternal;
    case "node:depth":
      return nodeDepth;
    case "node:height":
      return nodeHeight;
  }
  throw new Error(`invalid node value: ${value2}`);
}
function maybeLinkValue(value2) {
  if (isNodeValue(value2)) return value2.node;
  if (isLinkValue(value2)) return value2.link;
  value2 = `${value2}`.trim().toLowerCase();
  if (!value2.startsWith("node:") && !value2.startsWith("parent:")) return;
  switch (value2) {
    case "parent:name":
      return parentValue(nodeName);
    case "parent:path":
      return parentValue(nodePath);
    case "parent:depth":
      return parentValue(nodeDepth);
    case "parent:height":
      return parentValue(nodeHeight);
    case "node:name":
      return nodeName;
    case "node:path":
      return nodePath;
    case "node:internal":
      return nodeInternal;
    case "node:external":
      return nodeExternal;
    case "node:depth":
      return nodeDepth;
    case "node:height":
      return nodeHeight;
  }
  throw new Error(`invalid link value: ${value2}`);
}
function nodePath(node) {
  return node.id;
}
function nodeName(node) {
  return nameof(node.id);
}
function nodeDepth(node) {
  return node.depth;
}
function nodeHeight(node) {
  return node.height;
}
function nodeInternal(node) {
  return !!node.children;
}
function nodeExternal(node) {
  return !node.children;
}
function parentValue(evaluate) {
  return (child, parent) => parent == null ? void 0 : evaluate(parent);
}
function nameof(path2) {
  let i = path2.length;
  while (--i > 0) if (slash2(path2, i)) break;
  return slashUnescape(path2.slice(i + 1));
}
function slash2(path2, i) {
  if (path2[i] === "/") {
    let k2 = 0;
    while (i > 0 && path2[--i] === "\\") ++k2;
    if ((k2 & 1) === 0) return true;
  }
  return false;
}
var output_setValues = 2;
var output_evaluate = 3;
var output_values = 4;
function treeOutputs(options, maybeTreeValue) {
  const outputs = [];
  for (const name in options) {
    const value2 = options[name];
    const treeValue = maybeTreeValue(value2);
    if (treeValue !== void 0) {
      outputs.push([name, ...column(value2), treeValue]);
    }
  }
  return outputs;
}
function tree2(data, {
  fill,
  stroke,
  strokeWidth,
  strokeOpacity,
  strokeLinejoin,
  strokeLinecap,
  strokeMiterlimit,
  strokeDasharray,
  strokeDashoffset,
  marker,
  markerStart = marker,
  markerEnd = marker,
  dot: dotDot = isNoneish(markerStart) && isNoneish(markerEnd),
  text: textText = "node:name",
  textStroke = "var(--plot-background)",
  title = "node:path",
  dx,
  dy,
  textAnchor,
  treeLayout = tree,
  textLayout = treeLayout === tree || treeLayout === cluster ? "mirrored" : "normal",
  tip: tip2,
  ...options
} = {}) {
  if (dx === void 0) dx = maybeTreeAnchor(options.treeAnchor).dx;
  if (textAnchor !== void 0) throw new Error("textAnchor is not a configurable tree option");
  textLayout = keyword(textLayout, "textLayout", ["mirrored", "normal"]);
  function treeText(textOptions2) {
    return text(
      data,
      treeNode({
        treeLayout,
        text: textText,
        fill: fill === void 0 ? "currentColor" : fill,
        stroke: textStroke,
        dx,
        dy,
        title,
        ...textOptions2,
        ...options
      })
    );
  }
  return marks(
    link2(
      data,
      treeLink({
        treeLayout,
        markerStart,
        markerEnd,
        stroke: stroke !== void 0 ? stroke : fill === void 0 ? "node:internal" : fill,
        strokeWidth,
        strokeOpacity,
        strokeLinejoin,
        strokeLinecap,
        strokeMiterlimit,
        strokeDasharray,
        strokeDashoffset,
        ...options
      })
    ),
    dotDot ? dot(data, treeNode({ treeLayout, fill: fill === void 0 ? "node:internal" : fill, title, tip: tip2, ...options })) : null,
    textText != null ? textLayout === "mirrored" ? [
      treeText({ textAnchor: "start", treeFilter: "node:external" }),
      treeText({ textAnchor: "end", treeFilter: "node:internal", dx: -dx })
    ] : treeText() : null
  );
}
function cluster2(data, options) {
  return tree2(data, { ...options, treeLayout: cluster });
}
var waffleDefaults = {
  ariaLabel: "waffle"
};
var WaffleX = class extends BarX {
  constructor(data, { unit: unit3 = 1, gap = 1, round: round3, multiple, ...options } = {}) {
    super(data, wafflePolygon("x", options), waffleDefaults);
    this.unit = Math.max(0, unit3);
    this.gap = +gap;
    this.round = maybeRound(round3);
    this.multiple = maybeMultiple(multiple);
  }
};
var WaffleY = class extends BarY {
  constructor(data, { unit: unit3 = 1, gap = 1, round: round3, multiple, ...options } = {}) {
    super(data, wafflePolygon("y", options), waffleDefaults);
    this.unit = Math.max(0, unit3);
    this.gap = +gap;
    this.round = maybeRound(round3);
    this.multiple = maybeMultiple(multiple);
  }
};
function wafflePolygon(y2, options) {
  const x2 = y2 === "y" ? "x" : "y";
  const y12 = `${y2}1`;
  const y22 = `${y2}2`;
  return initializer(waffleRender(options), function(data, facets, channels, scales, dimensions) {
    const { round: round3, unit: unit3 } = this;
    const Y12 = channels[y12].value;
    const Y22 = channels[y22].value;
    const xy = valueObject({ ...x2 in channels && { [x2]: channels[x2] }, [y12]: channels[y12], [y22]: channels[y22] }, scales);
    const barwidth = this[y2 === "y" ? "_width" : "_height"](scales, xy, dimensions);
    const barx = this[y2 === "y" ? "_x" : "_y"](scales, xy, dimensions);
    const scale2 = unit3 * scaleof(scales.scales[y2]);
    const { multiple = Math.max(1, Math.floor(Math.sqrt(barwidth / scale2))) } = this;
    const cx = Math.min(barwidth / multiple, scale2 * multiple);
    const cy = scale2 * multiple;
    const tx = (barwidth - multiple * cx) / 2;
    const x02 = typeof barx === "function" ? (i) => barx(i) + tx : barx + tx;
    const y02 = scales[y2](0);
    const transform2 = y2 === "y" ? ([x3, y3]) => [x3 * cx, -y3 * cy] : ([x3, y3]) => [y3 * cy, x3 * cx];
    const mx = typeof x02 === "function" ? (i) => x02(i) - barwidth / 2 : () => x02;
    const [ix, iy] = y2 === "y" ? [0, 1] : [1, 0];
    const n = Y22.length;
    const P = new Array(n);
    const X = new Float64Array(n);
    const Y = new Float64Array(n);
    for (let i = 0; i < n; ++i) {
      P[i] = wafflePoints(round3(Y12[i] / unit3), round3(Y22[i] / unit3), multiple).map(transform2);
      const c3 = P[i].pop();
      X[i] = c3[ix] + mx(i);
      Y[i] = c3[iy] + y02;
    }
    return {
      channels: {
        polygon: { value: P, source: null, filter: null },
        [`c${x2}`]: { value: [cx, x02], source: null, filter: null },
        [`c${y2}`]: { value: [cy, y02], source: null, filter: null },
        [x2]: { value: X, scale: null, source: null },
        [y12]: { value: Y, scale: null, source: channels[y12] },
        [y22]: { value: Y, scale: null, source: channels[y22] }
      }
    };
  });
}
function waffleRender({ render, ...options }) {
  return {
    ...options,
    render: composeRender(render, function(index2, scales, values2, dimensions, context) {
      const { gap, rx, ry } = this;
      const { channels, ariaLabel, href, title, ...visualValues } = values2;
      const { document: document2 } = context;
      const polygon = channels.polygon.value;
      const [cx, x02] = channels.cx.value;
      const [cy, y02] = channels.cy.value;
      const patternId = getPatternId();
      const basePattern = document2.createElementNS(namespaces.svg, "pattern");
      basePattern.setAttribute("width", cx);
      basePattern.setAttribute("height", cy);
      basePattern.setAttribute("patternUnits", "userSpaceOnUse");
      const basePatternRect = basePattern.appendChild(document2.createElementNS(namespaces.svg, "rect"));
      basePatternRect.setAttribute("x", gap / 2);
      basePatternRect.setAttribute("y", gap / 2);
      basePatternRect.setAttribute("width", cx - gap);
      basePatternRect.setAttribute("height", cy - gap);
      if (rx != null) basePatternRect.setAttribute("rx", rx);
      if (ry != null) basePatternRect.setAttribute("ry", ry);
      return create("svg:g", context).call(applyIndirectStyles, this, dimensions, context).call(this._transform, this, scales).call(
        (g) => g.selectAll().data(index2).enter().append(() => basePattern.cloneNode(true)).attr("id", (i) => `${patternId}-${i}`).select("rect").call(applyDirectStyles, this).call(applyChannelStyles, this, visualValues)
      ).call(
        (g) => g.selectAll().data(index2).enter().append("path").attr("transform", template`translate(${x02},${y02})`).attr("d", (i) => `M${polygon[i].join("L")}Z`).attr("fill", (i) => `url(#${patternId}-${i})`).attr("stroke", this.stroke == null ? null : "none").call(applyChannelStyles, this, { ariaLabel, href, title })
      ).node();
    })
  };
}
function wafflePoints(i1, i2, columns) {
  if (i2 < i1) return wafflePoints(i2, i1, columns);
  if (i1 < 0) return wafflePointsOffset(i1, i2, columns, Math.ceil(-Math.min(i1, i2) / columns));
  const x1f = Math.floor(i1 % columns);
  const x1c = Math.ceil(i1 % columns);
  const x2f = Math.floor(i2 % columns);
  const x2c = Math.ceil(i2 % columns);
  const y1f = Math.floor(i1 / columns);
  const y1c = Math.ceil(i1 / columns);
  const y2f = Math.floor(i2 / columns);
  const y2c = Math.ceil(i2 / columns);
  const points = [];
  if (y2c > y1c) points.push([0, y1c]);
  points.push([x1f, y1c], [x1f, y1f + i1 % 1], [x1c, y1f + i1 % 1]);
  if (!(i1 % columns > columns - 1)) {
    points.push([x1c, y1f]);
    if (y2f > y1f) points.push([columns, y1f]);
  }
  if (y2f > y1f) points.push([columns, y2f]);
  points.push([x2c, y2f], [x2c, y2f + i2 % 1], [x2f, y2f + i2 % 1]);
  if (!(i2 % columns < 1)) {
    points.push([x2f, y2c]);
    if (y2c > y1c) points.push([0, y2c]);
  }
  points.push(waffleCentroid(i1, i2, columns));
  return points;
}
function wafflePointsOffset(i1, i2, columns, k2) {
  return wafflePoints(i1 + k2 * columns, i2 + k2 * columns, columns).map(([x2, y2]) => [x2, y2 - k2]);
}
function waffleCentroid(i1, i2, columns) {
  const r = Math.floor(i2 / columns) - Math.floor(i1 / columns);
  return r === 0 ? (
    // Single row
    waffleRowCentroid(i1, i2, columns)
  ) : r === 1 ? (
    // Two incomplete rows; use the midpoint of their overlap if any; otherwise, the larger row
    Math.floor(i2 % columns) > Math.ceil(i1 % columns) ? [(Math.floor(i2 % columns) + Math.ceil(i1 % columns)) / 2, Math.floor(i2 / columns)] : i2 % columns > columns - i1 % columns ? waffleRowCentroid(i2 - i2 % columns, i2, columns) : waffleRowCentroid(i1, columns * Math.ceil(i1 / columns), columns)
  ) : (
    // At least one full row; take the midpoint of all the rows that include the middle
    [columns / 2, (Math.round(i1 / columns) + Math.round(i2 / columns)) / 2]
  );
}
function waffleRowCentroid(i1, i2, columns) {
  const c3 = Math.floor(i2) - Math.floor(i1);
  return c3 === 0 ? (
    // Single cell
    [Math.floor(i1 % columns) + 0.5, Math.floor(i1 / columns) + (i1 + i2) / 2 % 1]
  ) : c3 === 1 ? (
    // Two incomplete cells; use the overlap if large enough; otherwise, use the largest
    i2 % 1 - i1 % 1 > 0.5 ? [Math.ceil(i1 % columns), Math.floor(i2 / columns) + (i1 % 1 + i2 % 1) / 2] : i2 % 1 > 1 - i1 % 1 ? [Math.floor(i2 % columns) + 0.5, Math.floor(i2 / columns) + i2 % 1 / 2] : [Math.floor(i1 % columns) + 0.5, Math.floor(i1 / columns) + (1 + i1 % 1) / 2]
  ) : (
    // At least one full cell; take the midpoint
    [
      Math.ceil(i1 % columns) + Math.ceil(Math.floor(i2) - Math.ceil(i1)) / 2,
      Math.floor(i1 / columns) + (i2 >= 1 + i1 ? 0.5 : (i1 + i2) / 2 % 1)
    ]
  );
}
function maybeRound(round3) {
  if (round3 === void 0 || round3 === false) return Number;
  if (round3 === true) return Math.round;
  if (typeof round3 !== "function") throw new Error(`invalid round: ${round3}`);
  return round3;
}
function maybeMultiple(multiple) {
  return multiple === void 0 ? void 0 : Math.max(1, Math.floor(multiple));
}
function scaleof({ domain, range: range3 }) {
  return spread(range3) / spread(domain);
}
function spread(domain) {
  const [min3, max2] = extent(domain);
  return max2 - min3;
}
function waffleX(data, { tip: tip2, ...options } = {}) {
  if (!hasXY(options)) options = { ...options, y: indexOf, x2: identity$13 };
  return new WaffleX(data, { tip: waffleTip(tip2), ...maybeStackX(maybeIntervalX(maybeIdentityX(options))) });
}
function waffleY(data, { tip: tip2, ...options } = {}) {
  if (!hasXY(options)) options = { ...options, x: indexOf, y2: identity$13 };
  return new WaffleY(data, { tip: waffleTip(tip2), ...maybeStackY(maybeIntervalY(maybeIdentityY(options))) });
}
function waffleTip(tip2) {
  return tip2 === true ? { maxRadius: Infinity } : isObject(tip2) && tip2.maxRadius === void 0 ? { ...tip2, maxRadius: Infinity } : void 0;
}
function getDefaultExportFromCjs(x2) {
  return x2 && x2.__esModule && Object.prototype.hasOwnProperty.call(x2, "default") ? x2["default"] : x2;
}
var searchBounds;
var hasRequiredSearchBounds;
function requireSearchBounds() {
  if (hasRequiredSearchBounds) return searchBounds;
  hasRequiredSearchBounds = 1;
  function ge(a2, y2, c3, l, h) {
    var i = h + 1;
    while (l <= h) {
      var m = l + h >>> 1, x2 = a2[m];
      var p = c3 !== void 0 ? c3(x2, y2) : x2 - y2;
      if (p >= 0) {
        i = m;
        h = m - 1;
      } else {
        l = m + 1;
      }
    }
    return i;
  }
  function gt(a2, y2, c3, l, h) {
    var i = h + 1;
    while (l <= h) {
      var m = l + h >>> 1, x2 = a2[m];
      var p = c3 !== void 0 ? c3(x2, y2) : x2 - y2;
      if (p > 0) {
        i = m;
        h = m - 1;
      } else {
        l = m + 1;
      }
    }
    return i;
  }
  function lt(a2, y2, c3, l, h) {
    var i = l - 1;
    while (l <= h) {
      var m = l + h >>> 1, x2 = a2[m];
      var p = c3 !== void 0 ? c3(x2, y2) : x2 - y2;
      if (p < 0) {
        i = m;
        l = m + 1;
      } else {
        h = m - 1;
      }
    }
    return i;
  }
  function le(a2, y2, c3, l, h) {
    var i = l - 1;
    while (l <= h) {
      var m = l + h >>> 1, x2 = a2[m];
      var p = c3 !== void 0 ? c3(x2, y2) : x2 - y2;
      if (p <= 0) {
        i = m;
        l = m + 1;
      } else {
        h = m - 1;
      }
    }
    return i;
  }
  function eq(a2, y2, c3, l, h) {
    while (l <= h) {
      var m = l + h >>> 1, x2 = a2[m];
      var p = c3 !== void 0 ? c3(x2, y2) : x2 - y2;
      if (p === 0) {
        return m;
      }
      if (p <= 0) {
        l = m + 1;
      } else {
        h = m - 1;
      }
    }
    return -1;
  }
  function norm(a2, y2, c3, l, h, f) {
    if (typeof c3 === "function") {
      return f(a2, y2, c3, l === void 0 ? 0 : l | 0, h === void 0 ? a2.length - 1 : h | 0);
    }
    return f(a2, y2, void 0, c3 === void 0 ? 0 : c3 | 0, l === void 0 ? a2.length - 1 : l | 0);
  }
  searchBounds = {
    ge: function(a2, y2, c3, l, h) {
      return norm(a2, y2, c3, l, h, ge);
    },
    gt: function(a2, y2, c3, l, h) {
      return norm(a2, y2, c3, l, h, gt);
    },
    lt: function(a2, y2, c3, l, h) {
      return norm(a2, y2, c3, l, h, lt);
    },
    le: function(a2, y2, c3, l, h) {
      return norm(a2, y2, c3, l, h, le);
    },
    eq: function(a2, y2, c3, l, h) {
      return norm(a2, y2, c3, l, h, eq);
    }
  };
  return searchBounds;
}
var intervalTree;
var hasRequiredIntervalTree;
function requireIntervalTree() {
  if (hasRequiredIntervalTree) return intervalTree;
  hasRequiredIntervalTree = 1;
  var bounds = requireSearchBounds();
  var NOT_FOUND = 0;
  var SUCCESS = 1;
  var EMPTY = 2;
  intervalTree = createWrapper;
  function IntervalTreeNode(mid2, left2, right2, leftPoints, rightPoints) {
    this.mid = mid2;
    this.left = left2;
    this.right = right2;
    this.leftPoints = leftPoints;
    this.rightPoints = rightPoints;
    this.count = (left2 ? left2.count : 0) + (right2 ? right2.count : 0) + leftPoints.length;
  }
  var proto = IntervalTreeNode.prototype;
  function copy2(a2, b) {
    a2.mid = b.mid;
    a2.left = b.left;
    a2.right = b.right;
    a2.leftPoints = b.leftPoints;
    a2.rightPoints = b.rightPoints;
    a2.count = b.count;
  }
  function rebuild(node, intervals) {
    var ntree = createIntervalTree(intervals);
    node.mid = ntree.mid;
    node.left = ntree.left;
    node.right = ntree.right;
    node.leftPoints = ntree.leftPoints;
    node.rightPoints = ntree.rightPoints;
    node.count = ntree.count;
  }
  function rebuildWithInterval(node, interval) {
    var intervals = node.intervals([]);
    intervals.push(interval);
    rebuild(node, intervals);
  }
  function rebuildWithoutInterval(node, interval) {
    var intervals = node.intervals([]);
    var idx = intervals.indexOf(interval);
    if (idx < 0) {
      return NOT_FOUND;
    }
    intervals.splice(idx, 1);
    rebuild(node, intervals);
    return SUCCESS;
  }
  proto.intervals = function(result) {
    result.push.apply(result, this.leftPoints);
    if (this.left) {
      this.left.intervals(result);
    }
    if (this.right) {
      this.right.intervals(result);
    }
    return result;
  };
  proto.insert = function(interval) {
    var weight = this.count - this.leftPoints.length;
    this.count += 1;
    if (interval[1] < this.mid) {
      if (this.left) {
        if (4 * (this.left.count + 1) > 3 * (weight + 1)) {
          rebuildWithInterval(this, interval);
        } else {
          this.left.insert(interval);
        }
      } else {
        this.left = createIntervalTree([interval]);
      }
    } else if (interval[0] > this.mid) {
      if (this.right) {
        if (4 * (this.right.count + 1) > 3 * (weight + 1)) {
          rebuildWithInterval(this, interval);
        } else {
          this.right.insert(interval);
        }
      } else {
        this.right = createIntervalTree([interval]);
      }
    } else {
      var l = bounds.ge(this.leftPoints, interval, compareBegin);
      var r = bounds.ge(this.rightPoints, interval, compareEnd);
      this.leftPoints.splice(l, 0, interval);
      this.rightPoints.splice(r, 0, interval);
    }
  };
  proto.remove = function(interval) {
    var weight = this.count - this.leftPoints;
    if (interval[1] < this.mid) {
      if (!this.left) {
        return NOT_FOUND;
      }
      var rw = this.right ? this.right.count : 0;
      if (4 * rw > 3 * (weight - 1)) {
        return rebuildWithoutInterval(this, interval);
      }
      var r = this.left.remove(interval);
      if (r === EMPTY) {
        this.left = null;
        this.count -= 1;
        return SUCCESS;
      } else if (r === SUCCESS) {
        this.count -= 1;
      }
      return r;
    } else if (interval[0] > this.mid) {
      if (!this.right) {
        return NOT_FOUND;
      }
      var lw = this.left ? this.left.count : 0;
      if (4 * lw > 3 * (weight - 1)) {
        return rebuildWithoutInterval(this, interval);
      }
      var r = this.right.remove(interval);
      if (r === EMPTY) {
        this.right = null;
        this.count -= 1;
        return SUCCESS;
      } else if (r === SUCCESS) {
        this.count -= 1;
      }
      return r;
    } else {
      if (this.count === 1) {
        if (this.leftPoints[0] === interval) {
          return EMPTY;
        } else {
          return NOT_FOUND;
        }
      }
      if (this.leftPoints.length === 1 && this.leftPoints[0] === interval) {
        if (this.left && this.right) {
          var p = this;
          var n = this.left;
          while (n.right) {
            p = n;
            n = n.right;
          }
          if (p === this) {
            n.right = this.right;
          } else {
            var l = this.left;
            var r = this.right;
            p.count -= n.count;
            p.right = n.left;
            n.left = l;
            n.right = r;
          }
          copy2(this, n);
          this.count = (this.left ? this.left.count : 0) + (this.right ? this.right.count : 0) + this.leftPoints.length;
        } else if (this.left) {
          copy2(this, this.left);
        } else {
          copy2(this, this.right);
        }
        return SUCCESS;
      }
      for (var l = bounds.ge(this.leftPoints, interval, compareBegin); l < this.leftPoints.length; ++l) {
        if (this.leftPoints[l][0] !== interval[0]) {
          break;
        }
        if (this.leftPoints[l] === interval) {
          this.count -= 1;
          this.leftPoints.splice(l, 1);
          for (var r = bounds.ge(this.rightPoints, interval, compareEnd); r < this.rightPoints.length; ++r) {
            if (this.rightPoints[r][1] !== interval[1]) {
              break;
            } else if (this.rightPoints[r] === interval) {
              this.rightPoints.splice(r, 1);
              return SUCCESS;
            }
          }
        }
      }
      return NOT_FOUND;
    }
  };
  function reportLeftRange(arr, hi, cb) {
    for (var i = 0; i < arr.length && arr[i][0] <= hi; ++i) {
      var r = cb(arr[i]);
      if (r) {
        return r;
      }
    }
  }
  function reportRightRange(arr, lo, cb) {
    for (var i = arr.length - 1; i >= 0 && arr[i][1] >= lo; --i) {
      var r = cb(arr[i]);
      if (r) {
        return r;
      }
    }
  }
  function reportRange(arr, cb) {
    for (var i = 0; i < arr.length; ++i) {
      var r = cb(arr[i]);
      if (r) {
        return r;
      }
    }
  }
  proto.queryPoint = function(x2, cb) {
    if (x2 < this.mid) {
      if (this.left) {
        var r = this.left.queryPoint(x2, cb);
        if (r) {
          return r;
        }
      }
      return reportLeftRange(this.leftPoints, x2, cb);
    } else if (x2 > this.mid) {
      if (this.right) {
        var r = this.right.queryPoint(x2, cb);
        if (r) {
          return r;
        }
      }
      return reportRightRange(this.rightPoints, x2, cb);
    } else {
      return reportRange(this.leftPoints, cb);
    }
  };
  proto.queryInterval = function(lo, hi, cb) {
    if (lo < this.mid && this.left) {
      var r = this.left.queryInterval(lo, hi, cb);
      if (r) {
        return r;
      }
    }
    if (hi > this.mid && this.right) {
      var r = this.right.queryInterval(lo, hi, cb);
      if (r) {
        return r;
      }
    }
    if (hi < this.mid) {
      return reportLeftRange(this.leftPoints, hi, cb);
    } else if (lo > this.mid) {
      return reportRightRange(this.rightPoints, lo, cb);
    } else {
      return reportRange(this.leftPoints, cb);
    }
  };
  function compareNumbers(a2, b) {
    return a2 - b;
  }
  function compareBegin(a2, b) {
    var d = a2[0] - b[0];
    if (d) {
      return d;
    }
    return a2[1] - b[1];
  }
  function compareEnd(a2, b) {
    var d = a2[1] - b[1];
    if (d) {
      return d;
    }
    return a2[0] - b[0];
  }
  function createIntervalTree(intervals) {
    if (intervals.length === 0) {
      return null;
    }
    var pts = [];
    for (var i = 0; i < intervals.length; ++i) {
      pts.push(intervals[i][0], intervals[i][1]);
    }
    pts.sort(compareNumbers);
    var mid2 = pts[pts.length >> 1];
    var leftIntervals = [];
    var rightIntervals = [];
    var centerIntervals = [];
    for (var i = 0; i < intervals.length; ++i) {
      var s2 = intervals[i];
      if (s2[1] < mid2) {
        leftIntervals.push(s2);
      } else if (mid2 < s2[0]) {
        rightIntervals.push(s2);
      } else {
        centerIntervals.push(s2);
      }
    }
    var leftPoints = centerIntervals;
    var rightPoints = centerIntervals.slice();
    leftPoints.sort(compareBegin);
    rightPoints.sort(compareEnd);
    return new IntervalTreeNode(
      mid2,
      createIntervalTree(leftIntervals),
      createIntervalTree(rightIntervals),
      leftPoints,
      rightPoints
    );
  }
  function IntervalTree2(root2) {
    this.root = root2;
  }
  var tproto = IntervalTree2.prototype;
  tproto.insert = function(interval) {
    if (this.root) {
      this.root.insert(interval);
    } else {
      this.root = new IntervalTreeNode(interval[0], null, null, [interval], [interval]);
    }
  };
  tproto.remove = function(interval) {
    if (this.root) {
      var r = this.root.remove(interval);
      if (r === EMPTY) {
        this.root = null;
      }
      return r !== NOT_FOUND;
    }
    return false;
  };
  tproto.queryPoint = function(p, cb) {
    if (this.root) {
      return this.root.queryPoint(p, cb);
    }
  };
  tproto.queryInterval = function(lo, hi, cb) {
    if (lo <= hi && this.root) {
      return this.root.queryInterval(lo, hi, cb);
    }
  };
  Object.defineProperty(tproto, "count", {
    get: function() {
      if (this.root) {
        return this.root.count;
      }
      return 0;
    }
  });
  Object.defineProperty(tproto, "intervals", {
    get: function() {
      if (this.root) {
        return this.root.intervals([]);
      }
      return [];
    }
  });
  function createWrapper(intervals) {
    if (!intervals || intervals.length === 0) {
      return new IntervalTree2(null);
    }
    return new IntervalTree2(createIntervalTree(intervals));
  }
  return intervalTree;
}
var intervalTreeExports = requireIntervalTree();
var IntervalTree = /* @__PURE__ */ getDefaultExportFromCjs(intervalTreeExports);
var anchorXLeft = ({ marginLeft }) => [1, marginLeft];
var anchorXRight = ({ width, marginRight }) => [-1, width - marginRight];
var anchorXMiddle = ({ width, marginLeft, marginRight }) => [0, (marginLeft + width - marginRight) / 2];
var anchorYTop = ({ marginTop }) => [1, marginTop];
var anchorYBottom = ({ height, marginBottom }) => [-1, height - marginBottom];
var anchorYMiddle = ({ height, marginTop, marginBottom }) => [0, (marginTop + height - marginBottom) / 2];
function maybeAnchor(anchor) {
  return typeof anchor === "string" ? { anchor } : anchor;
}
function dodgeX(dodgeOptions = {}, options = {}) {
  if (arguments.length === 1) [dodgeOptions, options] = mergeOptions(dodgeOptions);
  let { anchor = "left", padding = 1, r = options.r } = maybeAnchor(dodgeOptions);
  switch (`${anchor}`.toLowerCase()) {
    case "left":
      anchor = anchorXLeft;
      break;
    case "right":
      anchor = anchorXRight;
      break;
    case "middle":
      anchor = anchorXMiddle;
      break;
    default:
      throw new Error(`unknown dodge anchor: ${anchor}`);
  }
  return dodge("x", "y", anchor, number$12(padding), r, options);
}
function dodgeY(dodgeOptions = {}, options = {}) {
  if (arguments.length === 1) [dodgeOptions, options] = mergeOptions(dodgeOptions);
  let { anchor = "bottom", padding = 1, r = options.r } = maybeAnchor(dodgeOptions);
  switch (`${anchor}`.toLowerCase()) {
    case "top":
      anchor = anchorYTop;
      break;
    case "bottom":
      anchor = anchorYBottom;
      break;
    case "middle":
      anchor = anchorYMiddle;
      break;
    default:
      throw new Error(`unknown dodge anchor: ${anchor}`);
  }
  return dodge("y", "x", anchor, number$12(padding), r, options);
}
function mergeOptions(options) {
  const { anchor, padding, ...rest } = options;
  const { r } = rest;
  return [{ anchor, padding, r }, rest];
}
function dodge(y2, x2, anchor, padding, r, options) {
  if (r != null && typeof r !== "number") {
    let { channels, sort: sort3, reverse: reverse3 } = options;
    channels = maybeNamed(channels);
    if (channels?.r === void 0) options = { ...options, channels: { ...channels, r: { value: r, scale: "r" } } };
    if (sort3 === void 0 && reverse3 === void 0) options.sort = { channel: "-r" };
  }
  return initializer(options, function(data, facets, channels, scales, dimensions, context) {
    let { [x2]: X, r: R } = channels;
    if (!channels[x2]) throw new Error(`missing channel: ${x2}`);
    ({ [x2]: X } = applyPosition(channels, scales, context));
    const cr = R ? void 0 : r !== void 0 ? number$12(r) : this.r !== void 0 ? this.r : 3;
    if (R) R = valueof(R.value, scales[R.scale] || identity$13, Float64Array);
    let [ky2, ty] = anchor(dimensions);
    const compare = ky2 ? compareAscending : compareSymmetric;
    const Y = new Float64Array(X.length);
    const radius2 = R ? (i) => R[i] : () => cr;
    for (let I of facets) {
      const tree3 = IntervalTree();
      I = I.filter(R ? (i) => finite$1(X[i]) && positive(R[i]) : cr > 0 ? (i) => finite$1(X[i]) : () => false);
      const intervals = new Float64Array(2 * I.length + 2);
      for (const i of I) {
        const ri = radius2(i);
        const y02 = ky2 ? ri + padding : 0;
        const l = X[i] - ri;
        const h = X[i] + ri;
        let k2 = 2;
        tree3.queryInterval(l - padding, h + padding, ([, , j]) => {
          const yj = Y[j] - y02;
          const dx = X[i] - X[j];
          const dr = padding + (R ? R[i] + R[j] : 2 * cr);
          const dy = Math.sqrt(dr * dr - dx * dx);
          intervals[k2++] = yj - dy;
          intervals[k2++] = yj + dy;
        });
        let candidates = intervals.slice(0, k2);
        if (ky2) candidates = candidates.filter((y3) => y3 >= 0);
        out: for (const y3 of candidates.sort(compare)) {
          for (let j = 0; j < k2; j += 2) {
            if (intervals[j] + 1e-6 < y3 && y3 < intervals[j + 1] - 1e-6) {
              continue out;
            }
          }
          Y[i] = y3 + y02;
          break;
        }
        tree3.insert([l, h, i]);
      }
    }
    if (!ky2) ky2 = 1;
    for (const I of facets) {
      for (const i of I) {
        Y[i] = Y[i] * ky2 + ty;
      }
    }
    return {
      data,
      facets,
      channels: {
        [y2]: { value: Y, source: null },
        // don’t show in tooltip
        [x2]: { value: X, source: channels[x2] },
        ...R && { r: { value: R, source: channels.r } }
      }
    };
  });
}
function compareSymmetric(a2, b) {
  return Math.abs(a2) - Math.abs(b);
}
function compareAscending(a2, b) {
  return a2 - b;
}
function normalizeX(basis3, options) {
  if (arguments.length === 1) ({ basis: basis3, ...options } = basis3);
  return mapX(normalize3(basis3), options);
}
function normalizeY(basis3, options) {
  if (arguments.length === 1) ({ basis: basis3, ...options } = basis3);
  return mapY(normalize3(basis3), options);
}
function normalize3(basis3) {
  if (basis3 === void 0) return normalizeFirst;
  if (typeof basis3 === "function") return normalizeBasis(taker(basis3));
  if (/^p\d{2}$/i.test(basis3)) return normalizeAccessor(percentile(basis3));
  switch (`${basis3}`.toLowerCase()) {
    case "deviation":
      return normalizeDeviation;
    case "first":
      return normalizeFirst;
    case "last":
      return normalizeLast;
    case "max":
      return normalizeMax;
    case "mean":
      return normalizeMean;
    case "median":
      return normalizeMedian;
    case "min":
      return normalizeMin;
    case "sum":
      return normalizeSum;
    case "extent":
      return normalizeExtent;
  }
  throw new Error(`invalid basis: ${basis3}`);
}
function normalizeBasis(basis3) {
  return {
    mapIndex(I, S, T) {
      const b = +basis3(I, S);
      for (const i of I) {
        T[i] = S[i] === null ? NaN : S[i] / b;
      }
    }
  };
}
function normalizeAccessor(f) {
  return normalizeBasis((I, S) => f(I, (i) => S[i]));
}
var normalizeExtent = {
  mapIndex(I, S, T) {
    const [s1, s2] = extent(I, (i) => S[i]);
    const d = s2 - s1;
    for (const i of I) {
      T[i] = S[i] === null ? NaN : (S[i] - s1) / d;
    }
  }
};
var normalizeFirst = normalizeBasis((I, S) => {
  for (let i = 0; i < I.length; ++i) {
    const s2 = S[I[i]];
    if (defined(s2)) return s2;
  }
});
var normalizeLast = normalizeBasis((I, S) => {
  for (let i = I.length - 1; i >= 0; --i) {
    const s2 = S[I[i]];
    if (defined(s2)) return s2;
  }
});
var normalizeDeviation = {
  mapIndex(I, S, T) {
    const m = mean(I, (i) => S[i]);
    const d = deviation(I, (i) => S[i]);
    for (const i of I) {
      T[i] = S[i] === null ? NaN : d ? (S[i] - m) / d : 0;
    }
  }
};
var normalizeMax = normalizeAccessor(max);
var normalizeMean = normalizeAccessor(mean);
var normalizeMedian = normalizeAccessor(median);
var normalizeMin = normalizeAccessor(min);
var normalizeSum = normalizeAccessor(sum);
function shiftX(interval, options) {
  return shiftK("x", interval, options);
}
function shiftY(interval, options) {
  return shiftK("y", interval, options);
}
function shiftK(x2, interval, options = {}) {
  let offset2;
  let k2 = 1;
  if (typeof interval === "number") {
    k2 = interval;
    offset2 = (x3, k3) => +x3 + k3;
  } else {
    if (typeof interval === "string") {
      const sign3 = interval.startsWith("-") ? -1 : 1;
      [interval, k2] = parseTimeInterval(interval.replace(/^[+-]/, ""));
      k2 *= sign3;
    }
    interval = maybeInterval(interval);
    offset2 = (x3, k3) => interval.offset(x3, k3);
  }
  const x12 = `${x2}1`;
  const x22 = `${x2}2`;
  const mapped = map2(
    {
      [x12]: (D3) => D3.map((d) => offset2(d, k2)),
      [x22]: (D3) => D3
    },
    options
  );
  const t = mapped[x22].transform;
  mapped[x22].transform = () => {
    const V = t();
    const [x02, x13] = extent(V);
    V.domain = k2 < 0 ? [x02, offset2(x13, k2)] : [offset2(x02, k2), x13];
    return V;
  };
  return mapped;
}
function select2(selector2, options = {}) {
  if (typeof selector2 === "string") {
    switch (selector2.toLowerCase()) {
      case "first":
        return selectFirst(options);
      case "last":
        return selectLast(options);
    }
  }
  if (typeof selector2 === "function") {
    return selectChannel(null, selector2, options);
  }
  let key, value2;
  for (key in selector2) {
    if (value2 !== void 0) throw new Error("ambiguous selector; multiple inputs");
    value2 = maybeSelector(selector2[key]);
  }
  if (value2 === void 0) throw new Error(`invalid selector: ${selector2}`);
  return selectChannel(key, value2, options);
}
function maybeSelector(selector2) {
  if (typeof selector2 === "function") return selector2;
  switch (`${selector2}`.toLowerCase()) {
    case "min":
      return selectorMin;
    case "max":
      return selectorMax;
  }
  throw new Error(`unknown selector: ${selector2}`);
}
function selectFirst(options) {
  return selectChannel(null, selectorFirst, options);
}
function selectLast(options) {
  return selectChannel(null, selectorLast, options);
}
function selectMinX(options) {
  return selectChannel("x", selectorMin, options);
}
function selectMinY(options) {
  return selectChannel("y", selectorMin, options);
}
function selectMaxX(options) {
  return selectChannel("x", selectorMax, options);
}
function selectMaxY(options) {
  return selectChannel("y", selectorMax, options);
}
function* selectorFirst(I) {
  yield I[0];
}
function* selectorLast(I) {
  yield I[I.length - 1];
}
function* selectorMin(I, X) {
  yield least(I, (i) => X[i]);
}
function* selectorMax(I, X) {
  yield greatest(I, (i) => X[i]);
}
function selectChannel(v, selector2, options) {
  if (v != null) {
    if (options[v] == null) throw new Error(`missing channel: ${v}`);
    v = options[v];
  }
  const z = maybeZ(options);
  return basic(options, (data, facets) => {
    const Z = valueof(data, z);
    const V = valueof(data, v);
    const selectFacets = [];
    for (const facet of facets) {
      const selectFacet = [];
      for (const I of Z ? group(facet, (i) => Z[i]).values() : [facet]) {
        for (const i of selector2(I, V)) {
          selectFacet.push(i);
        }
      }
      selectFacets.push(selectFacet);
    }
    return { data, facets: selectFacets };
  });
}
export {
  Area,
  Arrow,
  BarX,
  BarY,
  Cell,
  Contour,
  Density,
  Dot,
  Frame,
  Geo,
  Hexgrid,
  Image,
  Line,
  Link,
  Mark,
  Raster,
  Rect,
  RuleX,
  RuleY,
  Text,
  TickX,
  TickY,
  Tip,
  Vector,
  WaffleX,
  WaffleY,
  area3 as area,
  areaX,
  areaY,
  arrow,
  auto,
  autoSpec,
  axisFx,
  axisFy,
  axisX,
  axisY,
  barX,
  barY,
  bin,
  binX,
  binY,
  bollinger,
  bollingerX,
  bollingerY,
  boxX,
  boxY,
  cell,
  cellX,
  cellY,
  centroid2 as centroid,
  circle2 as circle,
  cluster2 as cluster,
  column,
  contour,
  crosshair,
  crosshairX,
  crosshairY,
  delaunayLink,
  delaunayMesh,
  density2 as density,
  differenceX,
  differenceY,
  dodgeX,
  dodgeY,
  dot,
  dotX,
  dotY,
  filter2 as filter,
  find2 as find,
  formatIsoDate,
  formatMonth,
  formatNumber,
  formatWeekday,
  frame,
  geo,
  geoCentroid,
  graticule2 as graticule,
  gridFx,
  gridFy,
  gridX,
  gridY,
  group2 as group,
  groupX,
  groupY,
  groupZ$1 as groupZ,
  hexagon,
  hexbin,
  hexgrid,
  hull,
  identity$13 as identity,
  image,
  indexOf,
  initializer,
  interpolateNearest,
  interpolateNone,
  interpolatorBarycentric,
  interpolatorRandomWalk,
  legend,
  line2 as line,
  lineX,
  lineY,
  linearRegressionX,
  linearRegressionY,
  link2 as link,
  map2 as map,
  mapX,
  mapY,
  marks,
  normalize3 as normalize,
  normalizeX,
  normalizeY,
  numberInterval,
  plot,
  pointer2 as pointer,
  pointerX,
  pointerY,
  raster,
  rect,
  rectX,
  rectY,
  reverse2 as reverse,
  ruleX,
  ruleY,
  scale,
  select2 as select,
  selectFirst,
  selectLast,
  selectMaxX,
  selectMaxY,
  selectMinX,
  selectMinY,
  shiftX,
  shiftY,
  shuffle2 as shuffle,
  sort2 as sort,
  sphere,
  spike,
  stackX,
  stackX1,
  stackX2,
  stackY,
  stackY1,
  stackY2,
  text,
  textX,
  textY,
  tickX,
  tickY,
  timeInterval2 as timeInterval,
  tip,
  basic as transform,
  tree2 as tree,
  treeLink,
  treeNode,
  utcInterval,
  valueof,
  vector,
  vectorX,
  vectorY,
  version,
  voronoi,
  voronoiMesh,
  waffleX,
  waffleY,
  window$1 as window,
  windowX,
  windowY
};
