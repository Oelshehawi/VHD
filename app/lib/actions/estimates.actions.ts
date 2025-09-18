"use server";

import { revalidatePath } from "next/cache";
import connectMongo from "../connect";
import { Estimate } from "../../../models/reactDataSchema";
import { EstimateType } from "../typeDefinitions";
import { generateEstimateNumber } from "../estimates.data";
import { createInvoice } from "./actions";

// Type for creating new estimates (without _id)
type CreateEstimateData = Omit<EstimateType, "_id" | "estimateNumber" | "createdDate">;

export async function createEstimate(estimateData: CreateEstimateData) {
  await connectMongo();
  try {
    const estimateNumber = await generateEstimateNumber();

    // Ensure all required fields are present and properly typed
    const estimateToSave = {
      ...estimateData,
      estimateNumber,
      createdDate: new Date(),
      // Ensure items array is properly structured
      items: estimateData.items?.map(item => ({
        description: item.description,
        details: item.details || "",
        price: Number(item.price)
      })) || [],
      // Calculate totals from items with proper rounding
      subtotal: Math.round((estimateData.items?.reduce((sum: number, item: any) => sum + (Number(item.price) || 0), 0) || 0) * 100) / 100,
      gst: Math.round((estimateData.items?.reduce((sum: number, item: any) => sum + (Number(item.price) || 0), 0) || 0) * 0.05 * 100) / 100,
      total: Math.round((estimateData.items?.reduce((sum: number, item: any) => sum + (Number(item.price) || 0), 0) || 0) * 1.05 * 100) / 100,
      // Ensure services array is properly structured
      services: estimateData.services || [],
      // Ensure status is valid
      status: estimateData.status || "draft"
    };

    const newEstimate = new Estimate(estimateToSave as any);
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
    // Clean and validate the update data
    const updateData: any = { ...estimateData };
    
    // Handle clientId - if empty string, set to null/undefined
    if (updateData.clientId === "" || updateData.clientId === null) {
      updateData.clientId = undefined;
    }
    
    // Ensure items array is properly structured if provided
    if (updateData.items) {
      updateData.items = updateData.items.map((item: any) => ({
        description: item.description,
        details: item.details || "",
        price: Number(item.price)
      }));
      
      // Calculate totals from items with proper rounding
      const subtotal = Math.round(updateData.items.reduce((sum: number, item: any) => sum + (Number(item.price) || 0), 0) * 100) / 100;
      const gst = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
      const total = Math.round((subtotal + gst) * 100) / 100;
      
      updateData.subtotal = subtotal;
      updateData.gst = gst;
      updateData.total = total;
    }
    
    // Ensure services array is properly structured if provided
    if (updateData.services && !Array.isArray(updateData.services)) {
      updateData.services = [];
    }
    
    await Estimate.findByIdAndUpdate(estimateId, updateData);
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


