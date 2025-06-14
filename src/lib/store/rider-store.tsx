import { Rider } from "@/types";
import { chunk } from "stunk";

interface RiderState {
  showModal: boolean;
  isSubmitting: boolean;
  error: string | null;
  editingRider: Rider | null;
}

interface RiderFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  license_number: string;
  license_expiry_date: string;
  status: "Active" | "Inactive" | "Suspended" | "Pending";
  profile_picture_url: string;
  notes: string;
}

export const riderStore = chunk<RiderState>({
  showModal: false,
  isSubmitting: false,
  error: null,
  editingRider: null,
});

export const riderFormData = chunk<RiderFormData>({
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  date_of_birth: "",
  gender: "Male",
  address_line1: "",
  address_line2: "",
  city: "",
  state_province: "",
  postal_code: "",
  country: "United States",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  license_number: "",
  license_expiry_date: "",
  status: "Active",
  profile_picture_url: "",
  notes: "",
});

export const riderActions = {
  openModal: () => {
    riderStore.set((state) => ({ ...state, showModal: true, error: null }));
  },

  closeModal: () => {
    riderStore.set((state) => ({
      ...state,
      showModal: false,
      editingRider: null,
    }));
    riderFormData.reset();
  },

  openEditModal: (rider: Rider) => {
    riderStore.set((state) => ({
      ...state,
      showModal: true,
      editingRider: rider,
      error: null,
    }));
    riderFormData.set({
      first_name: rider.first_name,
      last_name: rider.last_name,
      email: rider.email,
      phone_number: rider.phone_number,
      date_of_birth: rider.date_of_birth,
      gender: rider.gender,
      address_line1: rider.address_line1,
      address_line2: rider.address_line2 || "",
      city: rider.city,
      state_province: rider.state_province,
      postal_code: rider.postal_code,
      country: rider.country,
      emergency_contact_name: rider.emergency_contact_name,
      emergency_contact_phone: rider.emergency_contact_phone,
      license_number: rider.license_number,
      license_expiry_date: rider.license_expiry_date,
      status: rider.status,
      profile_picture_url: rider.profile_picture_url || "",
      notes: rider.notes || "",
    });
  },

  setSubmitting: (isSubmitting: boolean) => {
    riderStore.set((state) => ({ ...state, isSubmitting }));
  },

  setError: (error: string | null) => {
    riderStore.set((state) => ({ ...state, error }));
  },
};

export const viewRiderStore = chunk({
  showViewModal: false,
  selectedRiderId: undefined as number | undefined,
});

export const viewRiderActions = {
  openViewModal: (riderId: number) => {
    viewRiderStore.set((state) => ({
      ...state,
      showViewModal: true,
      selectedRiderId: riderId,
    }));
  },
  closeViewModal: () => {
    viewRiderStore.set((state) => ({
      ...state,
      showViewModal: false,
      selectedRiderId: undefined,
    }));
  },
};
