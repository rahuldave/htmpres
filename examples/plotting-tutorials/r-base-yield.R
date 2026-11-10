# The same illustrative trial, drawn with native base graphics helpers.
library(plotfoundry)
trial <- data.frame(
  year = rep(2021:2025, 3),
  yield_t_ha = c(3.2, 3.4, 3.3, 3.6, 3.7,
                 4.0, 4.1, NA, 4.3, 4.5,
                 4.4, 4.6, 4.5, 4.8, 4.9),
  irrigation = rep(c("Rainfed", "Drip", "Sprinkler"), each = 5)
)
s <- pf_theme("tufte", mode = "light", profile = "reading")
pf_export(s, "r-base-yield", height_inches = 4.8, dpi = 80,
  draw = function(style) {
    pf_base_plot(style, c(2020.8, 2026.4), c(2.5, 5.5),
                 "Year", "Yield (tonnes/ha)", "Irrigation and crop yield")
    pf_base_lines(trial$year, trial$yield_t_ha, trial$irrigation, style,
                  domain = c("Rainfed", "Drip", "Sprinkler"))
  })
