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

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    paddingTop: 15,
    paddingBottom: 35,
    paddingHorizontal: 20,
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
  header: { position: "relative", marginBottom: 8 },
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
  reportTitle: { fontSize: 20, color: "#003e29", fontWeight: "bold" },
  companyTitle: {
    fontSize: 14,
    color: "#003e29",
    fontWeight: "bold",
    zIndex: 2,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 25,
    backgroundColor: "#003e29",
    color: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  footerText: { fontSize: 9 },
  section: {
    marginTop: 10,
    border: "1px solid black",
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
    border: "1px solid black",
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
    border: "1px solid black",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  tableHeader: { backgroundColor: "#003e29", color: "#fff" },
  tableCell: { padding: 3, borderRightWidth: 1, borderRightColor: "#ccc" },
  infoGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoRow: { flexDirection: "row", marginBottom: 2, gap: 10 },
  infoItem: { marginBottom: 2 },
  boldText: { fontWeight: "bold" },
  technicianItem: { backgroundColor: "#f5f5f5", padding: 3, borderRadius: 4 },
});

export interface ReportData {
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
}

const ReportPdfDocument: React.FC<ReportPdfDocumentProps> = ({
  report,
  technician,
}) => {
  const formatDate = (date: string | Date) => {
    const dateObj = new Date(date);
    return dateObj
      .toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      .replace(/(\d+)/, (match) => {
        const num = parseInt(match);
        const suffix =
          num % 10 === 1 && num % 100 !== 11
            ? "st"
            : num % 10 === 2 && num % 100 !== 12
              ? "nd"
              : num % 10 === 3 && num % 100 !== 13
                ? "rd"
                : "th";
        return num + suffix;
      });
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
            <Text style={styles.companyTitle}>Vancouver Hood Doctors</Text>
          </View>
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image src="/images/logo.png" />
        </View>

        {/* Report Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoItem}>
              <Text style={styles.boldText}>Report ID:</Text> {report._id}
            </Text>
            <Text style={styles.infoItem}>
              <Text style={styles.boldText}>Date Completed:</Text>{" "}
              {formatDate(report.dateCompleted)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoItem}>
              <Text style={styles.boldText}>Technician:</Text>{" "}
              {technician.fullName}
            </Text>
            {report.lastServiceDate && (
              <Text style={styles.infoItem}>
                <Text style={styles.boldText}>Last Service Date:</Text>{" "}
                {formatDate(report.lastServiceDate)}
              </Text>
            )}
          </View>
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
          <View style={styles.columnSection}>
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

          <View style={styles.columnSection}>
            <Text style={styles.sectionTitle}>Cooking Equipment</Text>
            <Text style={styles.infoItem}>
              Griddles: {report.cookingEquipment?.griddles ? "Yes" : "No"}
            </Text>
            <Text style={styles.infoItem}>
              Deep Fat Fryers:{" "}
              {report.cookingEquipment?.deepFatFryers ? "Yes" : "No"}
            </Text>
            <Text style={styles.infoItem}>
              Woks: {report.cookingEquipment?.woks ? "Yes" : "No"}
            </Text>
          </View>
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
                      {typeof value === 'object' && value !== null 
                        ? (value as any).status || JSON.stringify(value)
                        : String(value || 'N/A')}
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
