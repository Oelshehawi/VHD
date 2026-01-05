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
    fontSize: 10,
    paddingTop: 20,
    paddingBottom: 40,
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
  receiptTitle: { fontSize: 26, color: "#003e29", fontWeight: "bold" },
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
    height: 35,
    backgroundColor: "#003e29",
    color: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  footerText: { fontSize: 10 },
  section: { marginTop: 10 },
  infoGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
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
  receiptBox: {
    backgroundColor: "#e8f5e8",
    border: "2px solid #28a745",
    borderRadius: 6,
    padding: 12,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  paidStamp: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#28a745",
    marginBottom: 6,
  },
  receiptText: { fontSize: 12, color: "#495057", marginBottom: 4 },
  amountPaid: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#003e29",
    marginTop: 6,
  },
  serviceDetails: {
    backgroundColor: "#ffffff",
    border: "1px solid #dee2e6",
    borderRadius: 4,
    padding: 10,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#003e29",
    marginBottom: 6,
    borderBottom: "1px solid #dee2e6",
    paddingBottom: 3,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottom: "1px solid #f8f9fa",
  },
  serviceDescription: { fontSize: 11, color: "#495057", flex: 1 },
  serviceAmount: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#003e29",
    width: 80,
    textAlign: "right",
  },
  totalsSection: {
    marginTop: 8,
    paddingTop: 6,
    borderTop: "2px solid #003e29",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalLabel: { fontSize: 11, color: "#495057" },
  totalValue: { fontSize: 11, fontWeight: "bold", color: "#003e29" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    marginTop: 5,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  grandTotalLabel: { fontSize: 14, fontWeight: "bold", color: "#003e29" },
  grandTotalValue: { fontSize: 16, fontWeight: "bold", color: "#003e29" },
  thankYou: {
    marginTop: 15,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 12,
    color: "#003e29",
  },
  notes: {
    marginTop: 10,
    fontSize: 9,
    color: "#6c757d",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export interface ReceiptData {
  receiptId: string;
  invoiceId: string;
  datePaid: string;
  jobTitle: string;
  location: string;
  clientName: string;
  email: string;
  phoneNumber: string;
  items: Array<{ description: string; price: number; total: number }>;
  subtotal: number;
  gst: number;
  totalAmount: number;
  paymentMethod?: string;
}

interface ReceiptPdfDocumentProps {
  receiptData: ReceiptData;
}

const ReceiptPdfDocument: React.FC<ReceiptPdfDocumentProps> = ({
  receiptData,
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
          <Text style={styles.receiptTitle}>PAYMENT RECEIPT</Text>
          <Text style={styles.companyTitle}>Vancouver Hood Doctors</Text>
        </View>
      </View>

      {/* Logo */}
      <View style={styles.logoContainer}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image component doesn't support alt */}
        <Image src="/images/logo.png" />
      </View>

      {/* Receipt Info */}
      <View style={styles.section}>
        <View style={styles.infoGroup}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Receipt No</Text>
            <Text style={styles.infoValue}>#{receiptData.receiptId}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Invoice No</Text>
            <Text style={styles.infoValue}>#{receiptData.invoiceId}</Text>
          </View>
          <View style={styles.infoBoxLast}>
            <Text style={styles.infoTitle}>Date Paid</Text>
            <Text style={styles.infoValue}>{receiptData.datePaid}</Text>
          </View>
        </View>
      </View>

      {/* Payment Confirmation Box */}
      <View style={styles.receiptBox}>
        <Text style={styles.paidStamp}>✓ PAYMENT RECEIVED</Text>
        <Text style={styles.receiptText}>
          We have received your payment for the services provided at:
        </Text>
        <Text style={styles.infoValue}>{receiptData.jobTitle}</Text>
        <Text style={styles.receiptText}>{receiptData.location}</Text>
        <Text style={styles.amountPaid}>
          Amount Paid: ${receiptData.totalAmount.toFixed(2)} CAD
        </Text>
        {receiptData.paymentMethod && (
          <Text style={styles.receiptText}>
            Payment Method: {receiptData.paymentMethod}
          </Text>
        )}
      </View>

      {/* Customer Info */}
      <View style={styles.section}>
        <View style={styles.infoGroup}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Customer</Text>
            <Text style={styles.infoValue}>{receiptData.clientName}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Email</Text>
            <Text style={styles.infoValue}>{receiptData.email}</Text>
          </View>
          <View style={styles.infoBoxLast}>
            <Text style={styles.infoTitle}>Phone</Text>
            <Text style={styles.infoValue}>{receiptData.phoneNumber}</Text>
          </View>
        </View>
      </View>

      {/* Service Details */}
      <View style={styles.serviceDetails}>
        <Text style={styles.sectionTitle}>Services Provided</Text>

        {receiptData.items.map((item, index) => (
          <View style={styles.serviceItem} key={index}>
            <Text style={styles.serviceDescription}>{item.description}</Text>
            <Text style={styles.serviceAmount}>${item.total.toFixed(2)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              ${receiptData.subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>GST (5%):</Text>
            <Text style={styles.totalValue}>${receiptData.gst.toFixed(2)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Paid:</Text>
            <Text style={styles.grandTotalValue}>
              ${receiptData.totalAmount.toFixed(2)} CAD
            </Text>
          </View>
        </View>
      </View>

      {/* Thank You Note */}
      <Text style={styles.thankYou}>THANK YOU FOR YOUR BUSINESS!</Text>

      {/* Notes */}
      <Text style={styles.notes}>
        This receipt serves as confirmation of payment received. Please keep
        this for your records.
      </Text>

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

export default ReceiptPdfDocument;
export type { ReceiptPdfDocumentProps };
