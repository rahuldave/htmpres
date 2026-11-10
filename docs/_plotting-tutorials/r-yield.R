# Illustrative trial yields, not observations from a real farming experiment.
library(plotfoundry)
library(ggplot2)
trial <- data.frame(
  year = rep(2021:2025, 3),
  yield_t_ha = c(3.2, 3.4, 3.3, 3.6, 3.7,
                 4.0, 4.1, NA, 4.3, 4.5,
                 4.4, 4.6, 4.5, 4.8, 4.9),
  irrigation = rep(c("Rainfed", "Drip", "Sprinkler"), each = 5)
)
s <- pf_theme("folio", mode = "light", profile = "reading")
p <- ggplot() +
  pf_line(trial, "year", "yield_t_ha", "irrigation", s,
          domain = c("Rainfed", "Drip", "Sprinkler")) +
  pf_theme_gg(s) +
  scale_x_continuous(breaks = 2021:2025, limits = c(2020.8, 2026.2)) +
  scale_y_continuous(limits = c(2.5, 5.5)) +
  labs(title = "Irrigation and crop yield",
       x = "Year", y = "Yield (tonnes/ha)")
pf_export(s, "r-yield", plot = p, height_inches = 4.8, dpi = 80)
