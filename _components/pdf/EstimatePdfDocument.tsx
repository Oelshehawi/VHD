import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
  Link,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: 26,
    color: "#000",
    position: "relative",
  },
  logoContainer: {
    position: "absolute",
    top: "40%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 200,
    height: 200,
    opacity: 0.08,
    zIndex: -1,
  },
  header: {
    backgroundColor: "#003e29",
    color: "#ffffff",
    padding: 11,
    marginBottom: 11,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 10,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    backgroundColor: "#f0f0f0",
    padding: 6,
    marginBottom: 6,
    marginTop: 8,
    borderLeft: "3px solid #003e29",
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  col50: {
    width: "50%",
    paddingRight: 11,
  },
  label: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 1,
    color: "#333",
  },
  value: {
    fontSize: 9,
    padding: 4,
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: 2,
  },
  table: {
    marginTop: 8,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#003e29",
    color: "#ffffff",
    padding: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #ddd",
    padding: 8,
    minHeight: 26,
  },
  col8: { width: "8%" },
  col52: { width: "52%" },
  col20: { width: "20%" },
  servicesSection: {
    backgroundColor: "#f9f9f9",
    padding: 6,
    borderRadius: 4,
    marginTop: 6,
    marginBottom: 6,
  },
  servicesTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#003e29",
    marginBottom: 6,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  serviceItem: {
    width: "50%",
    fontSize: 9,
    marginBottom: 3,
    paddingLeft: 11,
  },
  totalsSection: {
    marginTop: 8,
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    padding: 6,
    borderBottom: "1px solid #ddd",
  },
  finalTotalRow: {
    flexDirection: "row",
    backgroundColor: "#e0f0e8",
    padding: 8,
    fontWeight: "bold",
    color: "#003e29",
    fontSize: 10,
  },
  totalsLabel: {
    flex: 1,
    textAlign: "right",
    paddingRight: 11,
  },
  totalsValue: {
    width: "20%",
    textAlign: "right",
  },
  gstRow: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    padding: 6,
    borderBottom: "1px solid #ddd",
  },
  gstNumber: {
    width: "30%",
    textAlign: "left",
  },
  gstRate: {
    width: "50%",
    textAlign: "right",
    paddingRight: 11,
  },
  gstAmount: {
    width: "20%",
    textAlign: "right",
  },
  termsSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  termsTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#003e29",
    marginBottom: 6,
  },
  termsText: {
    fontSize: 9,
    lineHeight: 1.3,
    padding: 8,
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: 2,
  },
  clientPortalSection: {
    backgroundColor: "#e8f5e8",
    border: "1px solid #003e29",
    padding: 6,
    borderRadius: 4,
    marginTop: 6,
    marginBottom: 6,
  },
  clientPortalTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#003e29",
    textAlign: "center",
    marginBottom: 4,
  },
  clientPortalText: {
    fontSize: 9,
    textAlign: "center",
    marginBottom: 4,
    fontWeight: "bold",
  },
  clientPortalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  clientPortalItem: {
    width: "50%",
    fontSize: 9,
    marginBottom: 3,
    paddingLeft: 11,
  },
  clientPortalFooter: {
    fontSize: 9,
    textAlign: "center",
    fontStyle: "italic",
    color: "#003e29",
  },
  thankYou: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 6,
  },
  itemDetails: {
    fontSize: 8,
    color: "#666",
    marginTop: 1,
    marginLeft: 11,
    fontStyle: "italic",
  },
});

export interface EstimateData {
  estimateNumber: string;
  createdDate: string;
  clientName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  projectLocation?: string;
  items: Array<{ description: string; details?: string; price: number }>;
  subtotal: number;
  gst: number;
  total: number;
  services: string[];
  terms?: string;
}

interface EstimatePdfDocumentProps {
  estimateData: EstimateData;
  scale?: number; // Scale factor (e.g., 0.85 for 85%, 1.0 for 100%, 1.15 for 115%)
}

const EstimatePdfDocument: React.FC<EstimatePdfDocumentProps> = ({
  estimateData,
  scale = 1.0,
}) => {
  // Helper function to scale numeric values
  const s = (value: number) => Math.round(value * scale);

  // Create scaled styles
  const scaledStyles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: s(10),
      paddingTop: s(20),
      paddingBottom: s(60),
      paddingHorizontal: s(26),
      color: "#000",
      position: "relative",
    },
    logoContainer: {
      position: "absolute",
      top: "40%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: 200,
      height: 200,
      opacity: 0.08,
      zIndex: -1,
    },
    header: {
      backgroundColor: "#003e29",
      color: "#ffffff",
      padding: s(11),
      marginBottom: s(11),
      borderRadius: s(4),
    },
    headerTitle: {
      fontSize: s(14),
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: s(2),
    },
    headerSubtitle: {
      fontSize: s(10),
      textAlign: "center",
    },
    sectionTitle: {
      fontSize: s(10),
      fontWeight: "bold",
      backgroundColor: "#f0f0f0",
      padding: s(6),
      marginBottom: s(6),
      marginTop: s(8),
      borderLeft: `${s(3)}px solid #003e29`,
    },
    row: {
      flexDirection: "row",
      marginBottom: s(6),
    },
    col50: {
      width: "50%",
      paddingRight: s(11),
    },
    label: {
      fontSize: s(8),
      fontWeight: "bold",
      marginBottom: 1,
      color: "#333",
    },
    value: {
      fontSize: s(9),
      padding: s(4),
      backgroundColor: "#f9f9f9",
      border: "1px solid #ddd",
      borderRadius: s(2),
    },
    table: {
      marginTop: s(8),
      marginBottom: s(8),
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#003e29",
      color: "#ffffff",
      padding: s(8),
      fontWeight: "bold",
    },
    tableRow: {
      flexDirection: "row",
      borderBottom: "1px solid #ddd",
      padding: s(8),
      minHeight: s(26),
    },
    col8: { width: "8%" },
    col52: { width: "52%" },
    col20: { width: "20%" },
    servicesSection: {
      backgroundColor: "#f9f9f9",
      padding: 6,
      borderRadius: 4,
      marginTop: s(6),
      marginBottom: s(6),
    },
    servicesTitle: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#003e29",
      marginBottom: 6,
    },
    servicesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    serviceItem: {
      width: "50%",
      fontSize: 9,
      marginBottom: 3,
      paddingLeft: 11,
    },
    totalsSection: {
      marginTop: s(8),
    },
    totalRow: {
      flexDirection: "row",
      backgroundColor: "#f0f0f0",
      padding: s(6),
      borderBottom: "1px solid #ddd",
    },
    finalTotalRow: {
      flexDirection: "row",
      backgroundColor: "#e0f0e8",
      padding: s(8),
      fontWeight: "bold",
      color: "#003e29",
      fontSize: s(10),
    },
    totalsLabel: {
      flex: 1,
      textAlign: "right",
      paddingRight: s(11),
    },
    totalsValue: {
      width: "20%",
      textAlign: "right",
    },
    gstRow: {
      flexDirection: "row",
      backgroundColor: "#f0f0f0",
      padding: s(6),
      borderBottom: "1px solid #ddd",
    },
    gstNumber: {
      width: "30%",
      textAlign: "left",
    },
    gstRate: {
      width: "50%",
      textAlign: "right",
      paddingRight: s(11),
    },
    gstAmount: {
      width: "20%",
      textAlign: "right",
    },
    termsSection: {
      marginTop: s(8),
      marginBottom: s(8),
    },
    termsTitle: {
      fontSize: s(10),
      fontWeight: "bold",
      color: "#003e29",
      marginBottom: s(6),
    },
    termsText: {
      fontSize: s(9),
      lineHeight: 1.3,
      padding: s(8),
      backgroundColor: "#f9f9f9",
      border: "1px solid #ddd",
      borderRadius: s(2),
    },
    clientPortalSection: {
      backgroundColor: "#e8f5e8",
      border: "1px solid #003e29",
      padding: 6,
      borderRadius: 4,
      marginTop: s(6),
      marginBottom: s(6),
    },
    clientPortalTitle: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#003e29",
      textAlign: "center",
      marginBottom: 4,
    },
    clientPortalText: {
      fontSize: 10,
      textAlign: "center",
      marginBottom: 4,
      fontWeight: "bold",
    },
    clientPortalGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 4,
    },
    clientPortalItem: {
      width: "50%",
      fontSize: 9,
      marginBottom: 3,
      paddingLeft: 11,
    },
    clientPortalFooter: {
      fontSize: 9,
      textAlign: "center",
      fontStyle: "italic",
      color: "#003e29",
    },
    thankYou: {
      fontSize: s(10),
      fontWeight: "bold",
      textAlign: "center",
      marginTop: s(6),
      marginBottom: s(6),
    },
    itemDetails: {
      fontSize: s(8),
      color: "#666",
      marginTop: 1,
      marginLeft: s(11),
      fontStyle: "italic",
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: s(35),
      backgroundColor: "#003e29",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: s(20),
    },
    footerText: {
      fontSize: s(10),
      color: "white",
      fontFamily: "Helvetica",
    },
  });
  return (
    <Document>
      <Page size="A4" style={scaledStyles.page}>
        {/* Logo Watermark */}
        <View style={scaledStyles.logoContainer}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image component doesn't support alt */}
          <Image
            src="/images/logo.png"
            style={{ width: "100%", height: "100%" }}
          />
        </View>

        {/* Header */}
        <View style={scaledStyles.header}>
          <Text style={scaledStyles.headerTitle}>VANCOUVER HOOD DOCTORS</Text>
          <Text style={scaledStyles.headerSubtitle}>ESTIMATE</Text>
          <Text
            style={{
              fontSize: s(9),
              color: "#ffffff",
              textAlign: "center",
              marginTop: s(2),
              opacity: 0.9,
            }}
          >
            A division of VHD Enterprises Inc
          </Text>
        </View>

        {/* Estimate Details & Client Information */}
        <Text style={scaledStyles.sectionTitle}>
          Estimate Details & Client Information
        </Text>
        <View style={scaledStyles.row}>
          <View style={scaledStyles.col50}>
            <Text style={scaledStyles.label}>Estimate No:</Text>
            <Text style={scaledStyles.value}>
              {estimateData.estimateNumber}
            </Text>
            <View style={{ marginTop: s(7) }}>
              <Text style={scaledStyles.label}>Date:</Text>
              <Text style={scaledStyles.value}>{estimateData.createdDate}</Text>
            </View>
          </View>
          <View style={scaledStyles.col50}>
            <Text style={scaledStyles.label}>Business Name:</Text>
            <Text style={scaledStyles.value}>{estimateData.clientName}</Text>
            <View style={{ marginTop: s(7) }}>
              <Text style={scaledStyles.label}>Contact Person:</Text>
              <Text style={scaledStyles.value}>
                {estimateData.contactPerson || ""}
              </Text>
            </View>
          </View>
        </View>
        <View style={scaledStyles.row}>
          <View style={scaledStyles.col50}>
            <Text style={scaledStyles.label}>Street Address:</Text>
            <Text style={scaledStyles.value}>{estimateData.address || ""}</Text>
          </View>
          <View style={scaledStyles.col50}>
            <Text style={scaledStyles.label}>Phone:</Text>
            <Text style={scaledStyles.value}>{estimateData.phone || "—"}</Text>
          </View>
        </View>
        {estimateData.email && (
          <View style={scaledStyles.row}>
            <View style={scaledStyles.col50}>
              <Text style={scaledStyles.label}>Email:</Text>
              <Text style={scaledStyles.value}>{estimateData.email}</Text>
            </View>
          </View>
        )}

        <View style={scaledStyles.row}>
          <View style={{ width: "100%" }}>
            <Text style={scaledStyles.label}>
              Project Location (if different from address above):
            </Text>
            <Text style={scaledStyles.value}>
              {estimateData.projectLocation || "—"}
            </Text>
          </View>
        </View>

        {/* Estimated Costs */}
        <Text style={scaledStyles.sectionTitle}>Estimated Costs</Text>
        <View style={scaledStyles.table}>
          <View style={scaledStyles.tableHeader}>
            <Text style={scaledStyles.col8}>#</Text>
            <Text style={scaledStyles.col52}>Item Description</Text>
            <Text style={scaledStyles.col20}>Price</Text>
            <Text style={scaledStyles.col20}>Total</Text>
          </View>

          {estimateData.items.map((item, index) => (
            <View key={index}>
              <View style={scaledStyles.tableRow}>
                <Text style={scaledStyles.col8}>{index + 1}</Text>
                <View style={scaledStyles.col52}>
                  <Text>{item.description}</Text>
                  {item.details && (
                    <Text style={scaledStyles.itemDetails}>{item.details}</Text>
                  )}
                </View>
                <Text style={scaledStyles.col20}>${item.price.toFixed(2)}</Text>
                <Text style={scaledStyles.col20}>${item.price.toFixed(2)}</Text>
              </View>
            </View>
          ))}

          {/* Totals */}
          <View style={scaledStyles.totalsSection}>
            <View style={scaledStyles.totalRow}>
              <Text style={scaledStyles.totalsLabel}>Subtotal:</Text>
              <Text style={scaledStyles.totalsValue}>
                ${estimateData.subtotal.toFixed(2)}
              </Text>
            </View>
            <View style={scaledStyles.gstRow}>
              <Text style={scaledStyles.gstNumber}>GST# 71219 0768 RT0001</Text>
              <Text style={scaledStyles.gstRate}>GST (5%):</Text>
              <Text style={scaledStyles.gstAmount}>
                ${estimateData.gst.toFixed(2)}
              </Text>
            </View>
            <View style={scaledStyles.finalTotalRow}>
              <Text style={scaledStyles.totalsLabel}>Total Estimate:</Text>
              <Text style={scaledStyles.totalsValue}>
                ${estimateData.total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Services Section */}
        <View style={scaledStyles.servicesSection}>
          <Text style={scaledStyles.servicesTitle}>
            Our vent cleaning service includes:
          </Text>
          <View style={scaledStyles.servicesGrid}>
            {estimateData.services.map((service, index) => (
              <Text key={index} style={scaledStyles.serviceItem}>
                • {service}
              </Text>
            ))}
          </View>
        </View>

        {/* Client Portal Section */}
        <View style={scaledStyles.clientPortalSection}>
          <Text style={scaledStyles.clientPortalTitle}>
            CLIENT PORTAL ACCESS
          </Text>
          <Text style={scaledStyles.clientPortalText}>
            Once you approve this estimate, you&apos;ll receive access to our
            client portal where you can:
          </Text>
          <View style={scaledStyles.clientPortalGrid}>
            <Text style={scaledStyles.clientPortalItem}>
              • See Upcoming Services
            </Text>
            <Text style={scaledStyles.clientPortalItem}>
              • View before/after photos
            </Text>
            <Text style={scaledStyles.clientPortalItem}>
              • Keep system up to date
            </Text>
            <Text style={scaledStyles.clientPortalItem}>
              • Review service history
            </Text>
            <Text style={scaledStyles.clientPortalItem}>
              • Download invoices and reports
            </Text>
            <Text style={scaledStyles.clientPortalItem}>
              • Schedule future services
            </Text>
          </View>
          <Text style={scaledStyles.clientPortalFooter}>
            Stay connected with your vent cleaning service every step of the
            way!
          </Text>
        </View>

        {/* Thank You */}
        <Text style={scaledStyles.thankYou}>THANK YOU FOR YOUR INQUIRY</Text>

        {/* Terms & Conditions */}
        <View style={scaledStyles.termsSection}>
          <Text style={scaledStyles.termsTitle}>TERMS & CONDITIONS</Text>
          <Text style={scaledStyles.termsText}>
            {estimateData.terms ||
              "Payment is due upon completion of service. Prices subject to change if scope of work differs from initial assessment."}
          </Text>
        </View>

        {/* Footer */}
        <View style={scaledStyles.footer}>
          <Text style={scaledStyles.footerText}>604-273-8717</Text>
          <Text style={scaledStyles.footerText}>
            A division of VHD Enterprises Inc
          </Text>
          <Text style={scaledStyles.footerText}>
            <Link
              src="http://vancouverventcleaning.ca"
              style={{
                color: "white",
                textDecoration: "none",
                fontFamily: "Helvetica",
              }}
            >
              vancouverventcleaning.ca
            </Link>
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default EstimatePdfDocument;
