import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 25,
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
    padding: 10,
    marginBottom: 12,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 10,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    backgroundColor: "#f0f0f0",
    padding: 6,
    marginBottom: 6,
    marginTop: 10,
    borderLeft: "4px solid #003e29",
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  col50: {
    width: "50%",
    paddingRight: 10,
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
    marginTop: 10,
    marginBottom: 10,
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
    minHeight: 25,
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
    fontSize: 10,
    marginBottom: 3,
    paddingLeft: 10,
  },
  totalsSection: {
    marginTop: 10,
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
    fontSize: 12,
  },
  totalsLabel: {
    flex: 1,
    textAlign: "right",
    paddingRight: 10,
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
    paddingRight: 10,
  },
  gstAmount: {
    width: "20%",
    textAlign: "right",
  },
  termsSection: {
    marginTop: 10,
    marginBottom: 10,
  },
  termsTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#003e29",
    marginBottom: 8,
  },
  termsText: {
    fontSize: 9,
    lineHeight: 1.4,
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
    fontSize: 12,
    fontWeight: "bold",
    color: "#003e29",
    textAlign: "center",
    marginBottom: 8,
  },
  clientPortalText: {
    fontSize: 9,
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "bold",
  },
  clientPortalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  clientPortalItem: {
    width: "50%",
    fontSize: 10,
    marginBottom: 4,
    paddingLeft: 10,
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
    marginTop: 8,
    marginBottom: 6,
  },
  itemDetails: {
    fontSize: 8,
    color: "#666",
    marginTop: 2,
    marginLeft: 10,
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
}

const EstimatePdfDocument: React.FC<EstimatePdfDocumentProps> = ({
  estimateData,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Logo Watermark */}
        <View style={styles.logoContainer}>
          <Image src="/images/logo.png" style={{ width: "100%", height: "100%" }} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>VANCOUVER HOOD DOCTORS</Text>
          <Text style={styles.headerSubtitle}>ESTIMATE</Text>
        </View>

        {/* Estimate Details & Client Information */}
        <Text style={styles.sectionTitle}>Estimate Details & Client Information</Text>
        <View style={styles.row}>
          <View style={styles.col50}>
            <Text style={styles.label}>Estimate No:</Text>
            <Text style={styles.value}>{estimateData.estimateNumber}</Text>
            <View style={{ marginTop: 6 }}>
              <Text style={styles.label}>Date:</Text>
              <Text style={styles.value}>{estimateData.createdDate}</Text>
            </View>
          </View>
          <View style={styles.col50}>
            <Text style={styles.label}>Business Name:</Text>
            <Text style={styles.value}>{estimateData.clientName}</Text>
            <View style={{ marginTop: 6 }}>
              <Text style={styles.label}>Contact Person:</Text>
              <Text style={styles.value}>{estimateData.contactPerson || ""}</Text>
            </View>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col50}>
            <Text style={styles.label}>Street Address:</Text>
            <Text style={styles.value}>{estimateData.address || ""}</Text>
          </View>
          <View style={styles.col50}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{estimateData.phone || ""}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col50}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{estimateData.email || ""}</Text>
          </View>
        </View>

        {estimateData.projectLocation && (
          <View style={styles.row}>
            <View style={{ width: "100%" }}>
              <Text style={styles.label}>Project Location (if different from address above):</Text>
              <Text style={styles.value}>{estimateData.projectLocation}</Text>
            </View>
          </View>
        )}

        {/* Estimated Costs */}
        <Text style={styles.sectionTitle}>Estimated Costs</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col8}>#</Text>
            <Text style={styles.col52}>Item Description</Text>
            <Text style={styles.col20}>Price</Text>
            <Text style={styles.col20}>Total</Text>
          </View>

          {estimateData.items.map((item, index) => (
            <View key={index}>
              <View style={styles.tableRow}>
                <Text style={styles.col8}>{index + 1}</Text>
                <View style={styles.col52}>
                  <Text>{item.description}</Text>
                  {item.details && (
                    <Text style={styles.itemDetails}>{item.details}</Text>
                  )}
                </View>
                <Text style={styles.col20}>${item.price.toFixed(2)}</Text>
                <Text style={styles.col20}>${item.price.toFixed(2)}</Text>
              </View>
            </View>
          ))}

          {/* Totals */}
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalsLabel}>Subtotal:</Text>
              <Text style={styles.totalsValue}>${estimateData.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.gstRow}>
              <Text style={styles.gstNumber}>GST# 814301065</Text>
              <Text style={styles.gstRate}>GST (5%):</Text>
              <Text style={styles.gstAmount}>${estimateData.gst.toFixed(2)}</Text>
            </View>
            <View style={styles.finalTotalRow}>
              <Text style={styles.totalsLabel}>Total Estimate:</Text>
              <Text style={styles.totalsValue}>${estimateData.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <Text style={styles.servicesTitle}>Our vent cleaning service includes:</Text>
          <View style={styles.servicesGrid}>
            {estimateData.services.map((service, index) => (
              <Text key={index} style={styles.serviceItem}>
                • {service}
              </Text>
            ))}
          </View>
        </View>

        {/* Client Portal Section */}
        <View style={styles.clientPortalSection}>
          <Text style={styles.clientPortalTitle}>CLIENT PORTAL ACCESS</Text>
          <Text style={styles.clientPortalText}>
            Once you approve this estimate, you'll receive access to our client portal where you can:
          </Text>
          <View style={styles.clientPortalGrid}>
            <Text style={styles.clientPortalItem}>• See Upcoming Services</Text>
            <Text style={styles.clientPortalItem}>• View before/after photos</Text>
            <Text style={styles.clientPortalItem}>• Keep system up to date</Text>
            <Text style={styles.clientPortalItem}>• Review service history</Text>
            <Text style={styles.clientPortalItem}>• Download invoices and reports</Text>
            <Text style={styles.clientPortalItem}>• Schedule future services</Text>
          </View>
          <Text style={styles.clientPortalFooter}>
            Stay connected with your vent cleaning service every step of the way!
          </Text>
        </View>

        {/* Thank You */}
        <Text style={styles.thankYou}>THANK YOU FOR YOUR INQUIRY</Text>

        {/* Terms & Conditions */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>TERMS & CONDITIONS</Text>
          <Text style={styles.termsText}>
            {estimateData.terms || "Payment is due upon completion of service. Prices subject to change if scope of work differs from initial assessment."}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default EstimatePdfDocument;