import {
  fetchReportDetails,
  fetchTechnicianByClerkId,
} from "../../../../../lib/clientPortalData";
import { formatDateFns } from "../../../../../lib/utils";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
  Link,
  Svg,
  Path,
  Image,
} from "@react-pdf/renderer";
import fs from "fs";
import path from "path";

const logoPath = path.resolve(process.cwd(), "public", "images", "logo.png");
const logoBuffer = fs.readFileSync(logoPath);

Font.register({
  family: "Lato",
  fonts: [
    { src: path.resolve(process.cwd(), "public", "fonts", "Lato-Regular.ttf") },
    {
      src: path.resolve(process.cwd(), "public", "fonts", "Lato-Bold.ttf"),
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Lato",
    fontSize: 9,
    paddingTop: 25,
    paddingBottom: 30,
    paddingHorizontal: 25,
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
    height: 80,
    zIndex: 1,
    opacity: 0.7,
  },
  header: {
    position: "relative",
    marginBottom: 15,
  },
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
  reportTitle: {
    fontSize: 24,
    color: "#003e29",
    fontWeight: "bold",
  },
  companyTitle: {
    fontSize: 16,
    color: "#003e29",
    fontWeight: "bold",
    zIndex: 2,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: "#003e29",
    color: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
  },
  footerText: {
    fontSize: 9,
  },
  section: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 8,
  },
  columnSection: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#003e29",
    marginBottom: 6,
  },
  table: {
    display: "flex",
    width: "auto",
    marginTop: 3,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  tableHeader: {
    backgroundColor: "#003e29",
    color: "#fff",
  },
  tableCell: {
    padding: 3,
    borderWidth: 0,
    borderRightWidth: 1,
    borderRightColor: "#ccc",
  },
  infoGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
    gap: 15,
  },
  infoItem: {
    marginBottom: 3,
  },
  boldText: {
    fontWeight: "bold",
  },
  technicianItem: {
    backgroundColor: "#f5f5f5",
    padding: 3,
    borderRadius: 4,
  },
});

interface ReportData {
  _id: string;
  scheduleId: string;
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
  };
  recommendations?: string;
  comments?: string;
  recommendedCleaningFrequency?: number;
  inspectionItems?: Record<string, string>;
  jobTitle?: string;
}

interface ReportPdfProps {
  report: ReportData;
  technician: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
  };
}

const ReportPdf: React.FC<ReportPdfProps> = ({ report, technician }) => (
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
          <Text style={styles.companyTitle}>Vancouver Hood Doctors</Text>
        </View>
      </View>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image src={{ data: logoBuffer, format: "png" }} />
      </View>

      {/* Report Info including Technician */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Report Information</Text>
        <View style={styles.infoGroup}>
          <View>
            <Text style={styles.infoItem}>
              <Text style={styles.boldText}>Date:</Text>{" "}
              {formatDateFns(report.dateCompleted)}
            </Text>
            <Text style={styles.infoItem}>
              <Text style={styles.boldText}>Client:</Text>{" "}
              {report.jobTitle || "N/A"}
            </Text>
            <Text style={styles.infoItem}>
              <Text style={styles.boldText}>Technician:</Text>{" "}
              {technician.fullName}
            </Text>
          </View>
          <View>
            <Text style={styles.infoItem}>
              <Text style={styles.boldText}>Equipment:</Text>{" "}
              {`${report.equipmentDetails?.hoodType || "Hood"}, ${report.equipmentDetails?.filterType || "Filters"}`}
            </Text>
            <Text style={styles.infoItem}>
              <Text style={styles.boldText}>Fuel Type:</Text>{" "}
              {report.fuelType || "N/A"}
            </Text>
            <Text style={styles.infoItem}>
              <Text style={styles.boldText}>Last Service:</Text>{" "}
              {report.lastServiceDate
                ? formatDateFns(report.lastServiceDate)
                : "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* All four tables in a dual-row layout */}
      <View style={styles.rowContainer} wrap={false}>
        {/* Equipment Details */}
        <View style={styles.columnSection}>
          <Text style={styles.sectionTitle}>Equipment Details</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { flex: 1 }]}>Component</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>Type</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>Hood</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {report.equipmentDetails?.hoodType || "N/A"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>Filters</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {report.equipmentDetails?.filterType || "N/A"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>Ductwork</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {report.equipmentDetails?.ductworkType || "N/A"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>Fan</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {report.equipmentDetails?.fanType || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Cleaning Details */}
        <View style={styles.columnSection}>
          <Text style={styles.sectionTitle}>Cleaning Details</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { flex: 1 }]}>Component</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>Status</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>Hood</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {report.cleaningDetails?.hoodCleaned
                  ? "Cleaned"
                  : "Not Cleaned"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>Filters</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {report.cleaningDetails?.filtersCleaned
                  ? "Cleaned"
                  : "Not Cleaned"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>Ductwork</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {report.cleaningDetails?.ductworkCleaned
                  ? "Cleaned"
                  : "Not Cleaned"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>Fan</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {report.cleaningDetails?.fanCleaned ? "Cleaned" : "Not Cleaned"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Second row of tables */}
      <View style={styles.rowContainer} wrap={false}>
        {/* Cooking Equipment */}
        <View style={styles.columnSection}>
          <Text style={styles.sectionTitle}>Cooking Equipment</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { flex: 1 }]}>Equipment</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>Present</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>Griddles</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {report.cookingEquipment?.griddles ? "Yes" : "No"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                Deep Fat Fryers
              </Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {report.cookingEquipment?.deepFatFryers ? "Yes" : "No"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1 }]}>Woks</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {report.cookingEquipment?.woks ? "Yes" : "No"}
              </Text>
            </View>
          </View>
        </View>

        {/* Inspection Items with optimized rendering */}
        <View style={styles.columnSection}>
          <Text style={styles.sectionTitle}>Inspection Items</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { flex: 1 }]}>Item</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>Status</Text>
            </View>
            {report.inspectionItems &&
              Object.entries(report.inspectionItems)
                .slice(0, 20)
                .map(([key, value], index) => {
                  const label = key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())
                    .replace(/([A-Z])\s/g, "$1");
                  return (
                    <View key={key} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1 }]}>
                        {label}
                      </Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>
                        {value || "N/A"}
                      </Text>
                    </View>
                  );
                })}
          </View>
        </View>
      </View>

      {/* Recommendations and Notes */}
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>Recommendations & Notes</Text>
        <Text style={{ fontSize: 9 }}>
          {report.recommendations || "No recommendations provided."}
        </Text>
        {report.comments && (
          <Text style={{ fontSize: 9, marginTop: 3 }}>{report.comments}</Text>
        )}
      </View>

      {/* Footer */}
      <View fixed style={styles.footer}>
        <Text style={[styles.footerText, { marginLeft: 25 }]}>
          604-273-8717
        </Text>
        <Text style={[styles.footerText, { marginRight: 25 }]}>
          <Link
            src="http://vancouverventcleaning.ca"
            style={{ color: "#FFFFFF", textDecoration: "none" }}
          >
            vancouverventcleaning.ca
          </Link>
        </Text>
      </View>
    </Page>
  </Document>
);

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    // Add rate limiting header
    const response = new Response();
    response.headers.set("X-RateLimit-Limit", "100");

    // Fetch data
    const report = await fetchReportDetails(params.id);
    if (!report) {
      return new Response(JSON.stringify({ error: "Report not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch technician data
    const technician = await fetchTechnicianByClerkId(report.technicianId);
    if (!technician) {
      return new Response(JSON.stringify({ error: "Technician not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create report data for PDF
    const reportData: ReportData = {
      _id: report._id ? report._id.toString() : params.id,
      scheduleId: report.scheduleId ? report.scheduleId.toString() : params.id,
      dateCompleted: report.dateCompleted || new Date(),
      technicianId: report.technicianId,
      lastServiceDate: report.lastServiceDate,
      fuelType: report.fuelType,
      cookingVolume: report.cookingVolume,
      equipmentDetails: report.equipmentDetails,
      cleaningDetails: report.cleaningDetails,
      cookingEquipment: report.cookingEquipment,
      recommendations: report.recommendations,
      comments: report.comments,
      recommendedCleaningFrequency: report.recommendedCleaningFrequency,
      inspectionItems: report.inspectionItems,
      jobTitle: report.jobTitle || "Unknown Client",
    };

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      <ReportPdf report={reportData} technician={technician} />,
    );

    // Return response with enhanced security headers
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=Report - ${report.jobTitle || "Unknown Client"}.pdf`,
        "Cache-Control": "no-store, max-age=0",
        "Content-Security-Policy": "default-src 'self'",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      },
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return new Response(
      JSON.stringify({
        message: "Failed to generate PDF",
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
