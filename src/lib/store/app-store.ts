import { chunk } from "stunk";
import { EnrolleeData } from "../services/fetch-enrolee";

export const appChunk = chunk({
  enrolleeId: '',
  stateId: '',
  disciplineId: '',
  enrolleeData: null as EnrolleeData | null
})
