import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  generateWorkflowFromPrompt,
  streamTaskPlan,
  type ParsedWorkflowResult,
} from "../services/promptToCanvas";
import {
  streamGeminiChatReply,
  type GeminiMessage,
} from "../services/geminiChat";

export type { GeminiMessage } from "../services/geminiChat";

const GEMINI_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

interface TaskPlanVariables {
  prompt: string;
  onChunk?: (chunk: string, accumulated: string) => void;
}

interface ChatReplyVariables {
  history: GeminiMessage[];
  userText: string;
  onChunk?: (chunk: string, accumulated: string) => void;
}

interface WorkflowVariables {
  prompt: string;
  history?: GeminiMessage[];
}

export const useTaskPlanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["gemini", "task-plan", "stream"],
    gcTime: GEMINI_CACHE_TTL_MS,
    mutationFn: async ({
      prompt,
      onChunk,
    }: TaskPlanVariables): Promise<string> => {
      let accumulated = "";
      for await (const chunk of streamTaskPlan(prompt)) {
        accumulated += chunk;
        onChunk?.(chunk, accumulated);
      }
      return accumulated;
    },
    onSuccess: (plan, variables) => {
      queryClient.setQueryData(["gemini", "task-plan", variables.prompt], plan);
    },
  });
};

export const useWorkflowGenerationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["gemini", "workflow", "generate"],
    gcTime: GEMINI_CACHE_TTL_MS,
    mutationFn: async ({
      prompt,
      history = [],
    }: WorkflowVariables): Promise<ParsedWorkflowResult> =>
      generateWorkflowFromPrompt(prompt, history),
    onSuccess: (result, variables) => {
      queryClient.setQueryData(["gemini", "workflow", variables.prompt], result);
    },
  });
};

export const useChatReplyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["gemini", "chat", "reply"],
    gcTime: GEMINI_CACHE_TTL_MS,
    mutationFn: async ({
      history,
      userText,
      onChunk,
    }: ChatReplyVariables): Promise<string> => {
      let accumulated = "";
      const fullText = await streamGeminiChatReply(history, userText, (chunk) => {
        accumulated += chunk;
        onChunk?.(chunk, accumulated);
      });

      if (!accumulated && fullText) {
        onChunk?.(fullText, fullText);
      }

      return fullText;
    },
    onSuccess: (reply, variables) => {
      queryClient.setQueryData(
        ["gemini", "chat", variables.userText.slice(0, 120)],
        reply,
      );
    },
  });
};
