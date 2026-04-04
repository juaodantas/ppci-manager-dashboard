import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import type { Project, ProjectService, Payment } from '@manager/domain'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 50,
    color: '#111827',
  },
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
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoBlock: {
    flex: 1,
    minWidth: 120,
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
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1E3A8A',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableRowEven: { backgroundColor: '#F9FAFB' },
  thText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  tdText: { fontSize: 9, color: '#374151' },
  colService: { flex: 3 },
  colQty: { flex: 0.8, textAlign: 'right' },
  colUnit: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  colDate: { flex: 1.5 },
  colStatus: { flex: 1 },
  colAmount: { flex: 1.5, textAlign: 'right' },
  // Total box
  totalBox: {
    alignSelf: 'flex-end',
    backgroundColor: '#1E3A8A',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 8,
    flexDirection: 'row',
    gap: 16,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#BFDBFE',
  },
  totalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  // Clauses
  clauseText: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.5,
    marginBottom: 6,
  },
  // Signatures
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    gap: 40,
  },
  signatureBlock: {
    flex: 1,
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    marginBottom: 6,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
  },
  signatureRole: {
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
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
  planning: 'Planejamento',
  in_progress: 'Em andamento',
  finished: 'Concluído',
  canceled: 'Cancelado',
}

interface ContractPDFProps {
  project: Project & { services: ProjectService[] }
  customerName: string
  payments: Payment[]
  companyName?: string
}

export function ContractPDF({
  project,
  customerName,
  payments,
  companyName = 'Empresa WS',
}: ContractPDFProps) {
  const services = project.services ?? []
  const totalServices = services.reduce((s, i) => s + i.total_price, 0)

  return (
    <Document title={`Contrato — ${project.name}`} author={companyName}>
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
            <Text style={styles.docTitle}>CONTRATO DE SERVIÇOS</Text>
            <Text style={styles.docMeta}>Data: {fmtDate(new Date().toISOString())}</Text>
            <Text style={styles.docMeta}>Status: {STATUS_LABELS[project.status] ?? project.status}</Text>
          </View>
        </View>

        {/* Project info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Projeto</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Projeto</Text>
              <Text style={styles.infoValue}>{project.name}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Cliente</Text>
              <Text style={styles.infoValue}>{customerName}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Início previsto</Text>
              <Text style={styles.infoValue}>{fmtDate(project.start_date)}</Text>
            </View>
            {project.end_date && (
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>Conclusão prevista</Text>
                <Text style={styles.infoValue}>{fmtDate(project.end_date)}</Text>
              </View>
            )}
          </View>
          {project.description && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.infoLabel}>Descrição</Text>
              <Text style={[styles.infoValue, { marginTop: 2, color: '#6B7280' }]}>{project.description}</Text>
            </View>
          )}
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Escopo de Serviços</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colService]}>Serviço / Descrição</Text>
            <Text style={[styles.thText, styles.colQty]}>Qtd</Text>
            <Text style={[styles.thText, styles.colUnit]}>Preço unit.</Text>
            <Text style={[styles.thText, styles.colTotal]}>Total</Text>
          </View>
          {services.map((svc, i) => (
            <View key={svc.id} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowEven : {}]}>
              <Text style={[styles.tdText, styles.colService]}>
                {svc.service_name}{svc.description ? ` — ${svc.description}` : ''}
              </Text>
              <Text style={[styles.tdText, styles.colQty]}>{svc.quantity}</Text>
              <Text style={[styles.tdText, styles.colUnit]}>{fmt(svc.unit_price)}</Text>
              <Text style={[styles.tdText, styles.colTotal]}>{fmt(svc.total_price)}</Text>
            </View>
          ))}
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Valor total do contrato:</Text>
            <Text style={styles.totalValue}>{fmt(project.total_value || totalServices)}</Text>
          </View>
        </View>

        {/* Payments */}
        {payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Condições de Pagamento</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, styles.colDate]}>Vencimento</Text>
              <Text style={[styles.thText, styles.colStatus]}>Status</Text>
              <Text style={[styles.thText, { flex: 1.5 }]}>Forma</Text>
              <Text style={[styles.thText, styles.colAmount]}>Valor</Text>
            </View>
            {payments.map((pmt, i) => (
              <View key={pmt.id} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowEven : {}]}>
                <Text style={[styles.tdText, styles.colDate]}>{fmtDate(pmt.due_date)}</Text>
                <Text style={[styles.tdText, styles.colStatus]}>
                  {pmt.status === 'paid' ? 'Pago' : 'Pendente'}
                </Text>
                <Text style={[styles.tdText, { flex: 1.5 }]}>{pmt.payment_method ?? '—'}</Text>
                <Text style={[styles.tdText, styles.colAmount]}>{fmt(pmt.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Clauses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cláusulas Gerais</Text>
          <Text style={styles.clauseText}>
            1. O presente contrato tem por objeto a prestação dos serviços de proteção e prevenção contra incêndio descritos no escopo acima, conforme normas técnicas vigentes.
          </Text>
          <Text style={styles.clauseText}>
            2. Os serviços serão executados de acordo com as normas da ABNT e exigências do Corpo de Bombeiros Militar, dentro do prazo acordado entre as partes.
          </Text>
          <Text style={styles.clauseText}>
            3. O pagamento deverá ser realizado conforme o cronograma financeiro estabelecido. O atraso no pagamento implicará multa de 2% e juros de mora de 1% ao mês.
          </Text>
          <Text style={styles.clauseText}>
            4. Qualquer alteração no escopo dos serviços deverá ser formalmente acordada entre as partes mediante aditivo contratual.
          </Text>
          <Text style={styles.clauseText}>
            5. O presente instrumento é firmado em caráter irrevogável e irretratável, obrigando as partes e seus sucessores.
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <View style={{ height: 40 }} />
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{companyName}</Text>
            <Text style={styles.signatureRole}>Contratante</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={{ height: 40 }} />
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{customerName}</Text>
            <Text style={styles.signatureRole}>Contratado</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{companyName} — {project.name}</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
