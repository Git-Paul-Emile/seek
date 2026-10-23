import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCanauxNotificationApi,
  updateCanauxNotificationApi,
  type UpdateCanauxPayload,
} from "@/api/notificationPreferences";

export const useCanauxNotification = () =>
  useQuery({
    queryKey: ["canaux-notification"],
    queryFn: getCanauxNotificationApi,
  });

export const useUpdateCanauxNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCanauxPayload) => updateCanauxNotificationApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canaux-notification"] });
    },
  });
};
