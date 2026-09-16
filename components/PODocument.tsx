/**
 * PODocument — @react-pdf/renderer document matching the Waves International
 * PO layout spec, measured directly from the original Word template.
 *
 * Page:    A4 (595.3 × 841.9 pt), margins 35 pt all sides → content width 525.3 pt
 * Font:    Helvetica (metrically closest built-in to Arial)
 *
 * This file is server-only (imported only from app/api/pdf/[id]/route.ts).
 */
import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Line,
  Svg,
} from '@react-pdf/renderer';
import { COMPANY } from '@/lib/constants';
import { numberToWords } from '@/lib/numberToWords';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItemData {
  description: string;
  qty: number;
  mrp?: number;
  unitRate: number;
  amount: number;
}

interface SupplierData {
  name: string;
  address: string;
  gstn?: string;
}

export interface POData {
  orderNumber: string;
  orderDate: Date | string;
  supplierId: SupplierData | string; // populated supplier
  lineItems: LineItemData[];
  basicAmount: number;
  taxRate: number;
  gstAmount: number;
  grandTotal: number;
  terms?: string;
}

export interface PODocumentProps {
  po: POData;
  logoSrc: string;      // base64 data URL – /public/waves-international-logo.png
  signatureSrc: string; // base64 data URL – /public/waves-international-signature.png
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function fmt(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Layout constants (all in pt) — from Word template measurements ───────────

/** A4 content width: 595.3 − 2×35 = 525.3 pt */
const PAGE_W = 525.3;
const MARGIN  = 35;
const B_C     = '#000000'; // border colour (Word default table border)
const B_W     = 0.75;      // border weight (~1 px, Word "thin" single border)

// 2-column rows (equal halves)
const COL_HALF = 262.65;

// Item-table columns (spec-exact widths; sum = 525.3 pt)
const C_SNO  = 31.5;
const C_DESC = 178.6;
const C_QTY  = 73.55;
const C_MRP  = 63.05;
const C_RATE = 73.55;
const C_AMT  = 105.05;

// PAN / GSTN sub-row columns (sum = 525.3 pt)
const C_PAN  = 115.55;
const C_GST  = 147.1;
const C_SGST = 262.65;

// Terms / Totals row columns (sum = 525.3 pt)
const C_TERMS = 294.15;
const C_LBL   = 126.05;
const C_VAL   = 105.1;

// Footer row columns (sum = 525.3 pt)
const C_FOOTL = 288.9;
const C_FOOTR = 236.4;

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  // Page
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    paddingTop: MARGIN,
    paddingBottom: MARGIN + 14, // room for fixed footer
    paddingLeft: MARGIN,
    paddingRight: MARGIN,
    color: '#000000',
    backgroundColor: '#ffffff',
  },

  // ── 1. Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    minHeight: 54, // Ensure enough height for the absolute logo
  },
  logo: {
    position: 'absolute',
    left: 0,
    width: 80,
    height: 54,
    objectFit: 'contain',
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
    color: '#000000',
  },
  poTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: '#000000',
    marginTop: 2,
  },

  // ── 2. Order info row ────────────────────────────────────────────────────────
  orderRow: {
    flexDirection: 'row',
    width: PAGE_W,
  },
  orderCellLeft: {
    width: COL_HALF,
    flexDirection: 'row',
    borderTopWidth: B_W,
    borderLeftWidth: B_W,
    borderBottomWidth: B_W,
    borderRightWidth: B_W / 2,
    borderColor: B_C,
  },
  orderCellRight: {
    width: COL_HALF,
    flexDirection: 'row',
    borderTopWidth: B_W,
    borderRightWidth: B_W,
    borderBottomWidth: B_W,
    borderLeftWidth: B_W / 2,
    borderColor: B_C,
  },
  orderLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    paddingHorizontal: 8,
    paddingVertical: 7,
    justifyContent: 'center',
  },
  orderValue: {
    fontSize: 8.5,
    paddingHorizontal: 8,
    paddingVertical: 7,
    justifyContent: 'center',
    flex: 1,
  },

  // ── 3. Buyer / Supplier row ───────────────────────────────────────────────────
  buyerSupplierRow: {
    flexDirection: 'row',
    width: PAGE_W,
  },
  bsColLeft: {
    width: COL_HALF,
    borderTopWidth: 0,
    borderLeftWidth: B_W,
    borderBottomWidth: B_W,
    borderRightWidth: B_W / 2,
    borderColor: B_C,
    padding: 8,
  },
  bsColRight: {
    width: COL_HALF,
    borderTopWidth: 0,
    borderRightWidth: B_W,
    borderBottomWidth: B_W,
    borderLeftWidth: B_W / 2,
    borderColor: B_C,
    padding: 8,
  },
  bsHeading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: '#00B0F0',
    marginBottom: 5,
  },
  bsLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    marginBottom: 1,
  },
  bsValue: {
    fontSize: 8,
    marginBottom: 5,
    lineHeight: 1.4,
  },
  bsSupplierName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 4,
  },

  // ── 4. PAN / GSTN sub-row ─────────────────────────────────────────────────────
  panRow: {
    flexDirection: 'row',
    width: PAGE_W,
    backgroundColor: '#F8F8F8',
  },
  panColA: {
    width: C_PAN,
    borderTopWidth: 0,
    borderLeftWidth: B_W,
    borderBottomWidth: B_W,
    borderRightWidth: B_W / 2,
    borderColor: B_C,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  panColB: {
    width: C_GST,
    borderTopWidth: 0,
    borderLeftWidth: B_W / 2,
    borderBottomWidth: B_W,
    borderRightWidth: B_W / 2,
    borderColor: B_C,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  panColC: {
    width: C_SGST,
    borderTopWidth: 0,
    borderLeftWidth: B_W / 2,
    borderRightWidth: B_W,
    borderBottomWidth: B_W,
    borderColor: B_C,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  panLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    marginBottom: 2,
  },
  panValue: {
    fontSize: 8,
  },

  // ── 5. Item table ─────────────────────────────────────────────────────────────
  table: {
    width: PAGE_W,
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F2',
    borderTopWidth: B_W,
    borderLeftWidth: B_W,
    borderRightWidth: B_W,
    borderBottomWidth: B_W,
    borderColor: B_C,
  },
  tableRow: {
    flexDirection: 'row',
    borderLeftWidth: B_W,
    borderRightWidth: B_W,
    borderBottomWidth: B_W,
    borderColor: B_C,
  },
  cell: {
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRightWidth: B_W,
    borderRightColor: B_C,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellNoBorderRight: {
    borderRightWidth: 0,
  },
  thText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    textAlign: 'center',
  },
  tdText: {
    fontSize: 8,
    textAlign: 'center',
  },
  tdTextRight: {
    fontSize: 8,
    textAlign: 'right',
  },

  // ── 6. Terms / Totals row ─────────────────────────────────────────────────────
  termsRow: {
    flexDirection: 'row',
    width: PAGE_W,
    marginTop: 12,
  },
  termsCol: {
    width: C_TERMS,
    borderTopWidth: B_W,
    borderLeftWidth: B_W,
    borderBottomWidth: B_W,
    borderRightWidth: B_W / 2,
    borderColor: B_C,
    padding: 16,
    minHeight: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsHeading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  termsText: {
    fontSize: 8,
    lineHeight: 1.5,
    textAlign: 'center',
  },
  totalsCol: {
    width: C_LBL + C_VAL,
    flexDirection: 'column',
    borderTopWidth: B_W,
    borderRightWidth: B_W,
    borderBottomWidth: B_W,
    borderLeftWidth: B_W / 2,
    borderColor: B_C,
  },
  totalsDataRow: {
    flexDirection: 'row',
    borderBottomWidth: B_W,
    borderBottomColor: B_C,
  },
  totalsDataRowLast: {
    flex: 1, // Fill remaining vertical space in the column
    flexDirection: 'row',
    backgroundColor: '#F2F2F2',
  },
  totalsLabel: {
    width: C_LBL,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRightWidth: B_W,
    borderRightColor: B_C,
    justifyContent: 'center',
  },
  totalsValue: {
    width: C_VAL,
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  grandLabel: {
    width: C_LBL,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRightWidth: B_W,
    borderRightColor: B_C,
    justifyContent: 'center',
  },
  grandValue: {
    width: C_VAL,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    paddingHorizontal: 6,
    paddingVertical: 8,
    justifyContent: 'center',
  },

  // ── 7. Amount in Words ────────────────────────────────────────────────────────
  amountWordsRow: {
    flexDirection: 'row',
    width: PAGE_W,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderLeftWidth: B_W,
    borderRightWidth: B_W,
    borderBottomWidth: B_W,
    borderColor: B_C,
  },
  amountWordsLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    marginRight: 3,
  },
  amountWordsValue: {
    fontSize: 8,
    flex: 1,
  },

  // ── 8. Signature / footer row ─────────────────────────────────────────────────
  sigRow: {
    flexDirection: 'row',
    width: PAGE_W,
    marginTop: 16,
  },
  sigLeft: {
    width: C_FOOTL,
    justifyContent: 'flex-end',
  },
  sigLeftText: {
    fontSize: 7,
    color: '#808080',
  },
  sigRight: {
    width: C_FOOTR,
    alignItems: 'flex-end',
  },
  sigCompany: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    marginBottom: 2,
  },
  sigImage: {
    width: 100,
    height: 50,
    objectFit: 'contain',
    marginBottom: 2,
  },
  sigAuth: {
    fontSize: 7.5,
  },

  // ── 9. Fixed page footer ──────────────────────────────────────────────────────
  pageFooter: {
    position: 'absolute',
    bottom: 14,
    left: MARGIN,
    right: MARGIN,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pageFooterText: {
    fontSize: 7,
    color: '#808080',
  },
});

// ─── HRule helper (SVG line — react-pdf has no native <hr>) ───────────────────

function HRule() {
  return (
    <Svg height={1} width={PAGE_W} style={{ marginBottom: 5 }}>
      <Line x1={0} y1={0.5} x2={PAGE_W} y2={0.5} strokeWidth={0.75} stroke="#000000" />
    </Svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PODocument({ po, logoSrc, signatureSrc }: PODocumentProps) {
  const supplier = po.supplierId as SupplierData;
  const words = numberToWords(po.grandTotal);

  return (
    <Document title={`Purchase Order — ${po.orderNumber}`}>
      <Page size="A4" style={S.page}>

        {/* ── 1. Header ────────────────────────────────────────── */}
        <View style={S.header}>
          <Image src={logoSrc} style={S.logo} />
          <View style={S.headerCenter}>
            <Text style={S.companyName}>WAVES INTERNATIONAL</Text>
            <Text style={S.poTitle}>PURCHASE ORDER</Text>
          </View>
        </View>
        <HRule />

        {/* ── 2. Order Number / Date row ───────────────────────── */}
        <View style={S.orderRow}>
          <View style={S.orderCellLeft}>
            <Text style={S.orderLabel}>Order Number</Text>
            <Text style={S.orderValue}>{po.orderNumber}</Text>
          </View>
          <View style={S.orderCellRight}>
            <Text style={S.orderLabel}>Order Date</Text>
            <Text style={S.orderValue}>{formatDate(po.orderDate)}</Text>
          </View>
        </View>

        {/* ── 3. Buyer / Supplier row ──────────────────────────── */}
        <View style={S.buyerSupplierRow}>
          {/* BUYER */}
          <View style={S.bsColLeft}>
            <Text style={S.bsHeading}>BUYER</Text>
            <Text style={S.bsSupplierName}>{COMPANY.name}</Text>

            <Text style={S.bsLabel}>Billing Address</Text>
            <Text style={S.bsValue}>{COMPANY.billingAddress}</Text>

            <Text style={S.bsLabel}>Shipping Address</Text>
            <Text style={S.bsValue}>{COMPANY.shippingAddress}</Text>

            <View style={{ flexDirection: 'row' }}>
              <Text style={S.bsLabel}>Tel.  </Text>
              <Text style={S.bsValue}>{COMPANY.tel}</Text>
            </View>
          </View>

          {/* SUPPLIER */}
          <View style={S.bsColRight}>
            <Text style={S.bsHeading}>SUPPLIER</Text>
            <Text style={S.bsSupplierName}>{supplier.name}</Text>
            <Text style={S.bsLabel}>Address</Text>
            <Text style={S.bsValue}>{supplier.address}</Text>
          </View>
        </View>

        {/* ── 4. PAN / GSTN sub-row ───────────────────────────── */}
        <View style={S.panRow}>
          <View style={S.panColA}>
            <Text style={S.panLabel}>PAN #</Text>
            <Text style={S.panValue}>{COMPANY.pan}</Text>
          </View>
          <View style={S.panColB}>
            <Text style={S.panLabel}>GSTN #</Text>
            <Text style={S.panValue}>{COMPANY.gstn}</Text>
          </View>
          <View style={S.panColC}>
            <Text style={S.panLabel}>Supplier GSTN #</Text>
            <Text style={S.panValue}>{supplier.gstn || '-'}</Text>
          </View>
        </View>

        {/* ── 5. Item table ───────────────────────────────────── */}
        <View style={S.table}>
          {/* Header */}
          <View style={S.tableHeader}>
            <View style={[S.cell, { width: C_SNO }]}>
              <Text style={S.thText}>S.No</Text>
            </View>
            <View style={[S.cell, { width: C_DESC }]}>
              <Text style={S.thText}>Material Description</Text>
            </View>
            <View style={[S.cell, { width: C_QTY }]}>
              <Text style={S.thText}>Quantity</Text>
            </View>
            <View style={[S.cell, { width: C_MRP }]}>
              <Text style={S.thText}>MRP (INR)</Text>
            </View>
            <View style={[S.cell, { width: C_RATE }]}>
              <Text style={S.thText}>Unit Rate (INR)</Text>
            </View>
            <View style={[S.cell, S.cellNoBorderRight, { width: C_AMT }]}>
              <Text style={S.thText}>Amount (INR)</Text>
            </View>
          </View>

          {/* Body */}
          {po.lineItems.map((line, idx) => (
            <View key={idx} style={S.tableRow}>
              <View style={[S.cell, { width: C_SNO }]}>
                <Text style={S.tdText}>{idx + 1}</Text>
              </View>
              <View style={[S.cell, { width: C_DESC }]}>
                <Text style={S.tdText}>{line.description}</Text>
              </View>
              <View style={[S.cell, { width: C_QTY }]}>
                <Text style={S.tdText}>{line.qty}</Text>
              </View>
              <View style={[S.cell, { width: C_MRP }]}>
                <Text style={S.tdText}>{line.mrp != null ? fmt(line.mrp) : '-'}</Text>
              </View>
              <View style={[S.cell, { width: C_RATE }]}>
                <Text style={S.tdText}>{fmt(line.unitRate)}</Text>
              </View>
              <View style={[S.cell, S.cellNoBorderRight, { width: C_AMT }]}>
                <Text style={S.tdTextRight}>{fmt(line.amount)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── 6. Terms & Totals row ───────────────────────────── */}
        <View style={S.termsRow}>
          {/* Left — terms */}
          <View style={S.termsCol}>
            <Text style={S.termsHeading}>TERMS &amp; CONDITIONS</Text>
            <Text style={S.termsText}>{po.terms || '-'}</Text>
          </View>

          {/* Right — totals stack */}
          <View style={S.totalsCol}>
            {/* Basic Amount */}
            <View style={S.totalsDataRow}>
              <View style={S.totalsLabel}>
                <Text>Basic Amount (INR)</Text>
              </View>
              <View style={S.totalsValue}>
                <Text style={{ textAlign: 'right' }}>{fmt(po.basicAmount)}</Text>
              </View>
            </View>
            {/* GST */}
            <View style={S.totalsDataRow}>
              <View style={S.totalsLabel}>
                <Text>GST ({po.taxRate}%)</Text>
              </View>
              <View style={S.totalsValue}>
                <Text style={{ textAlign: 'right' }}>{fmt(po.gstAmount)}</Text>
              </View>
            </View>
            {/* Grand Total */}
            <View style={S.totalsDataRowLast}>
              <View style={S.grandLabel}>
                <Text>GRAND TOTAL (INR)</Text>
              </View>
              <View style={S.grandValue}>
                <Text style={{ textAlign: 'right' }}>{fmt(po.grandTotal)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── 7. Amount in Words ──────────────────────────────── */}
        <View style={S.amountWordsRow}>
          <Text style={S.amountWordsLabel}>Amount in Words:</Text>
          <Text style={S.amountWordsValue}>{words}</Text>
        </View>

        {/* ── 8. Signature / footer row ───────────────────────── */}
        <View style={S.sigRow}>
          <View style={S.sigLeft}>
            <Text style={S.sigLeftText}>This is a system-generated purchase order.</Text>
          </View>
          <View style={S.sigRight}>
            <Text style={S.sigCompany}>WAVES INTERNATIONAL</Text>
            <Image src={signatureSrc} style={S.sigImage} />
            <Text style={S.sigAuth}>Authorized Signatory</Text>
          </View>
        </View>

        {/* ── 9. Fixed page footer ────────────────────────────── */}
        <View style={S.pageFooter} fixed>
          <Text style={S.pageFooterText}>Waves International</Text>
          <Text
            style={S.pageFooterText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>

      </Page>
    </Document>
  );
}

