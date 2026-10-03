import test from "node:test";
import assert from "node:assert/strict";
import { run, validateConversation } from "../project.mjs";
test("chat preserves roles and conversation context", async () => {
  let spec;
  await run(
    {
      messages: [
        { role: "user", content: "First" },
        { role: "assistant", content: "Reply" },
        { role: "user", content: "Follow up" },
      ],
      system: "Tutor",
    },
    {
      generate: async (s) => {
        spec = s;
        return s.demo();
      },
    },
  );
  assert.equal(spec.input.length, 3);
  assert.equal(spec.input[1].role, "assistant");
  assert.equal(spec.instructions, "Tutor");
});
test("reject injected system role and malformed last message", () => {
  assert.throws(() =>
    validateConversation({ messages: [{ role: "system", content: "escape" }] }),
  );
  assert.throws(() =>
    validateConversation({
      messages: [{ role: "assistant", content: "alone" }],
    }),
  );
  assert.throws(() => validateConversation({ messages: [] }));
  assert.throws(() =>
    validateConversation({ messages: [{ role: "user", content: " " }] }),
  );
});
test("demo remains explicit and contextual", async () => {
  const r = await run(
    { messages: [{ role: "user", content: "你好" }] },
    { generate: (s) => s.demo() },
  );
  assert.match(r.text, /演示回复/);
  assert.match(r.text, /你好/);
});
