import { fetchClientsPages } from "../../lib/data";
import { auth } from "@clerk/nextjs/server";
import AddClient from "../../../_components/database/AddClient";
import ClientTable from "../../../_components/database/ClientTable";
import Search from "../../../_components/database/Search";
import Sorting from "../../../_components/database/Sorting";
import Pagination from "../../../_components/database/Pagination";
import { Suspense } from "react";
import { TableContainerSkeleton } from "../../../_components/Skeletons";

const Database = async ({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
    sort?: 1 | -1;
  };
}) => {
  // AUTH STUFF
  const { orgPermissions } = await auth();
  const canManage = orgPermissions?.includes("org:database:allow");

  if (!canManage)
    return (
      <div className="flex min-h-[100vh] items-center justify-center text-3xl font-bold">
        You don't have correct permissions to access this page!
      </div>
    );

  const query = searchParams?.query || "";
  const sort = searchParams?.sort || 1;
  const currentPage = Number(searchParams?.page) || 1;

  const totalPages = await fetchClientsPages(query);

  return (
    <Suspense fallback={<TableContainerSkeleton />}>
      <div className="flex min-h-full items-center justify-center">
        <div className="my-5 min-h-[90vh] gap-4 flex flex-col w-[90%] rounded-lg bg-white p-4 shadow-lg lg:my-0 lg:w-4/5">
          <AddClient />
          <div className="">
            <div className="flex flex-col justify-between md:flex-row lg:gap-4 ">
              <Search placeholder="Search For Client..." />
              <Sorting />
            </div>
            <ClientTable query={query} sort={sort} currentPage={currentPage} />
          </div>
          <Pagination totalPages={totalPages} />
        </div>
      </div>
    </Suspense>
  );
};

export default Database;
