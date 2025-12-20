"use client";
import { useUser, UserButton } from "@clerk/nextjs";
import { Settings } from "lucide-react";
import NotificationToggle from "./Notifications/NotificationToggle";

const PreferencesIcon = () => <Settings className="h-4 w-4" />;

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
      <UserButton>
        <UserButton.UserProfilePage
          label="Preferences"
          url="preferences"
          labelIcon={<PreferencesIcon />}
        >
          <div className="w-full">
            <h1 className="mb-4 px-4 pt-4 text-xl font-semibold text-gray-900">
              Preferences
            </h1>
            <div className="border-t border-gray-200">
              <NotificationToggle />
            </div>
          </div>
        </UserButton.UserProfilePage>
      </UserButton>
    </div>
  );
};

export default UserSection;
