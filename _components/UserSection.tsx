"use client";
import { SignOutButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const UserSection = () => {
  return (
    <div className="flex items-center justify-center border-r-2 border-borderGreen p-2 lg:border-b-2 lg:border-r-0">
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignOutButton />
      </SignedOut>
    </div>
  );
};

export default UserSection;
