import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-[100vh] items-center justify-center bg-darkGreen">
      <SignIn
        appearance={{
          elements: {
            card: "bg-green-900 text-white",
            headerTitle: "text-white",
            headerSubtitle: "text-white",
            socialButtons: "bg-white rounded-lg",
            dividerLine: "bg-white",
            dividerText: "text-white",
            formFieldLabel: "text-white",
            footer: "hidden",
          },
        }}
        afterSignInUrl={'/dashboard'}
      />
    </div>
  );
}
