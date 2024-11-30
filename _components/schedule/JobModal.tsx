import { ScheduleType, TechnicianType } from "../../app/lib/typeDefinitions";
import { XMarkIcon } from "@heroicons/react/24/solid";

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
  if (!open) return null;

  const getTechnicianName = (techId: string) => {
    const tech = technicians.find(t => t.id === techId);
    return tech?.name || techId;
  };

  return (
    <div
      onClick={toggleModal}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0 bg-black-2 bg-opacity-50 "
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
          <strong>Confirmed:</strong>{" "}
          {jobInfo.confirmed ? "Yes" : "No"}
        </p>
        <button 
          onClick={toggleModal}
          className="mt-4 w-full rounded bg-darkGreen px-4 py-2 text-white hover:bg-opacity-90"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default JobModal;
