import { ScheduleType, TechnicianType } from "../../app/lib/typeDefinitions";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { FaCamera, FaSignature } from "react-icons/fa";
import MediaDisplay from "../invoices/MediaDisplay";

const JobModal = ({
  open,
  toggleModal,
  jobInfo,
  technicians,
}: {
  open: boolean;
  toggleModal: () => void;
  jobInfo: ScheduleType;
  technicians: TechnicianType[];
}) => {
  const [activeTab, setActiveTab] = useState<
    "details" | "before" | "after" | "signature"
  >("details");

  if (!open) return null;

  const getTechnicianName = (techId: string) => {
    const tech = technicians.find((t) => t.id === techId);
    return tech?.name || techId;
  };

  const hasBeforePhotos =
    jobInfo.photos && jobInfo.photos.before && jobInfo.photos.before.length > 0;

  const hasAfterPhotos =
    jobInfo.photos && jobInfo.photos.after && jobInfo.photos.after.length > 0;

  const hasSignature = !!jobInfo.signature;

  return (
    <div
      onClick={toggleModal}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black-2 bg-opacity-50 p-4 md:p-0"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-md border-4 border-darkGreen bg-white p-6"
      >
        <button
          onClick={toggleModal}
          className="absolute right-4 top-4 text-gray-600 hover:text-gray-900"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Tab navigation */}
        <div className="mb-4 flex border-b">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-4 py-2 ${activeTab === "details" ? "border-b-2 border-darkGreen font-semibold" : "text-gray-500"}`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("before")}
            className={`flex items-center px-4 py-2 ${activeTab === "before" ? "border-b-2 border-darkGreen font-semibold" : "text-gray-500"} ${!hasBeforePhotos ? "opacity-50" : ""}`}
            disabled={!hasBeforePhotos}
          >
            <FaCamera className="mr-1" /> Before
          </button>
          <button
            onClick={() => setActiveTab("after")}
            className={`flex items-center px-4 py-2 ${activeTab === "after" ? "border-b-2 border-darkGreen font-semibold" : "text-gray-500"} ${!hasAfterPhotos ? "opacity-50" : ""}`}
            disabled={!hasAfterPhotos}
          >
            <FaCamera className="mr-1" /> After
          </button>
          <button
            onClick={() => setActiveTab("signature")}
            className={`flex items-center px-4 py-2 ${activeTab === "signature" ? "border-b-2 border-darkGreen font-semibold" : "text-gray-500"} ${!hasSignature ? "opacity-50" : ""}`}
            disabled={!hasSignature}
          >
            <FaSignature className="mr-1" /> Signature
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "details" && (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-darkGreen">
              {jobInfo.jobTitle}
            </h2>
            <p className="mb-2 text-gray-800">
              <strong>Location:</strong> {jobInfo.location}
            </p>
            <p className="mb-2 text-gray-800">
              <strong>Assigned Technicians:</strong>{" "}
              {jobInfo.assignedTechnicians.map(getTechnicianName).join(", ")}
            </p>
            <p className="mb-2 text-gray-800">
              <strong>Start Date:</strong>{" "}
              {new Date(jobInfo.startDateTime).toLocaleDateString("en-CA", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
            <p className="mb-2 text-gray-800">
              <strong>Time:</strong>{" "}
              {new Date(jobInfo.startDateTime).toLocaleTimeString("en-CA", {
                hour: "numeric",
                minute: "numeric",
              })}
            </p>
            <p className="mb-2 text-gray-800">
              <strong>Confirmed:</strong> {jobInfo.confirmed ? "Yes" : "No"}
            </p>
            {jobInfo.technicianNotes && (
              <div className="mt-4">
                <h3 className="font-semibold text-darkGreen">
                  Technician Notes:
                </h3>
                <p className="mt-1 whitespace-pre-wrap rounded bg-gray-100 p-3 text-gray-700">
                  {jobInfo.technicianNotes}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "before" && (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-darkGreen">
              Before Photos
            </h3>
            {hasBeforePhotos ? (
              <MediaDisplay
                photos={{
                  before: jobInfo.photos!.before,
                  after: [],
                }}
                signature={null}
              />
            ) : (
              <p className="p-6 text-center text-gray-500">
                No before photos available
              </p>
            )}
          </div>
        )}

        {activeTab === "after" && (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-darkGreen">
              After Photos
            </h3>
            {hasAfterPhotos ? (
              <MediaDisplay
                photos={{
                  before: [],
                  after: jobInfo.photos!.after,
                }}
                signature={null}
              />
            ) : (
              <p className="p-6 text-center text-gray-500">
                No after photos available
              </p>
            )}
          </div>
        )}

        {activeTab === "signature" && (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-darkGreen">
              Customer Signature
            </h3>
            {hasSignature ? (
              <MediaDisplay
                photos={{ before: [], after: [] }}
                signature={jobInfo.signature!}
              />
            ) : (
              <p className="p-6 text-center text-gray-500">
                No signature available
              </p>
            )}
          </div>
        )}

        <button
          onClick={toggleModal}
          className="mt-6 w-full rounded bg-darkGreen px-4 py-2 text-white hover:bg-opacity-90"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default JobModal;
