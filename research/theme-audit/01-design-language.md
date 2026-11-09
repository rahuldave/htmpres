# 1. Which themes have a coherent design language?

**Decision draft · 9 November 2026 · no production theme changes**

Folio, Atelier and Nocturne are the strongest complete light/dark identities in
the current htmpres adapter. Atelier is the most promising general presentation
base; Folio and Nocturne offer more distinctive editorial voices. Tufte is a
valuable restrained alternative, but the surrounding card-and-shadow slide UI
does not yet express its philosophy. All five Reading themes deserve the same
depth of investigation: their native modes are good candidates, while their
derived complementary modes need specific repairs.

This is the first of three linked decisions. [Part 2](02-presentation-color.md)
tests these judgments against Schwabish's visual presentation guidance.
[Part 3](03-scientific-palettes.md) tests scientific color systems for all nine
priority themes. These are recommendations for selection, not an approved redesign.

## What is actually being reviewed

The current catalog contains **35 paired themes / 70 modes**, not 32: Bootstrap,
25 Bootswatch themes, Folio, Atelier, Nocturne, five Reading refinements, and
Tufte. The three older unpaired seeds, Sage, Mono Grid and Blank, are outside
this paired-theme audit. Thus the CLI's 38 names and this report's 35 pairs
describe different scopes. Archived original/refined designs in Elegant are
also not extra htmpres themes.

The unit of assessment is the **current htmpres rendering**, not an upstream
Bootswatch demo. Its adapter imports palette roles and font stacks, then applies
the same navigation, slide surface, cards, spacing and code system. It does not
import most source component styling, reading widths, margins, buttons or
responsive typography. This explains why many stock themes look similar here,
and why an excellent source documentation theme can still have slide problems.

The four custom/Tufte pairs have designed complementary palettes. Light-native
stock themes use Bootstrap dark variables. Dark-native stock themes and Reading
refinements use htmpres complementary adaptations. Do not count those derived
modes as upstream-designed or inherit the upstream review's scores for them.

## Evidence and review method

The rubric comes from the earlier Elegant review of *Refactoring UI*, checked
against the original 252-page PDF for this pass. The authors did not evaluate
these themes. Its six lenses are:

| Lens | What earns confidence | Source locations in the previously reviewed 252-page edition |
|---|---|---|
| Hierarchy | Size, weight, tone and spacing establish clear priorities without making secondary information unreadable | pp. 36–47, 54–59 |
| Spacing and grouping | Related content is close; section gaps and inner padding have consistent jobs | pp. 66–74, 96–99 |
| Color roles | Text, surfaces, accents and states have distinct readable roles | pp. 42–44, 142–168 |
| Layout and scale | Width and responsive changes fit the content and viewing task | pp. 76–81, 92–95, 114–116 |
| Surfaces and restraint | Edges, shadows and fills explain groups without competing with them | pp. 190–192, 224–241 |
| Personality | Typography, palette and component shape describe the same character | pp. 20–26, 108–112 |

We used the existing [Elegant UI guide](https://rahuldave.com/elegant-themes/ui-design-guide.html)
and [design assessment](https://rahuldave.com/elegant-themes/visual-design-report.html),
including their source-code rubric and disclosed self-review limits. We also
read the original PDF at pp. 20–22, 36–44, 66–68, 142–160 and 162–168, and
visually checked the illustrations at pp. 147, 154 and 164. Remaining page
pointers in the rubric come from the earlier Elegant review. The original is
kept in the ignored sibling `nossaifd-talks/books` folder; no book pages are
redistributed here. The present classifications are our own judgments, and no
numerical aesthetic leaderboard is implied. Source fingerprints are recorded in
[source-manifest.json](results/source-manifest.json).

Fresh evidence comprises the checked-in catalog, its shared adapter, a complete
35-theme renderer smoke run, solid-color measurements for all 70 modes, and nine
browser contact sheets of the same actual rendered slide in all 70 modes.
Atelier was also inspected full size, switched from light to dark, and advanced
to its code slide. Contact sheets establish composition and relative character;
they are not a small-text legibility or interaction audit of every theme.
No physical projector, phone or reader study was used.

The [raw role table](results/theme-roles.csv) reports unrounded calculations.
The numeric screen uses 4.5:1 for normal text on paper/panel/code and 3:1 for
large text only where applicable. These thresholds come from
[WCAG](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), not
Refactoring UI. A ratio is evidence about one color pair, not a whole-theme
accessibility certificate. Borders and decorative surfaces are not normal text.

![Four priority pairs in the actual slide renderer](figures/contact-0.png)

## What the original book adds to this review

Refactoring UI's pp. 142–151 describe a vocabulary of neutral shades, primary
shades and additional semantic colors, anchored to actual uses such as text,
buttons and tinted backgrounds. Page 147 explicitly recognizes that graph
categories can need more accent colors. A five-swatch mood board is therefore
not a sufficient theme specification, and our five aliases collapsing to one
or two colors is a substantive limitation.

The same book recommends keeping those choices finite rather than inventing
another shade for every component. A useful revision would define separate
accent ink, accent fill, focus, context and state roles, then test each on its
allowed surfaces. The dark-text/pale-fill example on p. 164 is particularly
relevant: making every accent darker or brighter cannot solve every role at
once without changing visual emphasis.

Pages 152–157 also show why equal HSL lightness does not mean equal perceived
brightness. Their practical hue/shade adjustments help UI design; they do not
establish that a generated scientific color scale has equal perceptual steps.
Part 3 measures that separately. Pages 166–168 reinforce the need for cues
besides color; chart labels, line styles and symbols belong in the design
contract, not merely in accessibility footnotes.

## Shared problems that theme selection cannot solve

1. **The UI adapts color more than design language.** Every theme gets a rounded,
   shadowed slide and similar cards. This supports consistency for Atelier, but
   makes Tufte less booklike and weakens the distinctive shape systems of stock
   themes. Audit the selected theme's structural variant before editing its hues.
2. **Body copy is often treated as secondary.** The specimen's `.card p` uses
   muted ink. That is a meaningful reading role, not optional decoration. Weak
   muted colors therefore affect ordinary explanations, not just footnotes.
3. **The accent vocabulary overstates its distinctions.** `teal` and `indigo`
   become the same accent; `amber`, `rose` and `violet` become the same secondary.
   Four Reading pairs also set accent equal to secondary. Those aliases cannot
   stand for five categories or five semantic states. Use semantic role names
   and a separate chart cycle in a future change.
4. **Role validation is surface-specific.** Several derived accents were made
   readable against paper but fail the same screen on panels. The light/dark
   pair must be validated as a matrix of roles and surfaces.
5. **Syntax colors are shared across families.** Code keeps its function, but
   its blue/purple/green/yellow/pink grammar can feel imported into Folio or
   Nocturne. A selected family should get a deliberate code and figure policy;
   coloring every token with a brand hue would destroy useful distinctions.
6. **Reading scale is not presentation scale.** In the full-size 1280×720
   Atelier specimen, the title was 37.6px, card headings 18.88px, card text
   16px and code 14.4px. That is evidence about this fixture/layout, not every
   slide. It nevertheless requires a dedicated projected-presentation profile.
7. **Font names are not proof of font delivery.** Custom and Reading families
   bundle local fonts; stock families may fall back if their named typeface is
   absent. Judge the delivered font, and verify fallbacks before attributing
   fine typographic character to a stock font name.

## Detailed review of the nine priority themes

| Theme | Light mode | Dark mode | Design judgment and next decision |
|---|---|---|---|
| **Folio** | Warm paper, green text/accent and restrained rust form a convincing literary family. Display and body serifs have clear roles. | Green-black paper and pale sage retain that family instead of becoming generic charcoal. | **Retain both.** Strong source identity survives adaptation. Reduce the common slide shadow for a more editorial expression; test display-serif readability at projection distance. |
| **Atelier** | Cool near-white, teal-grey text and DM Sans give the clearest technical/studio voice. Quiet panels support grouping. | Blue-green near-black and pale teal preserve the same relationships. | **Primary presentation candidate.** Retain both. Give primary content a stronger role than the current muted card text; tune a presentation scale and chart typography together. |
| **Nocturne** | Pearl-grey with brown and purple is coherent, though less immediately recognizable than its dark counterpart. | Ink-blue, warm brass and literary serif create a distinctive evening palette. | **Retain both; lead with dark as its identity.** Use brass selectively. Review chart/title emphasis together so warm highlights do not compete. |
| **Tufte** | Cream paper and near-black serif are highly restrained; italic headings preserve character. | Neutral near-black/grey is a convincing reading companion. | **Retain as a different philosophy.** The shared shadowed frame and cards work against the identity. Its accent equals ink, so distinguish links by underline and figure emphasis by an explicit optional color. |
| **Zephyr Reading** | Inter, controlled blue and quiet grey-blue panels make a strong modern UI. | The blue-tinted adaptation is coherent in hue; accent-on-panel is only **3.97:1**. | **Retain native light; repair dark before recommendation.** It offers a distinct neutral sans alternative to Atelier, not merely a lesser custom theme. |
| **Simplex Reading** | Open Sans, warm neutrals and deep red form an economical, coherent identity. | Warm dark surfaces preserve character; red-on-panel is **4.13:1**. | **Equal-priority candidate.** Retain light and repair dark. Reserve red branding from negative-data semantics, or use a different chart highlight. |
| **Pulse Reading** | Deep purple, soft lavender panels and system sans are restrained and legible. | Its complementary accent reaches **4.53:1** on paper but **3.90:1** on panel. | **Equal-priority candidate.** Retain light and repair dark. Purple offers a useful identity outside the many blue/teal options. |
| **Litera Reading** | Serif body plus clear sans headings is a useful reading/presentation hybrid. Blue links are much stronger than stock Litera. | Ink-blue adaptation has strong main text, but accent-on-panel is **3.93:1**. | **Retain light; repair dark.** Confirm that prose, lists, captions and chart text maintain intentional font roles rather than inconsistent local overrides. |
| **Darkly Reading** | The complementary blue-grey light palette is restrained and has usable primary text. | Charcoal, Lato and pale blue links form a practical dark UI. The secondary is dark blue: only **1.86:1** on panel. | **Retain dark with a secondary-role repair; retain light as conditional companion.** A dark secondary fill can be useful with suitable text, but it must not be reused as a readable text/line accent. |

The four custom/Tufte identities remain candidates because they provide different
visual purposes, not because they are ours. The same principle keeps Simplex
and Pulse Reading in the detailed experiments. Their native palettes are
arguably cleaner than some more celebrated stock alternatives.

![Reading theme specimens](figures/contact-1.png)

## Complete catalog critique

The judgments below concern the current adaptation. A theme whose source relies
on gradients, unusual borders or special component styling may lose much of
that personality when only its colors and fonts are imported. Every row includes
both modes; the nine priority rows above supply their fuller interpretation.

| Theme | Light-mode critique | Dark-mode critique | Decision for this workstream |
|---|---|---|---|
| Bootstrap | Clear neutral baseline; blue accent is marginal on paper and 4.27 on panel. | Conventional charcoal; readable main accent, less dependable secondary text. | Keep as baseline, not a distinctive finalist. |
| Cerulean | Pleasant blue identity undermined by accent 2.77 on paper and muted panel text 4.01. | Generic Bootstrap structure with a much more readable light blue. | Defer; native light needs substantive contrast work. |
| Cosmo | Calm thin/sans direction, but blue links are 3.97 on paper. | More readable accent, but source typography/shape distinction is diminished. | Defer in favor of Atelier/Zephyr Reading. |
| Cyborg | Clean light adaptation, but blue panel links fall to 4.37. | Severe black surface gives strong contrast but harder outlines and less calm grouping. | Specialist high-contrast character; not a first refinement target. |
| Darkly | Restrained light adaptation; panel accent 4.13. | Strong main text with more conspicuous panel boundaries. | Prefer Darkly Reading for detailed work. |
| Flatly | Familiar clear layout; green link 2.41 on paper is a serious role mismatch. | Accent remains 4.45 on paper / 3.84 on panel. | Defer both until role repair. |
| Journal | Heading/body contrast offers character, but coral links are weak. | Stronger accent readability; heavy headings can dominate shared cards. | Conditional editorial alternative; Folio more coherent as a pair. |
| Litera | Useful serif/sans pairing, weak blue links (3.71 on paper). | Readable primary colors; upstream reading repairs are absent. | Prefer Litera Reading. |
| Lumen | Neutral working surface; link 3.82 on paper. | Clear colors but little distinctiveness survives the shared shell. | Defer. |
| Lux | Monochrome restraint works; muted panel text is 3.66. | Dark link 3.83 on paper / 3.18 on panel breaks the monochrome promise. | Defer; Tufte is the stronger restrained direction. |
| Materia | Generic but coherent sans; accent 3.12 on paper. | Stronger colors; material-specific component grammar is mostly absent. | Defer. |
| Minty | Pastel personality is visible, but body text is 3.54 and muted panel text 2.31. | Readable Bootstrap-derived dark mode loses much of the pastel identity. | Reject as a ready-to-use pair for this purpose. |
| Morph | Tinted surface and pale text collapse hierarchy: body 2.63. | Text improves, but differently tinted outer surface/panels feel less unified. | Reject until substantial redesign. |
| Pulse | Deep purple and quiet neutrals work in light. | Native stock dark variables are relatively readable; less distinct from other dark variants. | Retain as comparator to Pulse Reading, which is not automatically superior in dark. |
| Quartz | Neutral light adaptation loses the theatrical source character. | Violet ground is distinctive, but muted panel text is 2.93 and links 4.04. | Defer; background competes with the content. |
| Sandstone | Warm accent is only 2.03 on white; subdued palette erases emphasis. | More usable main accent; secondary panel text still 3.83. | Defer. |
| Simplex | Red with neutral text is coherent; sampled text roles largely robust. | Readable main accent; generic dark companion changes its character. | Strong stock comparator; refine Simplex Reading instead. |
| Sketchy | Playful handwriting survives; crisp stock cards create a mixed shape language. | Main accent 4.18 on paper, 3.80 on panel; handwriting still dominates. | Keep for deliberate informal use, not this scientific default. |
| Slate | Neutral light adaptation, panel links 4.26. | Strongly outlined panels; muted panel text 3.63 is too weak. | Defer. |
| Solar | Readable ordinary text in derived light; links weaken on panels. | Dark teal identity is strong but body 4.75 has little reserve; muted panel text 3.00. | Defer for projection; color atmosphere is not readability. |
| Spacelab | Grey body 4.48 and muted panel text 2.70 undermine the calm aesthetic. | More robust text; source distinction limited in shared shell. | Defer. |
| Superhero | Clear derived light with weak panel accents. | Navy/orange pairing is memorable; orange panel accent only 3.83. | Specialist alternative after repair. |
| United | Warm orange personality; links 3.65 on paper. | Readable dark accent, less distinctive overall pair. | Defer; Simplex Reading supplies a cleaner warm-accent candidate. |
| Vapor | Clear pastel-tinted adaptation without much neon personality. | Saturated cyan type and purple field retain character but make everything compete. | Reject as a default analytical/presentation UI; retain for intentional style. |
| Yeti | Quiet layout, but pale-weight heading and weak blue links need review. | More readable blue; lightness of heading weight remains a distance concern. | Defer. |
| Zephyr | Coherent blue/Inter UI; muted panel copy 4.01 is a defect. | Readable ordinary main colors, generic dark companion. | Prefer Zephyr Reading light; keep stock dark as a repair comparator. |
| Folio | Coherent warm editorial identity. | Coherent green-black companion. | Advance both. |
| Atelier | Coherent technical/studio identity. | Coherent teal-black companion. | Advance both; primary base. |
| Nocturne | Coherent pearl/brown/purple identity. | Coherent ink/brass identity. | Advance both. |
| Tufte | Restrained serif; shared cards weaken the language. | Restrained neutral pair; same structural mismatch. | Advance as minimalist alternative. |
| Zephyr Reading | Strong modern blue/sans direction. | Panel-accent repair required. | Advance with explicit condition. |
| Simplex Reading | Strong economical warm/red direction. | Panel-accent repair required. | Advance with equal priority. |
| Pulse Reading | Strong purple/system-sans direction. | Panel-accent repair required. | Advance with equal priority. |
| Litera Reading | Clear prose hierarchy and stronger blue. | Panel-accent repair required. | Advance with equal priority. |
| Darkly Reading | Usable restrained complementary light. | Strong main accent; weak secondary role. | Advance with equal priority. |

More evidence: contact sheets [2](figures/contact-2.png),
[3](figures/contact-3.png), [4](figures/contact-4.png), [5](figures/contact-5.png),
[6](figures/contact-6.png), [7](figures/contact-7.png), [8](figures/contact-8.png).

## What should carry back to SmallDocs and Quarto

Carry back a **role contract**, not slide pixel sizes: readable ink on each
surface, accent text separate from accent fill, state semantics separate from
category colors, explicit body/heading/code font roles, and consistent light/dark
relationships. Audit the paired SmallDocs CSS and Quarto Sass together if those
roles change. The existing 640px reading width and 1.45 leading are document
decisions; a projection profile needs different size/space decisions.

Do not overwrite a source Reading theme with an htmpres-derived dark palette
merely because it exists here. First decide whether that source project should
publish a designed pair at all. Fixing htmpres adaptation defects can stay local
to the importer/adapter unless a native source defect is independently reproduced.

## Provisional selection for Part 2

Advance **all nine priority themes**. Within them, test Atelier as the practical
presentation default; Folio/Nocturne for distinct editorial voices; Tufte for a
minimal direction; and all five Reading alternatives with the repairs described
above. Retain Bootstrap and stock Pulse/Simplex/Zephyr as comparison controls.
No theme is selected for implementation yet.
