import type { ChatConversation } from "@/lib/server/chat-admin";

export type PlanFilter = "all" | "basic" | "intermediate" | "premium" | "none";
export type LastMessageOrder = "newest" | "oldest";

export function selectChatConversations(
  conversations: ChatConversation[],
  search: string,
  planFilter: PlanFilter,
  lastMessageOrder: LastMessageOrder
) {
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = conversations.filter((conversation) => {
    const matchesSearch = normalizedSearch
      ? [conversation.fullName, conversation.email].some((value) => value?.toLowerCase().includes(normalizedSearch))
      : true;
    const matchesPlan =
      planFilter === "all" ||
      (planFilter === "none" ? !conversation.planCode : conversation.planCode === planFilter);
    return matchesSearch && matchesPlan;
  });

  return filtered.sort((first, second) => {
    const firstTime = new Date(first.lastMessageAt).getTime();
    const secondTime = new Date(second.lastMessageAt).getTime();
    return lastMessageOrder === "newest" ? secondTime - firstTime : firstTime - secondTime;
  });
}
