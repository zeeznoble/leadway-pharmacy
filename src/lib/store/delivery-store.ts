import { chunk } from "stunk";
import { Delivery, Diagnosis, Procedure, Provider } from "@/types";
import { appChunk, authStore } from "./app-store";
import toast from "react-hot-toast";
import { fetchDeliveries } from "../services/delivery-service";

export const initialFormState = {
  enrolleeId: "",
  enrolleeName: "",
  enrolleeAge: 0,
  schemeId: "",
  schemeName: "",
  deliveryaddress: "",
  phonenumber: "",

  pharmacyId: 0,
  pharmacyName: "",

  deliveryFrequency: "",
  delStartDate: "",
  nextDeliveryDate: "",
  frequencyDuration: "",
  endDate: "",

  diagnosisLines: [] as Diagnosis[],
  procedureLines: [] as Procedure[],

  additionalInformation: "",

  currentStep: 1,
  totalSteps: 5,
  isEditing: false,
  entryno: 0
};

export const deliveryFormState = chunk(initialFormState);

export const deliveryStore = chunk({
  deliveries: [] as Delivery[],
  isLoading: false,
  isSubmitting: false,
  isPackingLoading: false,
  error: null as string | null,
  packingError: null as string | null,
  packingSuccess: false,
  lastSearchedEnrolleeId: null as string | null,
  showModal: false,
  showPackModal: false,
  nextPackDate: null as string | null,
  nextDeliveryDate: null as string | null,
})

export const deliveryActions = {
  openModal: () => {
    deliveryStore.set(state => ({ ...state, showModal: true }));
    deliveryFormState.reset();
  },

  closeModal: () => {
    deliveryStore.set(state => ({ ...state, showModal: false }));
  },

  openPackModal: () => {
    deliveryStore.set(state => ({ ...state, showPackModal: true }));
  },

  closePackModal: () => {
    deliveryStore.set(state => ({ ...state, showPackModal: false, nextPackDate: null }));
  },

  setNextPackDate: (date: string | null) => {
    deliveryStore.set(state => ({ ...state, nextPackDate: date }));
  },

  setNextDeliveryDate: (date: string | null) => {
    deliveryStore.set(state => ({ ...state, nextDeliveryDate: date }));
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

  setProvider: (provider: Provider) => {
    deliveryFormState.set(state => ({
      ...state,
      pharmacyId: provider.Pharmacyid,
      pharmacyName: provider.PharmacyName
    }));
  },

  removeProvider: () => {
    deliveryFormState.set(state => ({
      ...state,
      pharmacyId: 0,
      pharmacyName: ""
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

  setFormData: (data: any) => {
    // Transform the API response to match your form state structure
    const formData = {
      enrolleeId: data.EnrolleeId || "",
      enrolleeName: data.EnrolleeName || "",
      enrolleeAge: data.EnrolleeAge || 0,
      schemeId: data.SchemeId || "",
      schemeName: data.SchemeName || "",
      deliveryaddress: data.deliveryaddress || "",
      phonenumber: data.phonenumber || "",
      pharmacyName: data.PharmacyName || "",
      pharmacyId: data.PharmacyId || 0,
      deliveryFrequency: data.DeliveryFrequency || "",
      delStartDate: data.DelStartDate || "",
      nextDeliveryDate: data.NextDeliveryDate || "",
      frequencyDuration: data.FrequencyDuration || "",
      endDate: data.EndDate || "",
      diagnosisLines: data.DiagnosisLines || [],
      procedureLines: data.ProcedureLines || [],
      additionalInformation: data.AdditionalInformation || "",
      currentStep: 1,
      totalSteps: 5,
      isEditing: true,
      entryno: data.EntryNo
    };

    deliveryFormState.set(formData);
  },

  resetForm: () => {
    deliveryFormState.reset();
  },

  submitForm: async () => {
    try {
      deliveryStore.set(state => ({ ...state, isSubmitting: true }));
      const formData = deliveryFormState.get();
      const { user } = authStore.get();

      const delivery: Delivery = {
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
        deliveryaddress: formData.deliveryaddress,
        phonenumber: formData.phonenumber,
        Pharmacyid: formData.pharmacyId,
        PharmacyName: formData.pharmacyName,
        // Include EntryNo for edit operations
        EntryNo: formData.isEditing ? formData.entryno : undefined
      };

      let response;
      if (formData.isEditing) {
        // For edit operations
        const { editDelivery } = await import("../services/delivery-service");
        response = await editDelivery(delivery);
      } else {
        // For create operations
        const formattedData = { Deliveries: [delivery] };
        const { createDelivery } = await import("../services/delivery-service");
        response = await createDelivery(formattedData);
      }

      // Handle response
      if (response.status !== 200 || response.Errors?.length > 0 ||
        (response.ReturnMessage &&
          (response.ReturnMessage.toLowerCase().includes("error") ||
            response.ReturnMessage.toLowerCase().includes("invalid")))) {
        toast.error(response.ReturnMessage ||
          (formData.isEditing ? "Failed to update delivery" : "Failed to create delivery"));
        return response;
      }

      toast.success(response.ReturnMessage ||
        (formData.isEditing ? "Delivery updated successfully!" : "Delivery created successfully!"));

      deliveryActions.closeModal();
      deliveryFormState.reset();

      // Refresh deliveries
      const { enrolleeId } = appChunk.get();
      fetchDeliveries(user?.UserName!, enrolleeId);

      return response;
    } catch (error) {
      console.error("Error submitting delivery:", error);
      toast.error("An unexpected error occurred");
      return { status: 500, ReturnMessage: "An unexpected error occurred", Errors: [] };
    } finally {
      deliveryStore.set(state => ({ ...state, isSubmitting: false }));
    }
  },

  resetDeliveryErrors: () => {
    deliveryStore.set(state => ({
      ...state,
      error: null,
      packingError: null,
      packingSuccess: false,
    }));
  },

  setPackingSuccess: (success: boolean) => {
    deliveryStore.set(state => ({
      ...state,
      packingSuccess: success,
    }));
  },

  updateLastSearchedEnrolleeId: (enrolleeId: string) => {
    deliveryStore.set(state => ({
      ...state,
      lastSearchedEnrolleeId: enrolleeId,
    }));
  }
};
