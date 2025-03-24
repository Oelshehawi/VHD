import Link from "next/link";
import Image from "next/image";

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <Image
            src="/images/logo.png"
            alt="VHD Logo"
            width={120}
            height={120}
            className="mx-auto"
          />
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Authentication Error
          </h2>
        </div>

        <div
          className="relative rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700"
          role="alert"
        >
          <p className="text-center">
            Your session has expired or you are not authorized to access this
            page.
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="mb-4 text-sm text-gray-600">
            Please use the secure access link provided by our team to log in. If
            you've lost your access link, please contact us for assistance.
          </p>

          <Link
            href="/client-portal/login"
            className="inline-block rounded-md border border-transparent bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
