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

export interface InvoiceData {
  invoiceId: string;
  dateIssued: string;
  dateDue: string;
  jobTitle: string;
  location: string;
  clientName: string;
  email: string;
  phoneNumber: string;
  items: Array<{
    description: string;
    details?: string;
    price: number;
    total: number;
  }>;
  subtotal: number;
  gst: number;
  totalAmount: number;
  cheque: string;
  eTransfer: string;
  terms: string;
  overrideBillTo?: {
    name: string;
    address: string;
    phone: string;
  } | null;
  currency?: "CAD" | "USD";
  exchangeRate?: number;
  originalCAD?: {
    subtotal: number;
    gst: number;
    total: number;
  };
}

interface InvoicePdfDocumentProps {
  invoiceData: InvoiceData;
  scale?: number; // Scale factor (e.g., 0.85 for 85%, 1.0 for 100%, 1.15 for 115%)
}

const InvoicePdfDocument: React.FC<InvoicePdfDocumentProps> = ({
  invoiceData,
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
      paddingHorizontal: s(25),
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
      height: s(80),
      zIndex: 1,
      opacity: 0.7,
    },
    header: { position: "relative", marginBottom: s(15) },
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
      fontSize: s(26),
      color: "#003e29",
      fontFamily: "Helvetica-Bold",
    },
    companyTitle: {
      fontSize: s(16),
      color: "#003e29",
      fontFamily: "Helvetica-Bold",
      zIndex: 2,
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
    footerText: { fontSize: s(10), color: "white", fontFamily: "Helvetica" },
    section: { marginTop: s(5) },
    infoGroup: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: s(7),
    },
    infoBox: {
      backgroundColor: "#f8f9fa",
      padding: s(8),
      borderRadius: s(4),
      border: "1px solid #e9ecef",
      flex: 1,
      marginRight: s(8),
    },
    infoBoxLast: {
      backgroundColor: "#f8f9fa",
      padding: s(8),
      borderRadius: s(4),
      border: "1px solid #e9ecef",
      flex: 1,
      marginRight: 0,
    },
    infoTitle: {
      fontSize: s(10),
      fontWeight: "bold",
      color: "#6c757d",
      marginBottom: s(4),
      textTransform: "uppercase",
    },
    infoValue: { fontSize: s(12), fontWeight: "bold", color: "#003e29" },
    infoList: { flexGrow: 1 },
    billingBox: {
      backgroundColor: "#ffffff",
      border: "1px solid #dee2e6",
      borderRadius: s(4),
      padding: s(12),
      marginTop: s(6),
    },
    sectionTitle: {
      fontSize: s(12),
      fontWeight: "bold",
      color: "#003e29",
      marginBottom: s(6),
      borderBottom: "1px solid #dee2e6",
      paddingBottom: s(3),
    },
    table: {
      backgroundColor: "#ffffff",
      border: "1px solid #dee2e6",
      borderRadius: s(4),
      marginTop: s(6),
      padding: s(12),
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
      fontFamily: "Helvetica",
    },
    tableCellHeader: {
      padding: s(3),
      borderRightWidth: 1,
      borderRightColor: "#ccc",
      color: "white",
      fontFamily: "Helvetica-Bold",
    },
    serviceItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: s(6),
      paddingHorizontal: s(8),
      borderBottom: "1px solid #f8f9fa",
    },
    serviceDescription: { fontSize: s(11), color: "#495057", flex: 1 },
    serviceDetails: {
      fontSize: s(10),
      color: "#666",
      marginTop: s(13),
      marginLeft: s(10),
      fontStyle: "italic",
      lineHeight: 1.3,
    },
    serviceAmount: {
      fontSize: s(11),
      fontWeight: "bold",
      color: "#003e29",
      width: s(80),
      textAlign: "right",
    },
    totalsSection: {
      marginTop: s(12),
      paddingTop: s(10),
      paddingHorizontal: s(8),
      borderTop: "2px solid #003e29",
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: s(4),
    },
    totalLabel: { fontSize: s(11), color: "#495057" },
    totalValue: { fontSize: s(11), fontWeight: "bold", color: "#003e29" },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: s(8),
      marginTop: s(8),
      backgroundColor: "#f8f9fa",
      paddingHorizontal: s(12),
      borderRadius: s(4),
    },
    grandTotalLabel: { fontSize: s(14), fontWeight: "bold", color: "#003e29" },
    grandTotalValue: { fontSize: s(16), fontWeight: "bold", color: "#003e29" },
    thankYou: {
      marginTop: s(25),
      textAlign: "center",
      fontWeight: "bold",
      fontSize: s(12),
      color: "#003e29",
    },
    terms: { marginTop: s(7), marginBottom: s(7) },
    signature: { marginTop: s(25), alignItems: "flex-end" },
    signatureLine: { width: "50%", borderTop: "1px solid black" },
    signatureText: { marginTop: s(15), fontFamily: "Helvetica" },
    text: { fontFamily: "Helvetica" },
    boldText: { fontFamily: "Helvetica-Bold" },
    greenText: { color: "#003e29", fontFamily: "Helvetica-Bold" },
    paymentDetailsBox: {
      backgroundColor: "#e8f5e8",
      border: "3px solid #28a745",
      borderRadius: s(8),
      padding: s(15),
      marginTop: s(15),
      marginBottom: s(15),
    },
    paymentTitle: {
      fontSize: s(14),
      fontWeight: "bold",
      color: "#28a745",
      textAlign: "center",
      marginBottom: s(12),
      textTransform: "uppercase",
    },
    paymentInfoBox: {
      backgroundColor: "#ffffff",
      padding: s(12),
      borderRadius: s(6),
      border: "2px solid #28a745",
      flex: 1,
      marginRight: s(8),
    },
    paymentInfoBoxLast: {
      backgroundColor: "#ffffff",
      padding: s(12),
      borderRadius: s(6),
      border: "2px solid #28a745",
      flex: 1,
      marginRight: 0,
    },
    paymentLabel: {
      fontSize: s(10),
      fontWeight: "bold",
      color: "#28a745",
      marginBottom: s(6),
      textTransform: "uppercase",
    },
    paymentValue: {
      fontSize: s(11),
      fontWeight: "bold",
      color: "#003e29",
      lineHeight: 1.4,
    },
  });

  return (
    <Document>
      <Page size="A4" style={scaledStyles.page}>
        {/* Header */}
        <View style={scaledStyles.header}>
          {/* SVG Wave */}
          <Svg style={scaledStyles.headerWave}>
            <Path
              fill="#003e29"
              d="M0,320L17.1,288C34.3,256,69,192,103,186.7C137.1,181,171,235,206,224C240,213,274,139,309,112C342.9,85,377,107,411,144C445.7,181,480,235,514,261.3C548.6,288,583,288,617,282.7C651.4,277,686,267,720,256C754.3,245,789,235,823,229.3C857.1,224,891,224,926,224C960,224,994,224,1029,234.7C1062.9,245,1097,267,1131,256C1165.7,245,1200,203,1234,181.3C1268.6,160,1303,160,1337,154.7C1371.4,149,1406,139,1423,133.3L1440,128L1440,0L1422.9,0C1405.7,0,1371,0,1337,0C1302.9,0,1269,0,1234,0C1200,0,1166,0,1131,0C1097.1,0,1063,0,1029,0C994.3,0,960,0,926,0C891.4,0,857,0,823,0C788.6,0,754,0,720,0C685.7,0,651,0,617,0C582.9,0,549,0,514,0C480,0,446,0,411,0C377.1,0,343,0,309,0C274.3,0,240,0,206,0C171.4,0,137,0,103,0C68.6,0,34,0,17,0L0,0Z"
            />
          </Svg>
          {/* Header Content */}
          <View style={scaledStyles.headerContent}>
            <Text style={scaledStyles.invoiceTitle}>INVOICE</Text>
            <Text style={scaledStyles.companyTitle}>
              Vancouver Hood Doctors
            </Text>
          </View>
        </View>

        {/* Logo - Using hybrid approach for client/server compatibility */}
        <View style={scaledStyles.logoContainer}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image component doesn't support alt */}
          <Image
            src={getImageSrc("images/logo.png")}
            style={{ width: "100%", height: "100%" }}
          />
        </View>

        {/* Invoice Info */}
        <View style={scaledStyles.section}>
          <View style={scaledStyles.infoGroup}>
            <View style={scaledStyles.infoBox}>
              <Text style={scaledStyles.infoTitle}>Invoice No</Text>
              <Text style={scaledStyles.infoValue}>
                #{invoiceData.invoiceId}
              </Text>
            </View>
            <View style={scaledStyles.infoBox}>
              <Text style={scaledStyles.infoTitle}>Date</Text>
              <Text style={scaledStyles.infoValue}>
                {invoiceData.dateIssued}
              </Text>
            </View>
            <View style={scaledStyles.infoBoxLast}>
              <Text style={scaledStyles.infoTitle}>Payment Info</Text>
              <Text style={scaledStyles.infoValue}>Mail/E-Transfer</Text>
            </View>
          </View>
        </View>

        {/* Billing Info */}
        <View style={scaledStyles.billingBox}>
          <Text style={scaledStyles.sectionTitle}>Bill To:</Text>
          <Text style={scaledStyles.infoValue}>
            {invoiceData.overrideBillTo?.name || invoiceData.jobTitle.trim()}
          </Text>
          <Text style={{ fontSize: s(10), color: "#495057", marginTop: s(2) }}>
            {invoiceData.overrideBillTo?.address || invoiceData.location}
          </Text>
          <Text style={{ fontSize: s(10), color: "#495057", marginTop: s(2) }}>
            {invoiceData.overrideBillTo?.phone || invoiceData.phoneNumber}
          </Text>
        </View>

        {/* Service Location - Only show if Bill To is overridden */}
        {invoiceData.overrideBillTo && (
          <View style={scaledStyles.billingBox}>
            <Text style={scaledStyles.sectionTitle}>Service Location:</Text>
            <Text style={scaledStyles.infoValue}>
              {invoiceData.jobTitle.trim()}
            </Text>
            <Text
              style={{ fontSize: s(10), color: "#495057", marginTop: s(2) }}
            >
              {invoiceData.location}
            </Text>
          </View>
        )}

        {/* Payment Details - Prominent */}
        <View style={{ marginTop: s(15) }}>
          <View style={scaledStyles.infoGroup}>
            <View style={scaledStyles.paymentInfoBox}>
              <Text style={scaledStyles.paymentLabel}>MAIL PAYMENT TO:</Text>
              <Text style={scaledStyles.paymentValue}>
                {invoiceData.cheque}
              </Text>
            </View>
            <View style={scaledStyles.paymentInfoBoxLast}>
              <Text style={scaledStyles.paymentLabel}>E-TRANSFER TO:</Text>
              <Text style={scaledStyles.paymentValue}>
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
            marginTop: s(7),
            marginBottom: s(10),
            fontSize: s(10),
          }}
        >
          Accessible Areas Serviced Only
        </Text>

        {/* Service Details */}
        <View style={scaledStyles.table}>
          <Text style={scaledStyles.sectionTitle}>Services Provided</Text>

          {invoiceData.items.map((item, index) => (
            <View style={scaledStyles.serviceItem} key={index}>
              <View
                style={{
                  flex: 1,
                  flexDirection: "column",
                  justifyContent: "flex-start",
                }}
              >
                <Text style={scaledStyles.serviceDescription}>
                  {index + 1}. {item.description}
                </Text>
                {item.details && (
                  <Text style={scaledStyles.serviceDetails}>
                    {item.details}
                  </Text>
                )}
              </View>
              <View
                style={{ justifyContent: "flex-start", alignItems: "flex-end" }}
              >
                <Text style={scaledStyles.serviceAmount}>
                  ${item.total.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}

          {/* Totals */}
          <View style={scaledStyles.totalsSection}>
            <View style={scaledStyles.totalRow}>
              <Text style={scaledStyles.totalLabel}>Subtotal:</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                <Text style={scaledStyles.totalValue}>
                  ${invoiceData.subtotal.toFixed(2)} {invoiceData.currency || "CAD"}
                </Text>
                {invoiceData.originalCAD && (
                  <Text style={{ fontSize: s(9), color: "#6c757d", marginLeft: s(4) }}>
                    (${invoiceData.originalCAD.subtotal.toFixed(2)} CAD)
                  </Text>
                )}
              </View>
            </View>
            <View style={scaledStyles.totalRow}>
              <Text style={scaledStyles.totalLabel}>GST# 814301065 (5%):</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                <Text style={scaledStyles.totalValue}>
                  ${invoiceData.gst.toFixed(2)} {invoiceData.currency || "CAD"}
                </Text>
                {invoiceData.originalCAD && (
                  <Text style={{ fontSize: s(9), color: "#6c757d", marginLeft: s(4) }}>
                    (${invoiceData.originalCAD.gst.toFixed(2)} CAD)
                  </Text>
                )}
              </View>
            </View>
            <View style={scaledStyles.grandTotalRow}>
              <Text style={scaledStyles.grandTotalLabel}>Total:</Text>
              <Text style={scaledStyles.grandTotalValue}>
                ${invoiceData.totalAmount.toFixed(2)} {invoiceData.currency || "CAD"}
              </Text>
            </View>
            {invoiceData.originalCAD && invoiceData.exchangeRate && (
              <View style={{ marginTop: s(8), paddingTop: s(8), borderTop: "1px solid #dee2e6" }}>
                <Text style={{ fontSize: s(9), color: "#6c757d", textAlign: "center" }}>
                  Converted from ${invoiceData.originalCAD.total.toFixed(2)} CAD at rate 1 CAD = {(1 / invoiceData.exchangeRate).toFixed(4)} USD
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Thank You Note */}
        <Text style={scaledStyles.thankYou}>THANK YOU FOR YOUR BUSINESS</Text>

        <View style={scaledStyles.terms}>
          <Text
            style={{
              color: "#003e29",
              fontWeight: "bold",
              marginBottom: s(5),
              fontSize: s(11),
            }}
          >
            PAYMENT TERMS
          </Text>
          <Text style={{ fontSize: s(9), lineHeight: 1.4, marginBottom: s(3) }}>
            • Payment due within 14 days of the service date unless otherwise
            agreed in writing.
          </Text>
          <Text style={{ fontSize: s(9), lineHeight: 1.4, marginBottom: s(3) }}>
            • Overdue interest: 2% per month (24% per year), simple interest,
            applied from the day after the due date until paid.
          </Text>
          <Text style={{ fontSize: s(9), lineHeight: 1.4, marginBottom: s(3) }}>
            • Disputes: {invoiceData.terms}
          </Text>
          <Text style={{ fontSize: s(9), lineHeight: 1.4 }}>
            • First-time customers: Unless otherwise agreed in writing, payment
            is due on completion.
          </Text>
        </View>

        {/* Footer */}
        <View style={scaledStyles.footer}>
          <Text style={scaledStyles.footerText}>604-273-8717</Text>
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

export default InvoicePdfDocument;
