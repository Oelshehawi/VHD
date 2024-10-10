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
  canManage: boolean;
  user: any;
}

const PlaidLink = ({ canManage, user }: PlaidLinkProps) => {
  const [token, setToken] = useState("");

  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async (public_token: string) => {
      await exchangePublicToken({ publicToken: public_token, user });

      toast.success("Bank account connected successfully");
    },
    [user],
  );

  useEffect(() => {
    const getLinkToken = async () => {
      const data = await createLinkToken(user);
      setToken(data?.linkToken);
    };

    getLinkToken();
  }, [user]);

  const config: PlaidLinkOptions = {
    token,
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => open()}
        disabled={!ready}
      >
        <span
          className={`flex items-center justify-center rounded-lg bg-gray-600 p-4 text-xl font-bold text-black hover:cursor-pointer hover:bg-darkBlue hover:!text-white md:p-2`}
        >
          <div className="flex items-center">
            <BanknotesIcon className="size-8 md:size-6" />
          </div>
        </span>
      </motion.button>
    </>
  );
};

export default PlaidLink;
