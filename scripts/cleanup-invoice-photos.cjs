/**
 * MongoDB Cleanup Script
 *
 * This script removes photos and signatures from the Invoice schema after confirming
 * they have been successfully migrated to the Schedule schema.
 *
 * IMPORTANT: Only run this after verifying the migration-photos-signatures.js script
 * has successfully copied all photos and signatures to the Schedule schema.
 *
 * Steps to run this script:
 * 1. Ensure MongoDB is running
 * 2. Install mongoose: npm install mongoose
 * 3. Run: node scripts/cleanup-invoice-photos.js
 */

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/test";

// Schema definitions (simplified versions of what's in your actual app)
const PhotoSchema = new Schema({
  url: String,
  timestamp: Date,
  technicianId: String,
});

const SignatureSchema = new Schema({
  url: String,
  timestamp: Date,
  signerName: String,
  technicianId: String,
});

// Invoice schema with photos and signature
const InvoiceSchema = new Schema({
  invoiceId: String,
  jobTitle: String,
  photos: {
    before: [PhotoSchema],
    after: [PhotoSchema],
  },
  signature: SignatureSchema,
});

// Create model
const Invoice = model("Invoice", InvoiceSchema);

async function cleanupInvoices() {
  console.log("Starting cleanup process...");
  console.log(
    "WARNING: This will remove photos and signatures from Invoice documents!",
  );
  console.log(
    "Make sure you have verified that migration was successful before continuing.\n",
  );

  // Simulate a confirmation prompt (in a real script, use readline or prompts package)
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question(
    "Are you sure you want to proceed? (yes/no): ",
    async (answer) => {
      if (answer.toLowerCase() !== "yes") {
        console.log("Operation cancelled.");
        readline.close();
        await mongoose.disconnect();
        return;
      }

      readline.close();

      try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // Get all invoices with photos or signatures
        const invoices = await Invoice.find({
          $or: [
            { "photos.before": { $exists: true, $ne: [] } },
            { "photos.after": { $exists: true, $ne: [] } },
            { signature: { $exists: true, $ne: null } },
          ],
        });

        console.log(
          `Found ${invoices.length} invoices with photos or signatures to clean up`,
        );

        // Update all invoices to remove photos and signature
        const result = await Invoice.updateMany(
          {},
          {
            $unset: {
              photos: "",
              signature: "",
            },
          },
        );

        console.log("\nCleanup complete!");
        console.log(`Modified ${result.modifiedCount} invoices`);
      } catch (error) {
        // Safe error handling
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Cleanup failed:", errorMessage);
      } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
      }
    },
  );
}

// Run the cleanup
cleanupInvoices();
