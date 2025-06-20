"use server";

import { revalidatePath } from "next/cache";
import connectMongo from "../connect";
import { Estimate } from "../../../models/reactDataSchema";
import { EstimateType } from "../typeDefinitions";
import { generateEstimateNumber } from "../estimates.data";
import { createInvoice } from "./actions";

export async function createEstimate(
  estimateData: Omit<EstimateType, "_id" | "estimateNumber" | "createdDate">,
) {
  await connectMongo();
  try {
    const estimateNumber = await generateEstimateNumber();

    const newEstimate = new Estimate({
      ...estimateData,
      estimateNumber,
      createdDate: new Date(),
    });

    await newEstimate.save();
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create estimate");
  }

  revalidatePath("/estimates");
}

export async function updateEstimate(
  estimateId: string,
  estimateData: Partial<EstimateType>,
) {
  await connectMongo();
  try {
    await Estimate.findByIdAndUpdate(estimateId, estimateData);
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update estimate");
  }

  revalidatePath("/estimates");
  revalidatePath(`/estimates/${estimateId}`);
}

export async function deleteEstimate(estimateId: string) {
  await connectMongo();
  try {
    const estimateExists = await Estimate.exists({ _id: estimateId });
    if (!estimateExists) {
      return { message: "Estimate not found" };
    }

    await Estimate.findByIdAndDelete(estimateId);
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Database Error: Failed to delete estimate" };
  }

  revalidatePath("/estimates");
}

export async function updateEstimateStatus(
  estimateId: string,
  status: EstimateType["status"],
) {
  await connectMongo();
  try {
    await Estimate.findByIdAndUpdate(estimateId, { status });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update estimate status");
  }

  revalidatePath("/estimates");
}


