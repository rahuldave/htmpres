# Illustrative room deviations from a 20 C target. NA does not mean zero.
library(plotfoundry)
library(ggplot2)
rooms <- c("Reading", "Meeting", "Studio")
s <- pf_theme("litera-reading", mode = "light", profile = "reading")
# pf_heatmap takes a matrix with its first row at the top.
values <- matrix(c(-2, -1, 0, 1, 0, NA, 2, 3, -1, 0, 3, 5),
                 nrow = 3, byrow = TRUE)
layers <- pf_heatmap(values, s, vmin = -2, vmax = 5,
                     kind = "diverging", center = 0)
p <- ggplot() + layers + pf_theme_gg(s) +
  scale_x_continuous(breaks = 1:4, labels = paste("Day", 1:4)) +
  scale_y_reverse(breaks = 1:3, labels = rooms) +
  labs(title = "Temperature relative to 20 C", x = NULL, y = NULL,
       fill = "Deviation\n(C)")
pf_export(s, "r-temperature", plot = p, height_inches = 4.8, dpi = 80)
