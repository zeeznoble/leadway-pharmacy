import { BaseForm, LoginResponse } from "@/types";

export const loginUser = async (formData: BaseForm): Promise<LoginResponse> => {
  try {
    const apiUrl = `${import.meta.env.VITE_PROGNOSIS_API_URL}/Account/ExternalPortalLogin`;

    const apiPayload = {
      email: formData.email,
      password: formData.password,
      LogInSource: "PharmacyApp",
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiPayload),
    });

    console.log(apiPayload);

    const data = await response.json();
    console.log("API Response:", data);

    const standardizedResponse: LoginResponse = {
      status: response.status,
      result: data.result || null,
      errorMessage: data.errorMessage || data.ErrorMessage || `Login failed: ${response.status} ${response.statusText}`,
    };

    if (!response.ok) {
      console.log("Error message:", standardizedResponse.errorMessage);
      return standardizedResponse;
    }

    return standardizedResponse;
  } catch (error) {
    console.error("Error during login:", error);
    return {
      status: 0,
      result: null,
      errorMessage: "Failed to connect to the server",
    };
  }
};
