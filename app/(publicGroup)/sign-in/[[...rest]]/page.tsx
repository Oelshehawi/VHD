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
            identityPreviewText: "text-white",
            identityPreviewEditButtonIcon: "text-white",
            formFieldLabel: "text-white",
            formFieldAction: "text-white",
            footerActionLink: "text-white hover:text-white",
            footer: "hidden",
            backLink: "text-white",
            alternativeMethodsBlockButton: "text-white",
            formButtonPrimary: "bg-blue-500 hover:bg-blue-600",
            internal: "text-white"
          },
        }}
      />
    </div>
  );
}
