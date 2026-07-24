# Tag Classification And Dependency Impact Workflow

This repository tracks substantial work with Gest. Before creating or splitting
a Gest task, collect the existing tag vocabulary:

```sh
gest task list --all --json
gest artifact list --all --json
gest iteration list --all --json
```

Use those inventories to classify the task:

```text
Tag classification:
Selected existing tags:
- <tag>: <why it applies>

New dynamic tags:
- <tag>: <why no existing tag covers it>

Near misses / rejected tags:
- <tag>: <why it was not selected>

Coupled concepts to search:
- <semantic concept or UI behavior>
```

Store the result on created tasks with metadata such as
`classification.tags.reviewed=true`,
`classification.tags.new=<comma-separated-new-tags>`, and, for code-facing
work, `impact.ast_grep.required=true|false`.

After selecting tags, search Gest memory for high-signal tags and coupled
concepts:

```sh
gest search "<selected-tag>" --all --json --limit 20
gest search "<semantic concept>" --all --json --limit 20
gest search "Follow-up <semantic concept>" --all --json --limit 20
```

If a task touches one surface of a coupled concept, either include the coupled
surface in the same task or create/link a follow-up before completion.

For code-facing changes that alter a function, constant, component, selector,
route, schema field, style token, exported API, or other semantic contract,
inspect dependers before completion. Prefer `ast-grep` for structured source:

```sh
ast-grep run --lang typescript --pattern '$FUNC($$$)' .
```

Use `rg` when the language or surface is better searched literally, such as
CSS selectors, markdown examples, or generated-template strings.

Completion notes for code-facing tasks should include:

```text
Tag classification: selected <tags>; added <new tags or none>.
Dependency impact: searched <patterns>; checked <dependers>; follow-ups <none or IDs>.
```

The project-local Gest skills keep a reusable copy of this guidance under
`.agents/skills/*/references/tag_dependency_workflow.md`; update this docs file
when the project workflow changes.
