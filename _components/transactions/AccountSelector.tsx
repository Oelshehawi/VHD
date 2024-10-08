"use client";

import { useRouter } from 'next/navigation';

interface AccountSelectorProps {
  accountsData: any[];
  accountId: string;
}

const AccountSelector = ({ accountsData, accountId }: AccountSelectorProps) => {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBank = accountsData.find(bank => bank.id === e.target.value);
    router.push(`/transactions/${selectedBank.bankAccountId}/${selectedBank.id}?page=1`);
  };

  return (
    <select
      className="w-full p-2 rounded-md border bg-white text-black"
      value={accountId}
      onChange={handleChange}
    >
      {accountsData.map((bank) => (
        <option key={bank.id} value={bank.id}>
          {bank.name} ({bank.mask})
        </option>
      ))}
    </select>
  );
};

export default AccountSelector;
