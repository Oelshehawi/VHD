"use client";
import { useCallback, useEffect, useState } from "react";
import {
  PlaidLinkOnSuccess,
  PlaidLinkOptions,
  usePlaidLink,
} from "react-plaid-link";
import toast from "react-hot-toast";
import {
  createLinkToken,
  exchangePublicToken,
} from "../../app/lib/actions/actions";
import { motion } from "framer-motion";
import { BanknotesIcon } from "@heroicons/react/24/solid";

interface PlaidLinkProps {
  user: any;
}

const PlaidLink = ({ user }: PlaidLinkProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [tokenFetched, setTokenFetched] = useState(false);

  useEffect(() => {
    const getLinkToken = async () => {
      // Try to get the token from localStorage
      const storedToken = localStorage.getItem("plaid_link_token");
      const tokenExpiration = localStorage.getItem(
        "plaid_link_token_expiration",
      );

      if (
        storedToken &&
        tokenExpiration &&
        new Date() < new Date(tokenExpiration)
      ) {
        setToken(storedToken);
        setTokenFetched(true);
        return;
      }

      // If no valid token is in storage, fetch a new one
      try {
        const data = await createLinkToken(user);
        const newToken = data?.linkToken;
        setToken(newToken);

        // Store the token and its expiration time
        localStorage.setItem("plaid_link_token", newToken);
        // Token is valid for 4 hours
        const expirationTime = new Date(
          Date.now() + 4 * 60 * 60 * 1000,
        ).toISOString();
        localStorage.setItem("plaid_link_token_expiration", expirationTime);
      } catch (error) {
        console.error("Error fetching link token:", error);
      } finally {
        setTokenFetched(true);
      }
    };

    getLinkToken();
  }, [user.id]);

  if (!tokenFetched) {
    return (
      <div className="flex items-center justify-center">
        <span>Loading...</span>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center">
        <span>Error fetching link token</span>
      </div>
    );
  }

  return <PlaidLinkButton token={token} user={user} />;
};

interface PlaidLinkButtonProps {
  token: string;
  user: any;
}

const PlaidLinkButton = ({ token, user }: PlaidLinkButtonProps) => {
  const onSuccess = useCallback(
    async (public_token: string) => {
      try {
        await exchangePublicToken({ publicToken: public_token, user });
        toast.success("Bank account connected successfully");
      } catch (error) {
        console.error("Error exchanging public token:", error);
        toast.error("Error connecting bank account");
      }
    },
    [user.id],
  );

  const config: PlaidLinkOptions = {
    token,
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => open()}
      disabled={!ready}
    >
      <span
        className={`flex h-full items-center justify-center rounded-lg bg-gray-600 p-2 text-xl font-bold text-black hover:bg-darkBlue hover:!text-white`}
      >
        <div className="flex items-center">
          <BanknotesIcon className="size-6" />
        </div>
      </span>
    </motion.button>
  );
};

export default PlaidLink;
