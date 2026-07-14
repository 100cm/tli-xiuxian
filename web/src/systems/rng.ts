/** 可复现的 mulberry32 */
export function createRng(seed: number) {
  let s = seed >>> 0
  return {
    next(): number {
      s += 0x6d2b79f5
      let t = s
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    },
    int(min: number, max: number): number {
      return min + Math.floor(this.next() * (max - min + 1))
    },
    pick<T>(arr: T[]): T {
      return arr[Math.floor(this.next() * arr.length)]
    },
    weighted<T extends { weight: number }>(arr: T[]): T {
      const total = arr.reduce((a, b) => a + b.weight, 0)
      let r = this.next() * total
      for (const item of arr) {
        r -= item.weight
        if (r <= 0) return item
      }
      return arr[arr.length - 1]
    },
    shuffle<T>(arr: T[]): T[] {
      const a = [...arr]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(this.next() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    },
  }
}

export type Rng = ReturnType<typeof createRng>

export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0
}
