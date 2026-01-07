import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";

interface UseDebounceSubmitOptions {
  onSubmit: (data: any) => Promise<void>;
  successMessage?: string;
  delay?: number;
}

export const useDebounceSubmit = ({
  onSubmit,
  successMessage = "Successfully saved",
  delay = 1000,
}: UseDebounceSubmitOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);

  const debouncedSubmit = useDebouncedCallback(async (data: any) => {
    setIsLoading(true);
    setIsDebouncing(false);
    try {
      await onSubmit(data);
      toast.success(successMessage);
      return true;
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error saving. Please check input fields");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, delay);

  const handleSubmit = async (data: any) => {
    setIsDebouncing(true);
    return await debouncedSubmit(data);
  };

  return {
    isLoading,
    isDebouncing,
    isProcessing: isLoading || isDebouncing,
    debouncedSubmit: handleSubmit,
  };
};
