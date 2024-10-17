
"use client";
import React from "react";
import { ScheduleType } from "../../app/lib/typeDefinitions";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface RecentJobsProps {
  schedules: ScheduleType[];
}

const RecentJobs = ({ schedules }: RecentJobsProps) => {
  // Sort schedules by startDateTime descending
  const sortedSchedules = schedules
    .filter((schedule) => new Date(schedule.startDateTime) <= new Date()) // Only past jobs
    .sort(
      (a, b) =>
        new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()
    );

  // Take the latest 5 jobs
  const recentJobs = sortedSchedules.slice(0, 3);

  return (
    <motion.div
      className="rounded-lg bg-white p-6 shadow-md"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <h2 className="mb-4 text-2xl font-semibold text-yellow-600">Recent Jobs</h2>
      {recentJobs.length === 0 ? (
        <p className="text-gray-500">No recent jobs completed.</p>
      ) : (
        <ul className="space-y-4">
          {recentJobs.map((job) => (
            <li
              key={job._id as string}
              className="flex flex-col rounded-lg bg-gradient-to-r from-yellow-100 to-yellow-200 p-4 shadow-inner"
            >
              <p className="text-lg font-medium text-yellow-700">{job.jobTitle}</p>
              <p className="text-sm text-yellow-600">
                Location: {job.location}
              </p>
              <p className="text-sm text-yellow-600">
                Date & Time: {format(new Date(job.startDateTime), "PPP p")}
              </p>
              <p className="text-sm text-yellow-600">
                Hours Worked: {job.hours || 0}
              </p>
              {job.confirmed && (
                <span className="mt-2 inline-block rounded-full bg-green-200 px-3 py-1 text-sm font-semibold text-green-700">
                  Confirmed
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
};

export default RecentJobs;
