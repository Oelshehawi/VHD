import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardHeader } from "./ui/card";

export function InfoBoxSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="mt-1 h-3 w-20 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-16 w-16 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export const JobsDueContainerSkeleton = () => {
  return (
    <Card className="flex h-[50vh] w-full flex-col lg:h-[70vh] lg:w-[50%]">
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="mb-1 h-6 w-20 rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>

        {/* Status Cards */}
        <div className="mb-4 flex gap-4">
          <Skeleton className="h-16 flex-1 rounded-lg" />
          <Skeleton className="h-16 flex-1 rounded-lg" />
        </div>

        {/* Filter Section */}
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>

        {/* Table */}
        <Card className="grow overflow-hidden">
          <div className="border-b p-4">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="divide-y">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-12 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            ))}
          </div>
        </Card>
      </CardContent>
    </Card>
  );
};

export const YearlySalesSkeleton = () => {
  return (
    <div className="flex w-full flex-col lg:w-[50%]">
      <Card>
        <CardContent className="p-4">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div>
              <Skeleton className="mb-1 h-5 w-28 rounded-md" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
          </div>

          {/* Chart Area */}
          <div className="h-[400px] rounded-lg border p-4 lg:h-[450px]">
            <Skeleton className="h-full w-full rounded" />
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pt-4">
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
};

export const TableContainerSkeleton = () => {
  return (
    <div className="bg-background p-6">
      <Card className="flex w-full flex-col gap-8 p-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div>
            <Skeleton className="mb-2 h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="flex flex-1">
            <Skeleton className="h-10 flex-1 rounded-r-none" />
            <Skeleton className="h-10 w-10 rounded-l-none" />
          </div>
          <Skeleton className="h-10 w-full md:w-48" />
        </div>

        {/* Table */}
        <Card>
          {/* Table Header */}
          <div className="border-b p-4">
            <div className="flex justify-between">
              {Array(4)
                .fill(0)
                .map((_, index) => (
                  <Skeleton key={index} className="h-4 w-20" />
                ))}
            </div>
          </div>
          {/* Table Rows */}
          <div className="divide-y">
            {Array(12)
              .fill(0)
              .map((_, rowIndex) => (
                <div key={rowIndex} className="p-4">
                  <div className="flex items-center justify-between">
                    {Array(4)
                      .fill(0)
                      .map((_, cellIndex) => (
                        <Skeleton key={cellIndex} className="h-4 w-16" />
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <Skeleton key={index} className="h-10 w-10" />
            ))}
        </div>
      </Card>
    </div>
  );
};

export const ClientDetailedSkeleton = () => {
  return (
    <div className="mt-4 space-y-6 px-5">
      <div className="mb-4 flex justify-between">
        <Card>
          <CardContent className="inline-flex items-center p-4">
            <Skeleton className="mr-2 h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="mr-2 inline-flex items-center p-4">
            <Skeleton className="mr-2 h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      </div>
      <div className="-mx-2 flex flex-wrap">
        {/* InlineEditClient Skeleton */}
        <div className="mb-4 w-full px-2 md:w-1/2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array(4)
                .fill(0)
                .map((_, idx) => (
                  <div key={idx} className="flex items-center">
                    <Skeleton className="mr-2 h-4 w-24" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              <div className="mt-4 flex justify-end space-x-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        </div>
        {/* TransactionHistory Skeleton */}
        <div className="mb-2 w-full px-2 md:w-1/2 lg:mb-0">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array(4)
                .fill(0)
                .map((_, idx) => (
                  <div key={idx} className="rounded-lg border p-3">
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export const InvoiceDetailedSkeleton = () => {
  return (
    <div className="mt-4 space-y-6 px-5">
      <div className="mb-4 flex justify-between">
        <Card>
          <CardContent className="inline-flex items-center p-4">
            <Skeleton className="mr-2 h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
        <div className="flex space-x-2">
          <Card>
            <CardContent className="inline-flex items-center p-4">
              <Skeleton className="mr-2 h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="inline-flex items-center p-4">
              <Skeleton className="mr-2 h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="-mx-2 flex flex-wrap text-sm lg:flex-nowrap lg:text-[1rem]">
        {/* Invoice Details Skeleton */}
        <div className="mb-4 w-full px-2 lg:w-[60%]">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array(5)
                .fill(0)
                .map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border-b py-2"
                  >
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                ))}
              <div className="mt-4 flex justify-end">
                <Skeleton className="h-8 w-32 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Client Details Skeleton */}
        <div className="mb-4 w-full px-2 lg:w-[40%]">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array(3)
                .fill(0)
                .map((_, idx) => (
                  <div key={idx} className="flex items-center">
                    <Skeleton className="mr-2 h-4 w-24" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Price Breakdown Skeleton */}
      <div className="mb-4 w-full px-2 lg:w-[60%]">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array(3)
              .fill(0)
              .map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border-b py-2"
                >
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            <div className="mt-4 flex justify-end">
              <Skeleton className="h-8 w-32 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
