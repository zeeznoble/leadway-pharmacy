import { asyncChunk } from "stunk";

import { API_URL } from "../helpers";

import { CreateRiderRequest, Rider, RiderResponse } from "@/types";

export const fetchAllRiders = asyncChunk(async () => {
  const response = await fetch(`${API_URL}/Riders/GetAllRiders`);
  if (!response.ok) {
    throw new Error('Failed to fetch riders');
  }
  const data = await response.json();
  return data.result as Rider[];
});

export const fetchRiderById = asyncChunk(async (riderId: number) => {
  const response = await fetch(`${API_URL}/Riders/GetRiderByID?riderid=${riderId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch rider');
  }
  const data = await response.json();

  return data.result[0] as Rider;
});

export const createOrUpdateRider = async (riderData: CreateRiderRequest | Rider): Promise<RiderResponse> => {
  try {
    const response = await fetch(`${API_URL}/Riders/UpsertRider`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(riderData),
    });

    if (!response.ok) {
      throw new Error('Failed to save rider');
    }

    const data = await response.json();
    const isUpdate = 'rider_id' in riderData && riderData.rider_id !== null;
    return {
      success: true,
      message: isUpdate ? 'Rider updated successfully' : 'Rider created successfully',
      response: data
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred',
    };
  }
};
