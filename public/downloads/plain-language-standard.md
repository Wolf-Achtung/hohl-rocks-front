---
name: plain-language-standard
description: Writing standard for clear text — ASD-STE100 (Simplified Technical English) combined with Zinsser's four principles (Simplicity, Brevity, Clarity, Humanity). Apply to every text output — reports, UI copy, documentation, email, marketing copy, commit messages.
---

# The Plain Language Standard

Text you read once and understand straight away. To get there, this standard combines two layers: ASD-STE100 supplies the technical rules, William Zinsser ("On Writing Well") supplies the measure of quality. STE without Zinsser turns sterile. Zinsser without STE turns arbitrary. Together they hold.

## How to use it

**With an AI assistant (Claude, ChatGPT and others):**

1. Give the assistant this file and write: "Apply this writing standard to all your texts."
2. Claude: the file works directly as a skill. Put it in a skill folder as `SKILL.md` (for example `.claude/skills/plain-language-standard/SKILL.md`) — the front matter above is set up for that.
3. ChatGPT: put the content into your custom instructions, or upload the file as project knowledge.

**In a team:**

1. Link the standard where texts are written — wiki, style guide, onboarding.
2. Use the self-check at the end as a checklist before every hand-off.
3. Decide per text type how strictly the rules apply (see the table below).

## Layer 1: STE core rules

1. **One sentence, one statement.** Instructions: 20 words maximum. Descriptions: 25 words maximum. If a sentence needs two commas, it is usually two sentences.
2. **Active, not passive.** Name the actor. "The system creates the report" — not "The report is created."
3. **One term, one meaning.** One fixed vocabulary per project. No switching synonyms: whoever writes "assessment" does not later write "analysis" for the same thing.
4. **Verbs, not nouns.** "check" instead of "carry out a check". "decide" instead of "take a decision".
5. **Limit compounds.** Three parts maximum. "AI readiness report" is fine. "AI readiness assessment result overview" gets unpacked: "overview of the assessment results".
6. **Instructions in the imperative.** One action per step. Sequences of three steps or more become a numbered list.
7. **Warning before action.** State the condition or the danger first, then the step. Never the other way round.
8. **Present tense as the default.** Future and conditional only when the subject demands it.
9. **One paragraph, one idea.** Six sentences per paragraph maximum.
10. **Concrete, not abstract.** Numbers, names, examples. "The report runs to 12 pages" — not "an extensive report".

For German texts, apply the same rules with German grammar in mind; Duden decides in cases of doubt. For English, the STE originals apply directly (simple, unambiguous words; approved-word logic) plus the Chicago Manual of Style.

## Layer 2: Zinsser's four principles

1. **Simplicity.** Every word earns its place or goes. Jargon only when the audience uses it themselves.
2. **Brevity.** The shortest version that is still complete. Cutting is the standard operation, not the exception.
3. **Clarity.** Nobody should have to read a sentence twice. If they do: rewrite it, do not explain it.
4. **Humanity.** The text sounds like a person with something to say. Direct address, a clear stance, no officialese. Humanity is the corrective against STE sterility.

## How strictly, by text type

| Text type | Mode |
|---|---|
| **Reports & documentation** | STE strictly. For audiences without prior knowledge: explain every technical term in one sentence the first time it appears. Always give concrete numbers. |
| **UI copy** (labels, tooltips, error messages) | STE strictly: short, action-oriented, one verb. Error messages name the cause and the next step. |
| **Websites & personal pages** | Zinsser leads, STE relaxed. Playful is allowed — clear is mandatory. |
| **Marketing** | Humanity and Brevity lead. Treat STE sentence lengths as a guide; rhythm may break them when it serves the text. |
| **Editing someone else's work** | The relevant style manual outranks STE. Preserve the author's voice — never impose STE on someone else's text. Use the STE rules only as a diagnostic tool for clarity problems. |
| **Code, commits, docs** | Commit messages: imperative, one change, one line of substance. README and docs: STE strictly. Comments only where the code does not explain itself. |

## Forbidden patterns

Filler phrases and politeness loops. Chains of nouns ("the execution of the implementation of the solution"). Double negatives. Sentences that open with "There is" or "It is". Hedge words: actually, basically, essentially, quite, somewhat, rather. Disclaimer inflation. Switching synonyms for the same technical term. Superlatives without evidence. Coarse language — clear thinking does not need swearing.

## Self-check before every hand-off

1. **Passive scan:** every passive needs a reason. Otherwise: make it active.
2. **Length scan:** split sentences over 25 words. Split paragraphs over 6 sentences.
3. **Cutting pass:** go through the whole text once, only to shorten it. If there was nothing to cut, the pass was too fast.
4. **Terminology scan:** one term, one meaning — across the whole project.
5. **Read-aloud test (Humanity):** spoken out loud, does it sound like a person? If not, it is not finished.

---

Free to use. Found at [hohl.rocks](https://hohl.rocks).
