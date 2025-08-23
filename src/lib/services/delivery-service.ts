import { Dispatch, SetStateAction } from "react"
import toast from "react-hot-toast";

import { deliveryStore } from "@/lib/store/delivery-store";
import { authStore } from "@/lib/store/app-store";

import { API_URL, programmaticNavigate } from "../helpers";
import { DeliveredPackResponse, Delivery, Diagnosis, PackResponse } from "@/types";
import { asyncChunk } from "stunk";

export const createDelivery = async (deliveryData: { Deliveries: Delivery[] }): Promise<any> => {
  try {
    deliveryStore.set((state) => ({
      ...state,
      isSubmitting: true,
    }));

    const apiUrl = `${API_URL}/PharmacyDelivery/InsertBatchDeliveryTracking`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deliveryData),
    });

    const data = await response.json();


    deliveryStore.set((state) => ({
      ...state,
      isSubmitting: false,
    }));

    if (!response.ok) {
      return {
        status: response.status,
        result: null,
        ReturnMessage: data.ReturnMessage || `Failed to create delivery: ${response.status} ${response.statusText}`,
      };
    }

    const { user } = authStore.get();
    if (user?.UserName) {
      fetchDeliveries(user.UserName, deliveryData.Deliveries[0].EnrolleeId);
    }

    programmaticNavigate('/enrollees');


    return {
      status: response.status,
      result: data,
      ReturnMessage: data.ReturnMessage || "Delivery created successfully",
    };
  } catch (error) {
    deliveryStore.set((state) => ({
      ...state,
      isSubmitting: false,
    }));

    console.error("Create delivery error:", error);

    return {
      status: 0,
      result: null,
      ReturnMessage: "Failed to connect to the server",
    };
  }
};


export const fetchDeliveries = async (username: string, enrolleeId: string, actionType?: string): Promise<any> => {
  try {
    deliveryStore.set((state) => ({
      ...state,
      isLoading: true,
    }));

    const apiUrl = `${API_URL}/PharmacyDelivery/GetTracking?username=${encodeURIComponent(username || "")}&enrolleeId=${encodeURIComponent(enrolleeId || "")}&ACTIONTYPE=${actionType || ""}`;

    console.log("Fetching deliveries from:", apiUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    console.log("Deliveries API response:", data);

    if (data.result) {
      deliveryStore.set((state) => ({
        ...state,
        deliveries: data.result,
        isLoading: false,
        error: null,
        nextPackDate: data.result.nextpackdate || null,
      }));
      return data;
    } else {
      throw new Error(data.ReturnMessage || "Failed to fetch deliveries");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to connect to the server";
    deliveryStore.set((state) => ({
      ...state,
      isLoading: false,
      error: errorMessage,
    }));
    throw error;
  }
};

export const fetchUnpacked = async (username: string, enrolleeId: string, fromDate?: string, toDate?: string): Promise<any> => {
  try {
    deliveryStore.set((state) => ({
      ...state,
      isLoading: true,
    }));

    const apiUrl = `${API_URL}/PharmacyDelivery/GetUnPackedDrugs?username=${encodeURIComponent(username || "")}&enrolleeId=${encodeURIComponent(enrolleeId || "")}&FromDate=${fromDate}&Todate=${toDate}&ACTIONTYPE=2`;

    console.log("Fetching packs from:", apiUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    console.log("unPacked:", data);

    if (data.result) {
      deliveryStore.set((state) => ({
        ...state,
        deliveries: data.result,
        isLoading: false,
        error: null,
        nextPackDate: data.result.nextpackdate || null,
      }));
      return data;
    } else {
      throw new Error(data.ReturnMessage || "Failed to fetch deliveries");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to connect to the server";
    deliveryStore.set((state) => ({
      ...state,
      isLoading: false,
      error: errorMessage,
    }));
    throw error;
  }
};

export const fetchPacked = async (username: string, enrolleeId: string, fromDate?: string, toDate?: string): Promise<any> => {
  try {
    deliveryStore.set((state) => ({
      ...state,
      isLoading: true,
    }));

    const apiUrl = `${API_URL}/PharmacyDelivery/GetPackedDrugs?username=${encodeURIComponent(username || "")}&enrolleeId=${encodeURIComponent(enrolleeId || "")}&FromDate=${fromDate}&Todate=${toDate}&ACTIONTYPE=2`;


    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();


    if (data.result) {
      deliveryStore.set((state) => ({
        ...state,
        deliveries: data.result,
        isLoading: false,
        error: null,
        nextPackDate: data.result.nextpackdate || null,
      }));
      return data;
    } else {
      throw new Error(data.ReturnMessage || "Failed to fetch deliveries");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to connect to the server";
    deliveryStore.set((state) => ({
      ...state,
      isLoading: false,
      error: errorMessage,
    }));
    throw error;
  }
};

export const fetchDiagnoses = async (): Promise<Diagnosis[]> => {
  try {
    const apiUrl = `${API_URL}/api/ListValues/GetAllDiagnosis`;

    const response = await fetch(apiUrl, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await response.json();

    if (response.ok && data.result) {
      return data.result.map((item: any) => ({
        DiagnosisId: item.DiagnosisId || item.id,
        DiagnosisName: item.DiagnosisName || item.name,
      }));
    } else {
      throw new Error(data.ReturnMessage || "Failed to fetch diagnoses");
    }
  } catch (error) {
    console.error("Fetch diagnoses error:", error);
    toast.error("Failed to load diagnoses");
    return [];
  }
};


export const editDelivery = async (formData: any): Promise<any> => {
  try {
    deliveryStore.set((state) => ({
      ...state,
      isSubmitting: true,
    }));

    const apiUrl = `${API_URL}/PharmacyDelivery/UpdateDeliveryLine`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    deliveryStore.set((state) => ({
      ...state,
      isSubmitting: false,
    }));

    if (!response.ok) {
      toast.error(data.ReturnMessage || "Failed to update delivery");
      return;
    }

    // toast.success(data.ReturnMessage || "Delivery updated successfully");

    // Refresh deliveries based on current page - CHECK PROVIDER-PENDINGS FIRST
    const enrolleeId = formData?.EnrolleeId;

    if (window.location.pathname === '/provider-pendings') {
      // For provider-pendings page, use different parameters
      console.log("Refreshing for provider-pendings page after edit");
      if (enrolleeId) {
        await fetchDeliveries("", enrolleeId, "9");
      }
    } else {
      // For other pages, use normal fetch
      await fetchDeliveries("", enrolleeId);

    }

    programmaticNavigate('/enrollees');

    return data;
  } catch (error) {
    deliveryStore.set((state) => ({
      ...state,
      isSubmitting: false,
    }));

    console.error("Update delivery error:", error);
    toast.error("Failed to connect to the server");
    throw error;
  }
};

export const deleteDelivery = async (delivery: any, setIsDeleting: Dispatch<SetStateAction<Record<string, boolean>>>) => {
  try {
    const deliveryId = delivery.original?.DeliveryId;
    const procedureId = delivery.original?.ProcedureLines?.[0]?.ProcedureId;
    const diagnosisId = delivery.original?.DiagnosisLines?.[0]?.DiagnosisId;

    if (!deliveryId || !procedureId || !diagnosisId) {
      toast.error("Missing required information for deletion");
      return;
    }

    setIsDeleting(prev => ({ ...prev, [delivery.key]: true }));

    const deleteData = {
      DeliveryId: deliveryId,
      ProcedureId: procedureId,
      DiagnosisId: diagnosisId
    };

    console.log("Delete payload:", deleteData);

    const response = await fetch(`${API_URL}/PharmacyDelivery/DeleteDeliveryLine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deleteData),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.ReturnMessage || "Failed to delete delivery");
      return;
    }

    toast.success(data.ReturnMessage || "Delivery deleted successfully");

    // Refresh deliveries based on current page - CHECK PROVIDER-PENDINGS FIRST
    const enrolleeId = delivery.original.EnrolleeId;

    if (window.location.pathname === '/provider-pendings') {
      await fetchDeliveries("", "", "9");
    } else {
      // For other pages, use normal fetch

      await fetchDeliveries("", enrolleeId);

    }
  } catch (error) {
    console.error("Delete delivery error:", error);
    toast.error("Failed to connect to the server");
  } finally {
    setIsDeleting(prev => ({ ...prev, [delivery.key]: false }));
  }
};

export const approveDeliveries = async (selectedDeliveries: any[]): Promise<any> => {
  try {
    deliveryStore.set((state) => ({
      ...state,
      isSubmitting: true,
    }));

    const apiUrl = `${API_URL}/PharmacyDelivery/ApproveDeliveryLine`;

    const payload = selectedDeliveries.map(delivery => ({
      EntryNo: parseInt(delivery.key)
    }));

    console.log("Approving deliveries at:", apiUrl);

    console.log("Approve deliveries payload:", payload);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    deliveryStore.set((state) => ({
      ...state,
      isSubmitting: false,
    }));

    if (!response.ok) {
      throw new Error(data.ReturnMessage || `Failed to approve deliveries: ${response.status} ${response.statusText}`);
    }

    console.log("Approve deliveries API response:", data);

    // const enrolleeId = appChunk.get().enrolleeId;

    console.log("Refreshing for regular page after approval");
    await fetchDeliveries("", "", "9");

    return {
      status: response.status,
      result: data,
      ReturnMessage: "Deliveries approved successfully",
    };
  } catch (error) {
    deliveryStore.set((state) => ({
      ...state,
      isSubmitting: false,
    }));

    console.error("Approve deliveries error:", error);
    throw error;
  }
};

export const packDeliveries = async (deliveryLines: any[]): Promise<PackResponse> => {
  try {
    deliveryStore.set((state) => ({
      ...state,
      isPackingLoading: true,
      packingError: null,
    }));

    const apiUrl = `${API_URL}/PharmacyDelivery/PackDeliveryLine`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deliveryLines),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json() as PackResponse;

    console.log("Pack Delivery API response:", data);

    deliveryStore.set((state) => ({
      ...state,
      isPackingLoading: false,
      packingError: null,
      packingSuccess: true,
    }));

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to pack deliveries";
    deliveryStore.set((state) => ({
      ...state,
      isPackingLoading: false,
      packingError: errorMessage,
      packingSuccess: false
    }));
    throw error;
  }
};

export const deliverPackDeliveries = async (deliveryLines: any[]): Promise<DeliveredPackResponse> => {
  try {
    deliveryStore.set((state) => ({
      ...state,
      isPackingLoading: true,
      packingError: null,
      packingSuccess: false
    }));

    const apiUrl = `${API_URL}/PharmacyDelivery/DeliverDeliveryLine`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deliveryLines),
    });

    console.log("Delivering pack deliveries to:", apiUrl);
    console.log("Payload:", JSON.stringify(deliveryLines, null, 2));

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json() as DeliveredPackResponse;

    console.log("Delivered Pack Delivery API response:", data);

    deliveryStore.set((state) => ({
      ...state,
      isPackingLoading: false,
      packingError: null,
      packingSuccess: true
    }));

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to pack deliveries";
    deliveryStore.set((state) => ({
      ...state,
      isPackingLoading: false,
      packingError: errorMessage,
    }));
    throw error;
  }
};

export const fetchSentFor = asyncChunk(async () => {
  const res = await fetch(`${API_URL}/PharmacyDelivery/GetSentForDelivery`, { method: 'GET' });
  if (!res.ok) {
    throw new Error('Failed to fetch riders');
  }
  const data = await res.json();
  return data.result;
});
