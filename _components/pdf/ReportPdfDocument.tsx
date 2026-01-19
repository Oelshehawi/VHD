import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  Svg,
  Path,
  Image,
} from "@react-pdf/renderer";
import { getImageSrc } from "../../app/lib/imageUtils";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const createStyles = (scale: number) => {
  const s = (value: number) => Math.round(value * scale);

  return StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: s(8),
      paddingTop: s(15),
      paddingBottom: s(35),
      paddingHorizontal: s(20),
      color: "#000",
    },
    logoContainer: {
      position: "absolute",
      left: 540,
      top: 10,
      bottom: 0,
      right: 0,
      width: "10%",
      padding: 0,
      height: s(80),
      zIndex: 1,
      opacity: 0.7,
    },
    header: { position: "relative", marginBottom: s(8) },
    headerWave: {
      position: "absolute",
      top: -270,
      left: -700,
      width: 1000,
      height: 500,
    },
    headerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    reportTitle: { fontSize: s(20), color: "#003e29", fontWeight: "bold" },
    companyTitle: {
      fontSize: s(14),
      color: "#003e29",
      fontWeight: "bold",
      zIndex: 2,
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: s(25),
      backgroundColor: "#003e29",
      color: "#FFFFFF",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: s(20),
    },
    footerText: { fontSize: s(9) },
    section: {
      marginTop: s(10),
      border: "1px solid black",
      borderColor: "#ccc",
      borderRadius: s(4),
      padding: s(8),
    },
    rowContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: s(10),
      gap: s(8),
    },
    columnSection: {
      flex: 1,
      border: "1px solid black",
      borderRadius: s(4),
      padding: s(8),
    },
    sectionTitle: {
      fontSize: s(12),
      fontWeight: "bold",
      color: "#003e29",
      marginBottom: s(6),
    },
    table: {
      display: "flex",
      width: "auto",
      marginTop: s(3),
      border: "1px solid black",
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#ccc",
    },
    tableHeader: { backgroundColor: "#003e29", color: "#fff" },
    tableCell: {
      padding: s(3),
      borderRightWidth: 1,
      borderRightColor: "#ccc",
    },
    infoGroup: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: s(8),
    },
    infoRow: { flexDirection: "row", marginBottom: s(2), gap: s(10) },
    infoItem: { marginBottom: s(2) },
    boldText: { fontWeight: "bold" },
    technicianItem: {
      backgroundColor: "#f5f5f5",
      padding: s(3),
      borderRadius: s(4),
    },
  });
};

export interface ReportData {
  _id: string;
  scheduleId: string;
  jobTitle?: string;
  location?: string;
  dateCompleted: string | Date;
  technicianId: string;
  lastServiceDate?: string | Date;
  fuelType?: string;
  cookingVolume?: string;
  equipmentDetails?: {
    hoodType?: string;
    filterType?: string;
    ductworkType?: string;
    fanType?: string;
  };
  cleaningDetails?: {
    hoodCleaned?: boolean;
    filtersCleaned?: boolean;
    ductworkCleaned?: boolean;
    fanCleaned?: boolean;
  };
  cookingEquipment?: {
    griddles?: boolean;
    deepFatFryers?: boolean;
    woks?: boolean;
    ovens?: boolean;
    flattopGrills?: boolean;
  };
  ecologyUnit?: {
    exists?: boolean;
    operational?: boolean;
    filterReplacementNeeded?: boolean;
    notes?: string;
  };
  recommendations?: string;
  comments?: string;
  recommendedCleaningFrequency?: number;
  inspectionItems?: Record<string, string>;
}

export interface TechnicianData {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
}

interface ReportPdfDocumentProps {
  report: ReportData;
  technician: TechnicianData;
  scale?: number;
}

const ReportPdfDocument: React.FC<ReportPdfDocumentProps> = ({
  report,
  technician,
  scale = 1,
}) => {
  // Note: Don't use React hooks here - this component is rendered server-side for PDF generation
  const styles = createStyles(scale);
  // Helper function to scale numeric values
  const s = (value: number) => Math.round(value * scale);

  const formatDate = (date: string | Date) => {
    // Parse date safely without timezone conversion
    let dateString: string;
    if (date instanceof Date) {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      dateString = `${year}-${month}-${day}`;
    } else if (typeof date === "string") {
      dateString = date.includes("T") ? date.split("T")[0]! : date;
    } else {
      return "Invalid Date";
    }

    const parts = dateString.split("-");
    if (parts.length !== 3) return "Invalid Date";

    const year = parts[0]!;
    const monthNum = parseInt(parts[1]!, 10);
    const dayNum = parseInt(parts[2]!, 10);

    const monthName = MONTH_NAMES[monthNum - 1] || "Unknown";

    // Add ordinal suffix
    const suffix =
      dayNum % 10 === 1 && dayNum % 100 !== 11
        ? "st"
        : dayNum % 10 === 2 && dayNum % 100 !== 12
          ? "nd"
          : dayNum % 10 === 3 && dayNum % 100 !== 13
            ? "rd"
            : "th";

    return `${monthName} ${dayNum}${suffix}, ${year}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* SVG Wave */}
          <Svg style={styles.headerWave}>
            <Path
              fill="#003e29"
              d="M0,320L17.1,288C34.3,256,69,192,103,186.7C137.1,181,171,235,206,224C240,213,274,139,309,112C342.9,85,377,107,411,144C445.7,181,480,235,514,261.3C548.6,288,583,288,617,282.7C651.4,277,686,267,720,256C754.3,245,789,235,823,229.3C857.1,224,891,224,926,224C960,224,994,224,1029,234.7C1062.9,245,1097,267,1131,256C1165.7,245,1200,203,1234,181.3C1268.6,160,1303,160,1337,154.7C1371.4,149,1406,139,1423,133.3L1440,128L1440,0L1422.9,0C1405.7,0,1371,0,1337,0C1302.9,0,1269,0,1234,0C1200,0,1166,0,1131,0C1097.1,0,1063,0,1029,0C994.3,0,960,0,926,0C891.4,0,857,0,823,0C788.6,0,754,0,720,0C685.7,0,651,0,617,0C582.9,0,549,0,514,0C480,0,446,0,411,0C377.1,0,343,0,309,0C274.3,0,240,0,206,0C171.4,0,137,0,103,0C68.6,0,34,0,17,0L0,0Z"
            />
          </Svg>
          {/* Header Content */}
          <View style={styles.headerContent}>
            <Text style={styles.reportTitle}>SERVICE REPORT</Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.companyTitle}>Vancouver Hood Doctors</Text>
              <Text
                style={{ fontSize: s(9), color: "#495057", marginTop: s(2) }}
              >
                A division of VHD Enterprises Inc
              </Text>
            </View>
          </View>
        </View>

        {/* Logo - Using hybrid approach for client/server compatibility */}
        <View style={styles.logoContainer}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image component doesn't support alt */}
          <Image
            src={getImageSrc("images/logo.png")}
            style={{ width: "100%", height: "100%" }}
          />
        </View>

        {/* Report Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoItem}>
              <Text style={styles.boldText}>Date Completed:</Text>{" "}
              {formatDate(report.dateCompleted)}
            </Text>
            <Text style={styles.infoItem}>
              <Text style={styles.boldText}>Technician:</Text>{" "}
              {technician.fullName}
            </Text>
          </View>
          {report.lastServiceDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoItem}>
                <Text style={styles.boldText}>Last Service Date:</Text>{" "}
                {formatDate(report.lastServiceDate)}
              </Text>
            </View>
          )}
          {(report.jobTitle || report.location) && (
            <View style={styles.infoRow}>
              {report.jobTitle && (
                <Text style={styles.infoItem}>
                  <Text style={styles.boldText}>Job Title:</Text>{" "}
                  {report.jobTitle}
                </Text>
              )}
              {report.location && (
                <Text style={styles.infoItem}>
                  <Text style={styles.boldText}>Location:</Text>{" "}
                  {report.location}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Service Details */}
        <View style={styles.rowContainer}>
          <View style={styles.columnSection}>
            <Text style={styles.sectionTitle}>Service Details</Text>
            {report.fuelType && (
              <Text style={styles.infoItem}>
                <Text style={styles.boldText}>Fuel Type:</Text>{" "}
                {report.fuelType}
              </Text>
            )}
            {report.cookingVolume && (
              <Text style={styles.infoItem}>
                <Text style={styles.boldText}>Cooking Volume:</Text>{" "}
                {report.cookingVolume}
              </Text>
            )}
            {report.recommendedCleaningFrequency && (
              <Text style={styles.infoItem}>
                <Text style={styles.boldText}>Recommended Frequency:</Text>{" "}
                {report.recommendedCleaningFrequency} times per year
              </Text>
            )}
          </View>

          <View style={styles.columnSection}>
            <Text style={styles.sectionTitle}>Equipment Details</Text>
            {report.equipmentDetails?.hoodType && (
              <Text style={styles.infoItem}>
                <Text style={styles.boldText}>Hood Type:</Text>{" "}
                {report.equipmentDetails.hoodType}
              </Text>
            )}
            {report.equipmentDetails?.filterType && (
              <Text style={styles.infoItem}>
                <Text style={styles.boldText}>Filter Type:</Text>{" "}
                {report.equipmentDetails.filterType}
              </Text>
            )}
            {report.equipmentDetails?.ductworkType && (
              <Text style={styles.infoItem}>
                <Text style={styles.boldText}>Ductwork Type:</Text>{" "}
                {report.equipmentDetails.ductworkType}
              </Text>
            )}
            {report.equipmentDetails?.fanType && (
              <Text style={styles.infoItem}>
                <Text style={styles.boldText}>Fan Type:</Text>{" "}
                {report.equipmentDetails.fanType}
              </Text>
            )}
          </View>
        </View>

        {/* Cleaning Details */}
        <View style={styles.rowContainer}>
          <View
            style={
              report.ecologyUnit?.exists
                ? styles.columnSection
                : {
                    ...styles.columnSection,
                    alignItems: "center",
                  }
            }
          >
            <Text style={styles.sectionTitle}>Cleaning Performed</Text>
            <Text style={styles.infoItem}>
              Hood Cleaned: {report.cleaningDetails?.hoodCleaned ? "Yes" : "No"}
            </Text>
            <Text style={styles.infoItem}>
              Filters Cleaned:{" "}
              {report.cleaningDetails?.filtersCleaned ? "Yes" : "No"}
            </Text>
            <Text style={styles.infoItem}>
              Ductwork Cleaned:{" "}
              {report.cleaningDetails?.ductworkCleaned ? "Yes" : "No"}
            </Text>
            <Text style={styles.infoItem}>
              Fan Cleaned: {report.cleaningDetails?.fanCleaned ? "Yes" : "No"}
            </Text>
          </View>

          {report.ecologyUnit?.exists && (
            <View style={styles.columnSection}>
              <Text style={styles.sectionTitle}>Ecology Unit</Text>
              {report.ecologyUnit?.operational !== undefined && (
                <Text style={styles.infoItem}>
                  Operational: {report.ecologyUnit?.operational ? "Yes" : "No"}
                </Text>
              )}
              <Text style={styles.infoItem}>
                Filter Replacement Needed:{" "}
                {report.ecologyUnit?.filterReplacementNeeded ? "Yes" : "No"}
              </Text>
              {report.ecologyUnit?.notes && (
                <Text style={styles.infoItem}>
                  <Text style={styles.boldText}>Notes:</Text>{" "}
                  {report.ecologyUnit.notes}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Inspection Items */}
        {report.inspectionItems &&
          Object.keys(report.inspectionItems).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Inspection Items</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { width: "50%" }]}>Item</Text>
                  <Text style={[styles.tableCell, { width: "50%" }]}>
                    Status
                  </Text>
                </View>
                {Object.entries(report.inspectionItems).map(([key, value]) => (
                  <View style={styles.tableRow} key={key}>
                    <Text style={[styles.tableCell, { width: "50%" }]}>
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                    </Text>
                    <Text style={[styles.tableCell, { width: "50%" }]}>
                      {typeof value === "object" && value !== null
                        ? (value as any).status || JSON.stringify(value)
                        : String(value || "N/A")}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        {/* Recommendations */}
        {report.recommendations && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            <Text>{report.recommendations}</Text>
          </View>
        )}

        {/* Comments */}
        {report.comments && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Comments</Text>
            <Text>{report.comments}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>604-273-8717</Text>
          <Text style={styles.footerText}>
            <Link
              src="http://vancouverventcleaning.ca"
              style={{ color: "white", textDecoration: "none" }}
            >
              vancouverventcleaning.ca
            </Link>
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ReportPdfDocument;
export type { ReportPdfDocumentProps };
