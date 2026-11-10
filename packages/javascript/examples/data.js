/** Invented local observations. Times are hours; temperatures are Celsius. */
export const deliveries = ["North", "Central", "South"].flatMap((route, i) =>
  [1, 2, 3, 4, 5, 6].map((week, j) => ({
    route,
    week,
    hours:
      route === "Central" && week === 3
        ? null
        : [2.2, 2.6, 2.4, 2.1, 1.8, 1.9][j] + i * 2.3,
  })),
);
export const sensors = Array.from({ length: 18 }, (_, i) => ({
  temperature: 12 + i,
  load: 20 + (i % 6) * 5 + Math.floor(i / 6) * 2,
  energy: i === 5 ? null : 10 + i * 3,
}));
export const changes = Array.from({ length: 12 }, (_, i) => ({
  x1: i % 4,
  x2: (i % 4) + 1,
  y1: Math.floor(i / 4),
  y2: Math.floor(i / 4) + 1,
  change: i === 5 ? null : [-2, -1, 0, 2, 1, null, 4, 6, -1, 0, 3, 8][i],
}));
