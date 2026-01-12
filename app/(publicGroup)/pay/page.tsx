import { Metadata } from "next";
import PaymentPageClient from "../../../_components/payments/PaymentPageClient";

export const metadata: Metadata = {
  title: "Pay Invoice - Vancouver Hood & Vent Cleaning",
  description: "Securely pay your invoice online",
  robots: {
    index: false,
    follow: false,
  },
};

interface PayPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function PayPage({ searchParams }: PayPageProps) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Invalid Payment Link
          </h1>
          <p className="text-gray-600">
            This payment link is missing required information.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Please use the payment link provided in your invoice email.
          </p>
        </div>
      </div>
    );
  }

  return <PaymentPageClient token={token} />;
}
