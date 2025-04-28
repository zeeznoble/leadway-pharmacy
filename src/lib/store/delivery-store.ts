import { chunk } from "stunk";
import { Delivery, Diagnosis, Procedure } from "@/types";
import { appChunk, authStore } from "./app-store";
import toast from "react-hot-toast";
import { fetchDeliveries } from "../services/delivery-service";

const initialFormState = {
  enrolleeId: "",
  enrolleeName: "",
  enrolleeAge: 0,
  schemeId: "",
  schemeName: "",

  pharmacyName: "",
  pharmacyId: "",

  deliveryFrequency: "",
  delStartDate: "",
  nextDeliveryDate: "",
  frequencyDuration: "",
  endDate: "",

  diagnosisLines: [] as Diagnosis[],
  procedureLines: [] as Procedure[],

  additionalInformation: "",

  currentStep: 1,
  totalSteps: 5
};

export const deliveryFormState = chunk(initialFormState);

export const deliveryStore = chunk({
  deliveries: [] as Delivery[],
  isLoading: false,
  isSubmitting: false,
  error: null as string | null,
  showModal: false
});

export const deliveryActions = {
  openModal: () => {
    deliveryStore.set(state => ({ ...state, showModal: true }));
    deliveryFormState.reset();
  },

  closeModal: () => {
    deliveryStore.set(state => ({ ...state, showModal: false }));
  },

  nextStep: () => {
    deliveryFormState.set(state => {
      if (state.currentStep < state.totalSteps) {
        return { ...state, currentStep: state.currentStep + 1 };
      }
      return state;
    });
  },

  prevStep: () => {
    deliveryFormState.set(state => {
      if (state.currentStep > 1) {
        return { ...state, currentStep: state.currentStep - 1 };
      }
      return state;
    });
  },

  goToStep: (step: number) => {
    deliveryFormState.set(state => {
      if (step >= 1 && step <= state.totalSteps) {
        return { ...state, currentStep: step };
      }
      return state;
    });
  },

  updateFormField: (field: string, value: any) => {
    deliveryFormState.set(state => ({
      ...state,
      [field]: value
    }));
  },

  addDiagnosis: (diagnosis: Diagnosis) => {
    deliveryFormState.set(state => ({
      ...state,
      diagnosisLines: [...state.diagnosisLines, diagnosis]
    }));
  },

  removeDiagnosis: (diagnosisId: string) => {
    deliveryFormState.set(state => ({
      ...state,
      diagnosisLines: state.diagnosisLines.filter(d => d.DiagnosisId !== diagnosisId)
    }));
  },

  addProcedure: (procedure: Procedure) => {
    deliveryFormState.set(state => ({
      ...state,
      procedureLines: [...state.procedureLines, procedure]
    }));
  },

  removeProcedure: (procedureId: string) => {
    deliveryFormState.set(state => ({
      ...state,
      procedureLines: state.procedureLines.filter(p => p.ProcedureId !== procedureId)
    }));
  },

  updateProcedureQuantity: (procedureId: string, quantity: number) => {
    deliveryFormState.set(state => ({
      ...state,
      procedureLines: state.procedureLines.map(p =>
        p.ProcedureId === procedureId ? { ...p, ProcedureQuantity: quantity } : p
      )
    }));
  },

  submitForm: async () => {
    try {
      deliveryStore.set(state => ({ ...state, isSubmitting: true }));

      const formData = deliveryFormState.get();
      const { user } = authStore.get();

      const delivery = {
        EnrolleeId: formData.enrolleeId,
        EnrolleeName: formData.enrolleeName,
        EnrolleeAge: formData.enrolleeAge,
        SchemeId: formData.schemeId,
        SchemeName: formData.schemeName,
        DeliveryFrequency: formData.deliveryFrequency,
        DelStartDate: formData.delStartDate,
        NextDeliveryDate: formData.nextDeliveryDate,
        FrequencyDuration: formData.frequencyDuration,
        EndDate: formData.endDate,
        DiagnosisLines: formData.diagnosisLines,
        ProcedureLines: formData.procedureLines,
        AdditionalInformation: formData.additionalInformation,
        IsDelivered: false,
        Username: user ? user.UserName : "Unknown",
        // Add the pharmacy information
        Pharmacyid: formData.pharmacyId,
        PharmacyName: formData.pharmacyName
      };

      const formattedData = {
        Deliveries: [delivery]
      };

      console.log("Submitting delivery:", formattedData);

      const { createDelivery } = await import("../services/delivery-service");
      const response = await createDelivery(formattedData);

      if (response.status !== 200 || response.Errors?.length > 0 ||
        (response.ReturnMessage &&
          (response.ReturnMessage.toLowerCase().includes("error") ||
            response.ReturnMessage.toLowerCase().includes("invalid")))) {
        toast.error(response.ReturnMessage || "Failed to create delivery");
        return response;
      } else {
        toast.success(response.ReturnMessage || "Delivery created successfully!");
        deliveryActions.closeModal();

        const { user } = authStore.get();
        const { enrolleeId } = appChunk.get();
        fetchDeliveries(user?.UserName!, enrolleeId);

        return response;
      }
    } catch (error) {
      console.error("Error submitting delivery:", error);
      toast.error("An unexpected error occurred");
      return { status: 500, ReturnMessage: "An unexpected error occurred", Errors: [] };
    } finally {
      deliveryStore.set(state => ({ ...state, isSubmitting: false }));
    }
  }
};
