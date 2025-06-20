"use server";

import connectMongo from "./connect";
import { Estimate } from "../../models/reactDataSchema";
import { EstimateType } from "./typeDefinitions";

const ITEMS_PER_PAGE = 10;

export async function fetchAllEstimates() {
  await connectMongo();
  try {
    const estimates = await Estimate.find()
      .populate("clientId", "clientName email phoneNumber")
      .sort({ createdDate: -1 })
      .lean();

    return estimates.map((estimate) => ({
      ...estimate,
      _id: estimate._id.toString(),
      clientId: estimate.clientId?.toString(),
      convertedToInvoice: estimate.convertedToInvoice?.toString(),
    }));
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch estimates");
  }
}

export async function fetchEstimateById(estimateId: string) {
  await connectMongo();
  try {
    const estimate = await Estimate.findById(estimateId)
      .populate("clientId", "clientName email phoneNumber")
      .lean();

    if (!estimate) {
      throw new Error("Estimate not found");
    }

    return {
      ...estimate,
      _id: estimate._id.toString(),
      clientId: estimate.clientId?.toString(),
      convertedToInvoice: estimate.convertedToInvoice?.toString(),
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch estimate by ID");
  }
}

export async function fetchFilteredEstimates(
  query: string = "",
  status: string = "",
  currentPage: number = 1,
  dateFrom: string = "",
  dateTo: string = "",
) {
  await connectMongo();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    let matchQuery: any = {};

    // Add text search if query provided
    if (query) {
      matchQuery.$or = [
        { estimateNumber: { $regex: query, $options: "i" } },
        { "prospectInfo.businessName": { $regex: query, $options: "i" } },
        { "prospectInfo.contactPerson": { $regex: query, $options: "i" } },
      ];
    }

    // Add status filter if provided
    if (status && status !== "all") {
      matchQuery.status = status;
    }

    // Add date range filter if provided
    if (dateFrom || dateTo) {
      matchQuery.createdDate = {};
      if (dateFrom) {
        // Convert YYYY-MM-DD to start of day UTC
        matchQuery.createdDate.$gte = new Date(dateFrom + "T00:00:00.000Z");
      }
      if (dateTo) {
        // Convert YYYY-MM-DD to end of day UTC
        matchQuery.createdDate.$lte = new Date(dateTo + "T23:59:59.999Z");
      }
    }

    const estimates = await Estimate.find(matchQuery)
      .populate("clientId", "clientName email phoneNumber")
      .sort({ createdDate: -1 })
      .skip(offset)
      .limit(ITEMS_PER_PAGE)
      .lean();

    return estimates.map((estimate) => ({
      ...estimate,
      _id: estimate._id.toString(),
      clientId: estimate.clientId?.toString(),
      convertedToInvoice: estimate.convertedToInvoice?.toString(),
    }));
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch filtered estimates");
  }
}

export async function fetchEstimatesPages(
  query: string = "",
  status: string = "",
  dateFrom: string = "",
  dateTo: string = "",
) {
  await connectMongo();
  try {
    let matchQuery: any = {};

    if (query) {
      matchQuery.$or = [
        { estimateNumber: { $regex: query, $options: "i" } },
        { "prospectInfo.businessName": { $regex: query, $options: "i" } },
        { "prospectInfo.contactPerson": { $regex: query, $options: "i" } },
      ];
    }

    if (status && status !== "all") {
      matchQuery.status = status;
    }

    // Add date range filter if provided
    if (dateFrom || dateTo) {
      matchQuery.createdDate = {};
      if (dateFrom) {
        // Convert YYYY-MM-DD to start of day UTC
        matchQuery.createdDate.$gte = new Date(dateFrom + "T00:00:00.000Z");
      }
      if (dateTo) {
        // Convert YYYY-MM-DD to end of day UTC
        matchQuery.createdDate.$lte = new Date(dateTo + "T23:59:59.999Z");
      }
    }

    const totalEstimates = await Estimate.countDocuments(matchQuery);
    const totalPages = Math.ceil(totalEstimates / ITEMS_PER_PAGE);

    return totalPages;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of estimates");
  }
}

export async function getEstimatesCount() {
  await connectMongo();
  try {
    return await Estimate.countDocuments();
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch estimates count");
  }
}

export async function getEstimatesByStatus() {
  await connectMongo();
  try {
    const statusCounts = await Estimate.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const result = { draft: 0, sent: 0, approved: 0, rejected: 0 };

    statusCounts.forEach((item) => {
      if (item._id in result) {
        result[item._id as keyof typeof result] = item.count;
      }
    });

    return result;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch estimates by status");
  }
}

export async function generateEstimateNumber() {
  await connectMongo();
  try {
    const currentYear = new Date().getFullYear();
    const prefix = `EST-${currentYear}-`;

    // Find the latest estimate for the current year
    const latestEstimate = await Estimate.findOne({
      estimateNumber: { $regex: `^${prefix}` },
    }).sort({ estimateNumber: -1 });

    let nextNumber = 1000;
    if (latestEstimate) {
      const lastNumber = parseInt(
        latestEstimate.estimateNumber?.split("-")[2] || "0",
      );
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber}`;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to generate estimate number");
  }
}
