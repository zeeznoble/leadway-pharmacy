import { chunk } from "stunk";
import { EnrolleeData } from "../services/fetch-enrolee";
import { User } from "@/types";

export const appChunk = chunk({
  enrolleeId: '',
  stateId: '',
  disciplineId: '',
  enrolleeData: null as EnrolleeData | null
})

type AuthState = {
  user: User | null;
  isLoading: boolean;
};

export const authStore = chunk<AuthState>({
  isLoading: false,
  user: null
})

export const resetProviderFilters = (stateId: string) => {
  appChunk.set((state) => ({
    ...state,
    stateId: stateId || '',
    enrolleeId: ''
  }));
};
