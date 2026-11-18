# Recording

A take is a JSON file. You can record one by hand in the browser, or describe the take in one sentence and let an agent record it.

## By hand

Start your dev server and open the page with `?record` in the URL. Every demo on the page turns into a recorder.

1. **Record a take.** Press Record. The component remounts, so the take starts from its first frame. Use it the way you want the reader to see it, rest the pointer for a moment, then press Stop. The recorder trims the move from the box to the Stop button off the end. Time starts with your first event inside the box. Pointer moves are sampled every 24ms.
2. **Preview it, then save it.** Preview replays the take inside the recorder. The Recorder button takes you back. When it looks right, press Copy recording and paste the JSON into a file next to your component:

```tsx
import recording from "./like-button.json";

<GhostReplay recording={recording}>
  <LikeButton />
</GhostReplay>
```

To record outside a `<GhostReplay>`, wrap the component in `<DevRecorder>`: the same toolbar in development, nothing in production.

## With an agent

With a coding agent you don't have to record by hand. Describe the take in one sentence:

```
/ghost-record filter list: type "to", then pick Tooltip
```

The agent finds the component, records it with human-like input, checks the replay and prints the snippet. Steps: {{origin}}/docs/agents.md. Install and defaults: {{origin}}/docs/agent-skill.md.
