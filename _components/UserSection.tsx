"use client";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";

const UserSection = () => {
  const { isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-white/20" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <UserButton />
    </div>
  );
};

export default UserSection;
