import { Delivery, Diagnosis } from "@/types";
import { API_URL } from "../helpers";
import { deliveryStore } from "../store/delivery-store";
import { authStore } from "../store/app-store";
import toast from "react-hot-toast";

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

export const fetchDeliveries = async (username: string, enrolleeId: string): Promise<void> => {
  try {
    deliveryStore.set((state) => ({
      ...state,
      isLoading: true,
    }));

    const apiUrl = `${API_URL}/PharmacyDelivery/GetTracking?username=${username}&enrolleeId=${enrolleeId}`;

    const response = await fetch(apiUrl);

    console.log(apiUrl)

    const data = await response.json();

    if (response.ok && data.result) {
      deliveryStore.set((state) => ({
        ...state,
        deliveries: data.result,
        isLoading: false,
        error: null,
      }));
    } else {
      deliveryStore.set((state) => ({
        ...state,
        isLoading: false,
        error: data.ReturnMessage || "Failed to fetch deliveries",
      }));
    }
  } catch (error) {
    deliveryStore.set((state) => ({
      ...state,
      isLoading: false,
      error: "Failed to connect to the server",
    }));
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
