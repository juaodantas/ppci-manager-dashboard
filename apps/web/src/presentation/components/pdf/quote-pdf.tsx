import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer'
import type { Quote, QuoteItem } from '@manager/domain'

Font.register({
  family: 'Helvetica',
  fonts: [],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    color: '#111827',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#562923',
  },
  logo: {
    width: 80,
    height: 40,
    objectFit: 'contain',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#562923',
  },
  companySubtitle: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  docTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    textAlign: 'right',
  },
  docMeta: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 3,
  },
  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  infoBlock: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
    padding: 10,
  },
  infoLabel: {
    fontSize: 8,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    color: '#111827',
  },
  // Table
  table: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1E40AF',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableRowEven: {
    backgroundColor: '#F9FAFB',
  },
  colService: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  thText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  tdText: {
    fontSize: 9,
    color: '#374151',
  },
  // Totals
  totalsContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    width: 220,
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 9,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 9,
    color: '#111827',
  },
  grandTotalRow: {
    flexDirection: 'row',
    width: 220,
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#1E40AF',
    borderRadius: 4,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  grandTotalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  // Notes
  notesBox: {
    backgroundColor: '#FEF9C3',
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
  },
  notesText: {
    fontSize: 9,
    color: '#713F12',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
  },
})

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
}

interface QuotePDFProps {
  quote: Quote & { items: QuoteItem[] }
  customerName: string
  companyName?: string
}

export function QuotePDF({ quote, customerName, companyName = 'Empresa WS' }: QuotePDFProps) {
  const subtotal = (quote.items ?? []).reduce((s, i) => s + i.total_price, 0)
  const total = subtotal - (quote.discount ?? 0)

  return (
    <Document title={`Orçamento — ${customerName}`} author={companyName}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image style={styles.logo} src="/logo.png" />
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companySubtitle}>Proteção e Prevenção Contra Incêndio</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>ORÇAMENTO</Text>
            <Text style={styles.docMeta}>Data: {fmtDate(quote.created_at)}</Text>
            <Text style={styles.docMeta}>Status: {STATUS_LABELS[quote.status] ?? quote.status}</Text>
            {quote.valid_until && (
              <Text style={styles.docMeta}>Válido até: {fmtDate(quote.valid_until)}</Text>
            )}
          </View>
        </View>

        {/* Client info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Nome</Text>
            <Text style={styles.infoValue}>{customerName}</Text>
          </View>
        </View>

        {/* Items table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serviços</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, styles.colService]}>Serviço / Descrição</Text>
              <Text style={[styles.thText, styles.colQty]}>Qtd</Text>
              <Text style={[styles.thText, styles.colUnit]}>Preço unit.</Text>
              <Text style={[styles.thText, styles.colTotal]}>Total</Text>
            </View>
            {(quote.items ?? []).map((item, i) => (
              <View
                key={item.id ?? i}
                style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowEven : {}]}
              >
                <Text style={[styles.tdText, styles.colService]}>
                  {item.description ?? `Serviço ${i + 1}`}
                </Text>
                <Text style={[styles.tdText, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tdText, styles.colUnit]}>{fmt(item.unit_price)}</Text>
                <Text style={[styles.tdText, styles.colTotal]}>{fmt(item.total_price)}</Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{fmt(subtotal)}</Text>
            </View>
            {(quote.discount ?? 0) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Desconto</Text>
                <Text style={[styles.totalValue, { color: '#DC2626' }]}>- {fmt(quote.discount)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>{fmt(total)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {quote.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{quote.notes}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{companyName} — Documento gerado em {fmtDate(new Date().toISOString())}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
