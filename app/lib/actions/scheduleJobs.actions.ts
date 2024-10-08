"use server";
import { revalidatePath } from "next/cache";
import connectMongo from "../connect";
import { Schedule } from "../../../models/reactDataSchema";
import { ScheduleType } from "../typeDefinitions";

export async function createSchedule(scheduleData: ScheduleType) {
    try {
      if (typeof scheduleData.startDateTime === "string") {
        scheduleData.startDateTime = new Date(
          scheduleData.startDateTime,
        ) as Date & string;
      }
      const newSchedule = new Schedule(scheduleData);
      await newSchedule.save();
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to create schedule");
    }
  
    revalidatePath("/schedule");
  }

export const deleteJob = async (jobId: string) => {
  await connectMongo();
  try {
    await Schedule.findByIdAndDelete(jobId);
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete job with id");
  }

  revalidatePath("/schedule");
};

export const updateSchedule = async ({
  scheduleId,
  confirmed,
}: {
  scheduleId: string;
  confirmed: boolean;
}) => {
  await connectMongo();
  try {
    await Schedule.findByIdAndUpdate(scheduleId, { confirmed }, { new: true });
    revalidatePath("/schedule");
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update the schedule");
  }
};

export const updateJob = async ({
  scheduleId,
  jobTitle,
  location,
  startDateTime,
  assignedTechnician,
}: {
  scheduleId: string;
  jobTitle: string;
  location: string;
  startDateTime: string;
  assignedTechnician: string;
}) => {
  await connectMongo();
  try {
    await Schedule.findByIdAndUpdate(
      scheduleId,
      {
        jobTitle,
        location,
        startDateTime: new Date(startDateTime),
        assignedTechnician,
      },
      { new: true }
    );
    revalidatePath("/schedule");
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update the job");
  }
};
