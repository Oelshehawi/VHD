import { TableContainerSkeleton } from "../../components/Skeletons";
import { auth } from "@clerk/nextjs";

export default function Loading() {
  const { has } = auth();

  const canManage = has({ permission: "org:database:allow" });

  if (!canManage) return null;

  return <TableContainerSkeleton />;
}
