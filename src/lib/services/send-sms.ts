import { API_URL } from "../helpers";

export interface SmsPayload {
  To: string;
  Message: string;
  Source: string;
  SourceId: number;
  TemplateId: number;
  PolicyNumber: string;
  ReferenceNo: string;
  UserId: number;
}

export const sendSms = async (smsPayload: SmsPayload): Promise<any> => {
  const response = await fetch(`${API_URL}/Sms/SendSms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(smsPayload),
  });

  if (!response.ok) {
    throw new Error(`SMS sending failed: ${response.statusText}`);
  }

  return response.json();
};
