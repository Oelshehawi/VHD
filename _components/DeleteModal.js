import { useState } from "react";

const DeleteModal = ({
  showModal,
  hideModal,
  confirmModal,
  setShowModal,
  deleteText,
  deleteDesc,
  onConfirm,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
  };
  if (!showModal) {
    return;
  }
  return (
    <div className="fixed inset-0 z-[1000] flex h-full w-full flex-wrap items-center justify-center overflow-auto p-4 font-[sans-serif] before:fixed before:inset-0 before:h-full before:w-full before:bg-[rgba(0,0,0,0.5)]">
      <div className="relative w-full max-w-md rounded-md bg-white p-6 shadow-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="float-right w-3.5 shrink-0 cursor-pointer fill-black hover:fill-red-500"
          viewBox="0 0 320.591 320.591"
          onClick={onCancel}
        >
          <path
            d="M30.391 318.583a30.37 30.37 0 0 1-21.56-7.288c-11.774-11.844-11.774-30.973 0-42.817L266.643 10.665c12.246-11.459 31.462-10.822 42.921 1.424 10.362 11.074 10.966 28.095 1.414 39.875L51.647 311.295a30.366 30.366 0 0 1-21.256 7.288z"
            data-original="#000000"
          ></path>
          <path
            d="M287.9 318.583a30.37 30.37 0 0 1-21.257-8.806L8.83 51.963C-2.078 39.225-.595 20.055 12.143 9.146c11.369-9.736 28.136-9.736 39.504 0l259.331 257.813c12.243 11.462 12.876 30.679 1.414 42.922-.456.487-.927.958-1.414 1.414a30.368 30.368 0 0 1-23.078 7.288z"
            data-original="#000000"
          ></path>
        </svg>
        <div className="my-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="inline w-16 fill-red-500"
            viewBox="0 0 24 24"
          >
            <path
              d="M19 7a1 1 0 0 0-1 1v11.191A1.92 1.92 0 0 1 15.99 21H8.01A1.92 1.92 0 0 1 6 19.191V8a1 1 0 0 0-2 0v11.191A3.918 3.918 0 0 0 8.01 23h7.98A3.918 3.918 0 0 0 20 19.191V8a1 1 0 0 0-1-1Zm1-3h-4V2a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v2H4a1 1 0 0 0 0 2h16a1 1 0 0 0 0-2ZM10 4V3h4v1Z"
              data-original="#000000"
            />
            <path
              d="M11 17v-7a1 1 0 0 0-2 0v7a1 1 0 0 0 2 0Zm4 0v-7a1 1 0 0 0-2 0v7a1 1 0 0 0 2 0Z"
              data-original="#000000"
            />
          </svg>
          <h4 className="mt-6 text-xl font-semibold text-black">
            {deleteText}
          </h4>
          <p className="mt-4 text-sm text-gray-500">{deleteDesc}</p>
        </div>
        <div className="flex flex-col space-y-2">
          <button
            type="button"
            className="flex items-center justify-center rounded-md border-none bg-red-500 px-6 py-2.5 text-sm font-semibold text-white outline-none hover:bg-red-600 active:bg-red-500"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <svg
                className="mr-3 h-5 w-5 animate-spin text-white"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 2.42.878 4.628 2.322 6.291l1.678-1.659z"
                ></path>
              </svg>
            ) : (
              "Delete"
            )}
          </button>
          <button
            type="button"
            className="rounded-md border-none bg-gray-200 px-6 py-2.5 text-sm font-semibold text-black outline-none hover:bg-gray-300 active:bg-gray-200"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
