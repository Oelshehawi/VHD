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
  Font,
} from "@react-pdf/renderer";
import { getImageSrc } from "../../app/lib/imageUtils";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 20,
    paddingBottom: 60,
    paddingHorizontal: 25,
    color: "#000",
  },
  logoContainer: {
    position: "absolute",
    left: 540,
    top: 5,
    bottom: 0,
    right: 0,
    width: "10%",
    padding: 0,
    height: 80,
    zIndex: 1,
    opacity: 0.7,
  },
  header: { position: "relative", marginBottom: 15 },
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
  invoiceTitle: {
    fontSize: 26,
    color: "#003e29",
    fontFamily: "Helvetica-Bold",
  },
  companyTitle: {
    fontSize: 16,
    color: "#003e29",
    fontFamily: "Helvetica-Bold",
    zIndex: 2,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 35,
    backgroundColor: "#003e29",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  footerText: { fontSize: 10, color: "white", fontFamily: "Helvetica" },
  section: { marginTop: 5 },
  infoGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  infoBox: {
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 4,
    border: "1px solid #e9ecef",
    flex: 1,
    marginRight: 8,
  },
  infoBoxLast: {
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 4,
    border: "1px solid #e9ecef",
    flex: 1,
    marginRight: 0,
  },
  infoTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#6c757d",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  infoValue: { fontSize: 12, fontWeight: "bold", color: "#003e29" },
  infoList: { flexGrow: 1 },
  billingBox: {
    backgroundColor: "#ffffff",
    border: "1px solid #dee2e6",
    borderRadius: 4,
    padding: 12,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#003e29",
    marginBottom: 6,
    borderBottom: "1px solid #dee2e6",
    paddingBottom: 3,
  },
  table: {
    backgroundColor: "#ffffff",
    border: "1px solid #dee2e6",
    borderRadius: 4,
    marginTop: 6,
    padding: 12,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  tableHeader: { backgroundColor: "#003e29", color: "#fff" },
  tableCell: {
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: "#ccc",
    fontFamily: "Helvetica",
  },
  tableCellHeader: {
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: "#ccc",
    color: "white",
    fontFamily: "Helvetica-Bold",
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottom: "1px solid #f8f9fa",
  },
  serviceDescription: { fontSize: 11, color: "#495057", flex: 1 },
  serviceDetails: {
    fontSize: 10,
    color: "#666",
    marginTop: 13,
    marginLeft: 10,
    fontStyle: "italic",
    lineHeight: 1.3,
  },
  serviceAmount: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#003e29",
    width: 80,
    textAlign: "right",
  },
  totalsSection: {
    marginTop: 12,
    paddingTop: 10,
    paddingHorizontal: 8,
    borderTop: "2px solid #003e29",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 11, color: "#495057" },
  totalValue: { fontSize: 11, fontWeight: "bold", color: "#003e29" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 8,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  grandTotalLabel: { fontSize: 14, fontWeight: "bold", color: "#003e29" },
  grandTotalValue: { fontSize: 16, fontWeight: "bold", color: "#003e29" },
  thankYou: {
    marginTop: 25,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 12,
    color: "#003e29",
  },
  terms: { marginTop: 7, marginBottom: 7 },
  signature: { marginTop: 25, alignItems: "flex-end" },
  signatureLine: { width: "50%", borderTop: "1px solid black" },
  signatureText: { marginTop: 15, fontFamily: "Helvetica" },
  text: { fontFamily: "Helvetica" },
  boldText: { fontFamily: "Helvetica-Bold" },
  greenText: { color: "#003e29", fontFamily: "Helvetica-Bold" },
  paymentDetailsBox: {
    backgroundColor: "#e8f5e8",
    border: "3px solid #28a745",
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
    marginBottom: 15,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#28a745",
    textAlign: "center",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  paymentInfoBox: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 6,
    border: "2px solid #28a745",
    flex: 1,
    marginRight: 8,
  },
  paymentInfoBoxLast: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 6,
    border: "2px solid #28a745",
    flex: 1,
    marginRight: 0,
  },
  paymentLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#28a745",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  paymentValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#003e29",
    lineHeight: 1.4,
  },
});

export interface InvoiceData {
  invoiceId: string;
  dateIssued: string;
  dateDue: string;
  jobTitle: string;
  location: string;
  clientName: string;
  email: string;
  phoneNumber: string;
  items: Array<{ description: string; details?: string; price: number; total: number }>;
  subtotal: number;
  gst: number;
  totalAmount: number;
  cheque: string;
  eTransfer: string;
  terms: string;
}

interface InvoicePdfDocumentProps {
  invoiceData: InvoiceData;
}

const InvoicePdfDocument: React.FC<InvoicePdfDocumentProps> = ({
  invoiceData,
}) => (
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
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.companyTitle}>Vancouver Hood Doctors</Text>
        </View>
      </View>

      {/* Logo - Using hybrid approach for client/server compatibility */}
      <View style={styles.logoContainer}>
        <Image
          src={getImageSrc("images/logo.png")}
          style={{ width: "100%", height: "100%" }}
        />
      </View>

      {/* Invoice Info */}
      <View style={styles.section}>
        <View style={styles.infoGroup}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Invoice No</Text>
            <Text style={styles.infoValue}>#{invoiceData.invoiceId}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Date</Text>
            <Text style={styles.infoValue}>{invoiceData.dateIssued}</Text>
          </View>
          <View style={styles.infoBoxLast}>
            <Text style={styles.infoTitle}>Payment Info</Text>
            <Text style={styles.infoValue}>Mail/E-Transfer</Text>
          </View>
        </View>
      </View>

      {/* Billing Info */}
      <View style={styles.billingBox}>
        <Text style={styles.sectionTitle}>Bill To:</Text>
        <Text style={styles.infoValue}>{invoiceData.jobTitle.trim()}</Text>
        <Text style={{ fontSize: 10, color: "#495057", marginTop: 2 }}>
          {invoiceData.location}
        </Text>
        <Text style={{ fontSize: 10, color: "#495057", marginTop: 2 }}>
          {invoiceData.phoneNumber}
        </Text>
      </View>

      {/* Payment Details - Prominent */}
      <View style={{ marginTop: 15 }}>
        <View style={styles.infoGroup}>
          <View style={styles.paymentInfoBox}>
            <Text style={styles.paymentLabel}>MAIL PAYMENT TO:</Text>
            <Text style={styles.paymentValue}>{invoiceData.cheque}</Text>
          </View>
          <View style={styles.paymentInfoBoxLast}>
            <Text style={styles.paymentLabel}>E-TRANSFER TO:</Text>
            <Text style={styles.paymentValue}>
              adam@vancouverventcleaning.ca
            </Text>
          </View>
        </View>
      </View>

      {/* Service Notice */}
      <Text
        style={{
          color: "red",
          textAlign: "center",
          marginTop: 7,
          marginBottom: 10,
          fontSize: 10,
        }}
      >
        Accessible Areas Serviced Only
      </Text>

      {/* Service Details */}
      <View style={styles.table}>
        <Text style={styles.sectionTitle}>Services Provided</Text>

        {invoiceData.items.map((item, index) => (
          <View style={styles.serviceItem} key={index}>
            <View style={{ flex: 1, flexDirection: "column", justifyContent: "flex-start" }}>
              <Text style={styles.serviceDescription}>
                {index + 1}. {item.description}
              </Text>
              {item.details && (
                <Text style={styles.serviceDetails}>
                  {item.details}
                </Text>
              )}
            </View>
            <View style={{ justifyContent: "flex-start", alignItems: "flex-end" }}>
              <Text style={styles.serviceAmount}>${item.total.toFixed(2)}</Text>
            </View>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              ${invoiceData.subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>GST# 814301065 (5%):</Text>
            <Text style={styles.totalValue}>${invoiceData.gst.toFixed(2)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>
              ${invoiceData.totalAmount.toFixed(2)} CAD
            </Text>
          </View>
        </View>
      </View>

      {/* Thank You Note */}
      <Text style={styles.thankYou}>THANK YOU FOR YOUR BUSINESS</Text>

      <View style={styles.terms}>
        <Text style={{ color: "#003e29", fontWeight: "bold", marginBottom: 5, fontSize: 11 }}>
          PAYMENT TERMS
        </Text>
        <Text style={{ fontSize: 9, lineHeight: 1.4, marginBottom: 3 }}>
          • Payment due within 14 days of the service date unless otherwise agreed in writing.
        </Text>
        <Text style={{ fontSize: 9, lineHeight: 1.4, marginBottom: 3 }}>
          • Overdue interest: 2% per month (24% per year), simple interest, applied from the day after the due date until paid.
        </Text>
        <Text style={{ fontSize: 9, lineHeight: 1.4, marginBottom: 3 }}>
          • Disputes: {invoiceData.terms}
        </Text>
        <Text style={{ fontSize: 9, lineHeight: 1.4 }}>
          • First-time customers: Unless otherwise agreed in writing, payment is due on completion.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>604-273-8717</Text>
        <Text style={styles.footerText}>
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

export default InvoicePdfDocument;
