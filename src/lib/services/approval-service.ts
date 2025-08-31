import { deliveryStore } from "@/lib/store/delivery-store";
import { API_URL } from "../helpers";

export const fetchPendingApprovalList = async (
  username: string,
  fromDate?: string,
  toDate?: string
): Promise<any> => {

  try {
    deliveryStore.set((state) => ({
      ...state,
      isLoading: true,
    }));

    const apiUrl = `${API_URL}/ListValues/GetPendingApprovalList?username=${encodeURIComponent(username || "")}&FromDate=${fromDate || ""}&Todate=${toDate || ""}`;

    console.log("Fetching pending approval list from:", apiUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    console.log("Pending Approval List API response:", data);

    if (data.result) {
      deliveryStore.set((state) => ({
        ...state,
        pendingApprovalList: data.result,
        isLoading: false,
        error: null,
      }));
      return data;
    } else {
      throw new Error(data.ReturnMessage || "Failed to fetch pending approval list");
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


export const packDeliveriesThirdParty = async (deliveriesData: any[]): Promise<any> => {
  try {
    const apiUrl = `${API_URL}/PharmacyDelivery/PackDeliveryLine_thirdparty`;

    console.log("Packing deliveries (third-party) to:", apiUrl);
    console.log("Payload:", deliveriesData);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deliveriesData),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    console.log("Third-party pack API response:", data);

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to pack deliveries";
    console.error("Pack deliveries (third-party) error:", errorMessage);
    throw error;
  }
};
