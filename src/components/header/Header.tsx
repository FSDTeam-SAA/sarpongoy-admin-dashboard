"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  accessToken?: string | null;
};

type ProfileData = {
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
};

export default function Header() {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;
  const [displayName, setDisplayName] = useState(
    user?.name ?? user?.email ?? "Admin"
  );
  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    const accessToken = user?.accessToken;
    if (!accessToken || !process.env.NEXT_PUBLIC_BACKEND_API_URL) {
      setDisplayName(user?.name ?? user?.email ?? "Admin");
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/user/profile`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const result = (await response.json()) as {
          data?: ProfileData;
          message?: string;
        };

        if (!response.ok) {
          throw new Error(result.message || "Failed to load profile");
        }

        const name =
          [result.data?.firstName, result.data?.lastName]
            .filter(Boolean)
            .join(" ") ||
          user?.name ||
          user?.email ||
          "Admin";

        setDisplayName(name);
        setProfileImage(result.data?.profilePicture || "");
      } catch {
        setDisplayName(user?.name ?? user?.email ?? "Admin");
      }
    };

    loadProfile();

    const reloadProfile = () => {
      loadProfile();
    };

    window.addEventListener("profile-updated", reloadProfile);

    return () => {
      window.removeEventListener("profile-updated", reloadProfile);
    };
  }, [user?.accessToken, user?.email, user?.name]);

  return (
    <header
      className="fixed left-[330px] right-0 top-0 z-50 flex h-24 items-center justify-end px-8"
      style={{
        background:
          "linear-gradient(270deg, #608BB9 5.34%, #B4D9FF 71.79%)",
      }}
    >
      <Link
        href="/settings"
        className="flex items-center gap-3 rounded-full bg-white/10 px-3 py-2 transition hover:bg-white/20"
      >
        {profileImage ? (
          <Image
            src={profileImage}
            alt="avatar"
            width={44}
            height={44}
            className="h-[44px] w-[44px] rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-white text-[16px] font-semibold text-[#0B5280]">
            {(displayName[0] || "A").toUpperCase()}
          </div>
        )}
        <span className="text-[17px] font-medium text-white">
          {displayName}
        </span>
      </Link>
    </header>
  );
}
