# Illustrative stream samples. One nitrate measurement is unavailable.
library(plotfoundry)
library(ggplot2)
samples <- data.frame(
  day = rep(1:4, 2),
  discharge_l_s = c(20, 25, 28, 32, 18, 22, 26, 30),
  nitrate_mg_l = c(2, 3, NA, 5, 4, 6, 8, 10),
  location = rep(c("Upstream", "Downstream"), each = 4)
)
samples$location <- factor(samples$location, levels = c("Upstream", "Downstream"))
# Keep the missing row in the source; explicitly omit it from this native plot.
visible <- samples[complete.cases(samples), ]
s <- pf_theme("atelier", mode = "light", profile = "reading")
p <- ggplot(visible, aes(day, discharge_l_s, fill = nitrate_mg_l)) +
  geom_point(size = pf_mm(s, 7),
             stroke = pf_mm(s, 1), shape = 21, colour = s$case$roles$ink) +
  facet_wrap(~location, nrow = 1) +
  pf_scale_continuous(s, vmin = 0, vmax = 12, aesthetics = "fill") +
  pf_theme_gg(s) +
  scale_x_continuous(breaks = 1:4) +
  labs(title = "Nitrate along the stream", x = "Sampling day",
       y = "Discharge (L/s)", fill = "Nitrate\n(mg/L)")
pf_export(s, "r-nitrate", plot = p, height_inches = 5, dpi = 80)
