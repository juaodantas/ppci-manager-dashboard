import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
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
  headerLeft: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '60%',
  },
  headerRight: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: '40%',
    alignItems: 'flex-end',
    textAlign: 'right',
  },
  logo: {
    width: 80,
    height: 40,
    objectFit: 'contain',
    marginBottom: 4,
  },
  companyBlock: {
    maxWidth: 280,
  },
  companyName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#562923',
    lineHeight: 1.1,
  },
  companySubtitle: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  docTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    textAlign: 'right',
    lineHeight: 1.15,
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

Font.register({
  family: 'Helvetica',
  fonts: [],
})

Font.registerHyphenationCallback((word) => [word])

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

function getDaysUntil(dateStr?: string | null) {
  if (!dateStr) return null
  const target = new Date(dateStr).getTime()
  if (Number.isNaN(target)) return null
  const now = new Date().getTime()
  const diff = target - now
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}

function getCompanyNameStyle(companyName: string) {
  const length = companyName.trim().length
  if (length >= 60) return { fontSize: 10 }
  if (length >= 45) return { fontSize: 12 }
  if (length >= 32) return { fontSize: 14 }
  return { fontSize: 20 }
}

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planejamento',
  in_progress: 'Em andamento',
  finished: 'Concluído',
  finished_pending_payment: 'Concluído - Pagamento Pendente',
  canceled: 'Cancelado',
}

interface ContractPDFProps {
  project: Project & { services: ProjectService[] }
  customerName: string
  payments: Payment[]
  customerDocument?: string
  companyName?: string
  companyCnpj?: string
}

export function ContractPDF({
  project,
  customerName,
  payments,
  customerDocument,
  companyName = 'Empresa WS',
  companyCnpj,
}: ContractPDFProps) {
  const services = (project.services ?? []).filter((svc) => svc.service_type !== 'tax_deduction')
  const totalServices = services.reduce((s, i) => s + i.total_price, 0)
  const daysUntilEnd = getDaysUntil(project.end_date)
  const rescisaoPrazoText = daysUntilEnd === null ? 'prazo a definir' : `${daysUntilEnd} dias`
  const resolvedCustomerDocument = customerDocument?.trim()

  return (
    <Document title={`Contrato — ${project.name}`} author={companyName}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.companyBlock, styles.headerLeft]}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image style={styles.logo} src="/logo.png" />
            <Text
              style={[styles.companyName, getCompanyNameStyle(companyName)]}
            >
              {companyName}
            </Text>
            <Text style={styles.companySubtitle}>Proteção e Prevenção Contra Incêndio</Text>
            {companyCnpj && (
              <Text style={styles.companySubtitle}>CNPJ: {companyCnpj}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
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
            {resolvedCustomerDocument && (
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>CPF/CNPJ</Text>
                <Text style={styles.infoValue}>{resolvedCustomerDocument}</Text>
              </View>
            )}
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
            <Text style={styles.totalValue}>{fmt(totalServices)}</Text>
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
            1. CLÁUSULA – DO OBJETO
          </Text>
          <Text style={styles.clauseText}>
            O presente contrato tem por objeto a prestação de serviços de consultoria, assessoria técnica e/ou execução de serviços especializados na área de proteção e prevenção contra incêndio, conforme escopo descrito neste instrumento, proposta comercial, ordem de serviço ou documento equivalente aprovado pelas partes.
          </Text>
          <Text style={styles.clauseText}>
            Parágrafo único. A CONTRATADA limitar-se-á à execução dos serviços expressamente previstos no escopo contratado. Qualquer serviço adicional deverá ser previamente ajustado entre as partes, por escrito, podendo gerar alteração de prazo e valor.
          </Text>
          <Text style={styles.clauseText}>
            2. CLÁUSULA – DO PRAZO DE EXECUÇÃO
          </Text>
          <Text style={styles.clauseText}>
            Os serviços serão executados no prazo acordado entre as partes, contado a partir da assinatura deste contrato, do pagamento inicial, quando houver, e/ou da entrega dos documentos e informações necessários ao início dos trabalhos.
          </Text>
          <Text style={styles.clauseText}>
            Parágrafo primeiro. O cumprimento dos prazos dependerá da colaboração do CONTRATANTE, especialmente quanto ao envio de documentos, informações, plantas, autorizações, acessos ao local e demais elementos necessários à execução dos serviços.
          </Text>
          <Text style={styles.clauseText}>
            Parágrafo segundo. Eventuais atrasos decorrentes da falta de documentos, informações, aprovações, acesso ao local, pagamento ou providências de responsabilidade do CONTRATANTE não serão considerados atraso da CONTRATADA.
          </Text>
          <Text style={styles.clauseText}>
            3. CLÁUSULA – DO VALOR E DA FORMA DE PAGAMENTO
          </Text>
          <Text style={styles.clauseText}>
            Pela prestação dos serviços contratados, o CONTRATANTE pagará à CONTRATADA o valor total de {fmt(totalServices)}, conforme condições e cronograma financeiro estabelecidos entre as partes.
          </Text>
          <Text style={styles.clauseText}>
            Parágrafo primeiro. O pagamento deverá ser realizado por meio de PIX, transferência bancária, boleto ou outro meio, conforme dados informados pela CONTRATADA.
          </Text>
          <Text style={styles.clauseText}>
            Parágrafo segundo. O atraso no pagamento implicará multa de 2% sobre o valor em atraso, acrescida de juros de mora de 1% ao mês, calculados proporcionalmente ao período de atraso.
          </Text>
          <Text style={styles.clauseText}>
            Parágrafo terceiro. A ausência de pagamento nas condições acordadas poderá acarretar a suspensão dos serviços até a regularização dos valores pendentes, sem que isso configure descumprimento contratual por parte da CONTRATADA.
          </Text>
          <Text style={styles.clauseText}>
            4. CLÁUSULA – DAS DESPESAS NÃO INCLUÍDAS
          </Text>
          <Text style={styles.clauseText}>
            Não estão incluídas no valor contratado eventuais taxas, emolumentos, despesas com órgãos públicos, emissão de ART/RRT, plotagem de plantas, materiais, equipamentos, adequações físicas, deslocamentos extraordinários, hospedagens, serviços de terceiros ou quaisquer outros custos não previstos expressamente no escopo contratado.
          </Text>
          <Text style={styles.clauseText}>
            Parágrafo único. As despesas adicionais necessárias à execução dos serviços deverão ser previamente informadas ao CONTRATANTE e somente serão realizadas mediante aprovação das partes.
          </Text>
          <Text style={styles.clauseText}>
            5. CLÁUSULA – DAS OBRIGAÇÕES DO CONTRATANTE
          </Text>
          <Text style={styles.clauseText}>
            São obrigações do CONTRATANTE: a) fornecer à CONTRATADA todos os documentos, informações, plantas, autorizações, acessos e demais elementos necessários à execução dos serviços; b) efetuar os pagamentos nas datas e condições acordadas; c) prestar informações verdadeiras, completas e atualizadas; d) aprovar previamente eventuais despesas adicionais necessárias à execução dos serviços; e) providenciar adequações, correções, obras, materiais, equipamentos ou serviços de terceiros que não estejam incluídos no escopo contratado; f) permitir o acesso da CONTRATADA ao local de execução dos serviços, quando necessário; g) acompanhar e validar as informações necessárias ao adequado andamento dos trabalhos.
          </Text>
          <Text style={styles.clauseText}>
            6. CLÁUSULA – DAS OBRIGAÇÕES DA CONTRATADA
          </Text>
          <Text style={styles.clauseText}>
            São obrigações da CONTRATADA: a) executar os serviços contratados com zelo, técnica e responsabilidade; b) utilizar mão de obra especializada e capacitada, quando aplicável; c) observar as normas técnicas vigentes e exigências dos órgãos competentes, dentro do escopo contratado; d) prestar esclarecimentos ao CONTRATANTE sobre o andamento dos serviços; e) executar os serviços conforme as condições previstas neste contrato e no escopo aprovado pelas partes; f) responder por eventuais falhas técnicas diretamente decorrentes de sua atuação.
          </Text>
          <Text style={styles.clauseText}>
            7. CLÁUSULA – DA ALTERAÇÃO DE ESCOPO
          </Text>
          <Text style={styles.clauseText}>
            Qualquer alteração, ampliação, redução ou modificação dos serviços contratados deverá ser previamente acordada entre as partes, por escrito, mediante aditivo contratual, nova proposta comercial, ordem de serviço ou outro documento equivalente.
          </Text>
          <Text style={styles.clauseText}>
            Parágrafo único. Alterações de escopo poderão implicar revisão de valores, prazos e condições de execução.
          </Text>
          <Text style={styles.clauseText}>
            8. CLÁUSULA – DA CONFIDENCIALIDADE
          </Text>
          <Text style={styles.clauseText}>
            As partes comprometem-se a manter sigilo sobre documentos, dados técnicos, informações comerciais, projetos, laudos, relatórios e quaisquer outras informações a que tiverem acesso em razão deste contrato.
          </Text>
          <Text style={styles.clauseText}>
            Parágrafo único. As informações obtidas deverão ser utilizadas exclusivamente para a execução dos serviços contratados, não podendo ser divulgadas a terceiros sem autorização prévia da parte interessada, salvo por exigência legal ou solicitação de órgão competente.
          </Text>
          <Text style={styles.clauseText}>
            9. CLÁUSULA – DA AUSÊNCIA DE VÍNCULO
          </Text>
          <Text style={styles.clauseText}>
            O presente contrato não gera vínculo empregatício, societário, associativo, de representação comercial, mandato ou subordinação entre as partes, tratando-se de prestação de serviços autônoma e independente.
          </Text>
          <Text style={styles.clauseText}>
            10. CLÁUSULA – DA RESCISÃO
          </Text>
          <Text style={styles.clauseText}>
            O presente contrato poderá ser rescindido por acordo entre as partes ou em caso de descumprimento de qualquer obrigação contratual.
          </Text>
          <Text style={styles.clauseText}>
            Parágrafo primeiro. Em caso de rescisão imotivada pelo CONTRATANTE após o início dos serviços, serão devidos à CONTRATADA os valores correspondentes aos serviços já executados, bem como eventuais despesas já assumidas, aprovadas ou necessárias até a data da rescisão.
          </Text>
          <Text style={styles.clauseText}>
            Parágrafo segundo. Em caso de descumprimento contratual, a parte prejudicada poderá notificar a outra para regularização no prazo de {rescisaoPrazoText}, sob pena de rescisão do contrato.
          </Text>
          <Text style={styles.clauseText}>
            11. CLÁUSULA – DAS DISPOSIÇÕES GERAIS
          </Text>
          <Text style={styles.clauseText}>
            A eventual tolerância de uma das partes quanto ao descumprimento de qualquer obrigação contratual não constituirá novação, renúncia ou alteração das condições pactuadas.
          </Text>
          <Text style={styles.clauseText}>
            Parágrafo primeiro. Este contrato obriga as partes e seus sucessores, a qualquer título.
          </Text>
          <Text style={styles.clauseText}>
            Parágrafo segundo. O presente instrumento somente poderá ser alterado mediante acordo por escrito entre as partes.
          </Text>
          <Text style={styles.clauseText}>
            12. CLÁUSULA – DO FORO
          </Text>
          <Text style={styles.clauseText}>
            Fica eleito o foro da Comarca de Cuiabá-MT para dirimir quaisquer dúvidas ou controvérsias decorrentes deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
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
