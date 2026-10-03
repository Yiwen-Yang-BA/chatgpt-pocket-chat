import { ValidationError } from "./lib/validate.mjs";
export function validateConversation(payload) {
  if (
    !Array.isArray(payload.messages) ||
    payload.messages.length < 1 ||
    payload.messages.length > 100
  )
    throw new ValidationError("需要 1–100 条会话消息。");
  const messages = payload.messages.map((m) => {
    if (
      !m ||
      !["user", "assistant"].includes(m.role) ||
      typeof m.content !== "string" ||
      !m.content.trim() ||
      m.content.length > 20000
    )
      throw new ValidationError("消息角色或内容无效。");
    return { role: m.role, content: m.content.trim() };
  });
  if (messages.at(-1).role !== "user")
    throw new ValidationError("最后一条消息必须来自用户。");
  if (messages.reduce((s, m) => s + m.content.length, 0) > 100000)
    throw new ValidationError("会话过长，请新建一个会话。");
  if (
    payload.system !== undefined &&
    (typeof payload.system !== "string" || payload.system.length > 4000)
  )
    throw new ValidationError("系统提示词最多 4000 字。");
  return messages;
}
export async function run(payload, { generate }) {
  const messages = validateConversation(payload);
  return generate({
    instructions:
      payload.system ||
      "You are a thoughtful assistant. Respond in the user’s language. Be concise, concrete, and honest about uncertainty.",
    input: messages,
    demo: () => ({
      text: `**演示回复**\n\n你刚才说：“${messages.at(-1).content.slice(0, 250)}”\n\n这段会话包含 ${messages.filter((m) => m.role === "user").length} 个用户问题。我会在真实模式中结合整个会话和选定角色作答。\n\n可以继续追问、切换角色，或者导出这段聊天。配置 .env 后，切换到「真实模型」即可获得 AI 回答。`,
      annotations: [],
      usage: null,
    }),
  });
}
