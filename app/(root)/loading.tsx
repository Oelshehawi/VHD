export default function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
      <div className="relative h-12 w-12">
        <div className="border-muted absolute inset-0 rounded-full border-4"></div>
        <div className="border-primary absolute inset-0 animate-spin rounded-full border-4 border-t-transparent"></div>
      </div>
    </div>
  );
}
