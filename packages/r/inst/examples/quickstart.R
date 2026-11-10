library(plotfoundry)
s <- pf_theme("folio", mode = "dark")
d <- data.frame(x = rep(1:3, 3), y = c(1, 2, 1, 3, 4, 3, 5, 6, 5), category = rep(c("A", "B", "C"), each = 3))
p <- ggplot2::ggplot() + pf_line(d, "x", "y", "category", s, c("A", "B", "C")) + pf_theme_gg(s) + ggplot2::labs(title = "Observations",
    x = "Time", y = "Value")
pf_export(s, "plotfoundry-example", plot = p)
