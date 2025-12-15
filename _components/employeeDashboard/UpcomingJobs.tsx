// app/dashboard/components/UpcomingJobs.tsx

"use client";

import React from "react";
import { ScheduleType } from "../../app/lib/typeDefinitions";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface UpcomingJobsProps {
  schedules: ScheduleType[];
}

const UpcomingJobs = ({ schedules }: UpcomingJobsProps) => {
  // Sort schedules by startDateTime ascending
  const sortedSchedules = [...schedules].sort(
    (a, b) =>
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime(),
  );

  // Filter for upcoming jobs (future dates) and take the next 5
  const upcomingSchedules = sortedSchedules
    .filter((schedule) => new Date(schedule.startDateTime) >= new Date())
    .slice(0, 5);

  return (
    <motion.div
      className="rounded-lg bg-linear-to-r from-blue-500 to-indigo-600 p-6 shadow-md"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="mb-6 text-2xl font-bold text-white">Upcoming Jobs</h2>
      {upcomingSchedules.length === 0 ? (
        <p className="text-white">No upcoming jobs scheduled.</p>
      ) : (
        <ul className="space-y-4 overflow-auto">
          {upcomingSchedules.map((schedule) => (
            <motion.li
              key={schedule._id as string}
              className="rounded-lg bg-white bg-opacity-20 p-4 shadow-inner transition duration-300 hover:bg-opacity-30"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-semibold text-yellow-300">
                {schedule.jobTitle}
              </h3>
              <p className="mt-2 text-lg text-white">
                Date & Time:{" "}
                <span className="font-bold">
                  {format(new Date(schedule.startDateTime), "PPP p")}
                </span>
              </p>
              <p className="text-md mt-1 text-white">
                Location:{" "}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    schedule.location,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-200 underline hover:text-blue-400"
                >
                  {schedule.location}
                </a>
              </p>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
};

export default UpcomingJobs;
