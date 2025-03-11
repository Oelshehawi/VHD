/**
 * MongoDB Migration Script
 *
 * This script migrates photos and signatures from the Invoice schema to the Schedule schema.
 *
 * Steps to run this script:
 * 1. Ensure MongoDB is running
 * 2. Install mongoose: npm install mongoose
 * 3. Run: node scripts/migrate-photos-signatures.js
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

// Schedule schema to receive photos and signature
const ScheduleSchema = new Schema({
  invoiceRef: { type: Schema.Types.ObjectId, ref: "Invoice" },
  jobTitle: String,
  photos: {
    before: [PhotoSchema],
    after: [PhotoSchema],
  },
  signature: SignatureSchema,
  technicianNotes: String,
});

// Create models
const Invoice = model("Invoice", InvoiceSchema);
const Schedule = model("Schedule", ScheduleSchema);

async function migrateData() {
  console.log("Starting migration process...");

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

    console.log(`Found ${invoices.length} invoices with photos or signatures`);

    let successCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;
    let schedulesUpdated = 0;

    // Process each invoice
    for (const invoice of invoices) {
      try {
        // Find ALL corresponding schedules using invoiceRef
        const schedules = await Schedule.find({ invoiceRef: invoice._id });

        if (!schedules || schedules.length === 0) {
          console.log(
            `No schedules found for invoice ${invoice._id} (${invoice.jobTitle})`,
          );
          notFoundCount++;
          continue;
        }

        console.log(
          `Migrating data for invoice ${invoice.invoiceId} - ${invoice.jobTitle} to ${schedules.length} schedule(s)`,
        );

        // For each schedule that references this invoice
        for (const schedule of schedules) {
          // Create a backup of the current schedule state
          console.log(`Processing schedule ${schedule._id}`);

          // Update the schedule with photos and signature from the invoice
          // Define updateData with proper types
          const updateData = {
            photos: {
              before: undefined,
              after: undefined,
            },
            signature: undefined,
          };

          // Only migrate photos if they exist
          if (invoice.photos) {
            // Use dot notation with $set for nested objects
            if (invoice.photos.before && invoice.photos.before.length > 0) {
              updateData.photos.before = invoice.photos.before;
            }

            if (invoice.photos.after && invoice.photos.after.length > 0) {
              updateData.photos.after = invoice.photos.after;
            }
          }

          // Only migrate signature if it exists
          if (invoice.signature) {
            updateData.signature = invoice.signature;
          }

          // Remove undefined properties from the update object
          if (!updateData.photos.before && !updateData.photos.after) {
            delete updateData.photos;
          } else {
            if (!updateData.photos.before) delete updateData.photos.before;
            if (!updateData.photos.after) delete updateData.photos.after;
          }

          if (!updateData.signature) {
            delete updateData.signature;
          }

          // Skip if there's nothing to update
          if (Object.keys(updateData).length === 0) {
            console.log(
              `No photos or signature to migrate for invoice ${invoice._id} to schedule ${schedule._id}`,
            );
            continue;
          }

          // Update the schedule
          await Schedule.updateOne({ _id: schedule._id }, { $set: updateData });
          schedulesUpdated++;
        }

        successCount++;
        console.log(
          `Successfully migrated data for invoice ${invoice.invoiceId}`,
        );
      } catch (error) {
        // Safe error handling
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `Error processing invoice ${invoice._id}: ${errorMessage}`,
        );
        errorCount++;
      }
    }

    console.log("\nMigration complete!");
    console.log(`Successfully processed invoices: ${successCount}`);
    console.log(`Total schedules updated: ${schedulesUpdated}`);
    console.log(`Invoices without schedules: ${notFoundCount}`);
    console.log(`Errors: ${errorCount}`);

    // Leave data in both places for now - we'll clean up invoice schema later after confirming everything works
    console.log(
      "\nNOTE: Photos and signatures have been copied to the Schedule schema but NOT removed from Invoice schema.",
    );
    console.log(
      "After verifying the migration was successful, you can run a cleanup script to remove them from Invoice schema.",
    );
  } catch (error) {
    // Safe error handling
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Migration failed:", errorMessage);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the migration
migrateData();
