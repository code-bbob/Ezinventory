import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import styled, { createGlobalStyle } from "styled-components"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import useAxios from "@/utils/useAxios"

const PrintStyle = createGlobalStyle`
  @media print {
    @page {
      size: 80mm auto;
      margin: 0;
    }
    html, body {
      width: 80mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }
    .no-print {
      display: none !important;
    }
  }
`

const ReceiptWrap = styled.div`
  width: 80mm;
  margin: 2rem auto;
  padding: 6mm 5mm;
  background: white;
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
  color: #000;
  box-sizing: border-box;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);

  @media print {
    margin: 0 !important;
    padding: 4mm !important;
    box-shadow: none !important;
    /* height is set dynamically by handlePrint via inline style */
  }
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`
const CompanyName = styled.div`font-size: 15px; font-weight: bold;`
const Small = styled.div`font-size: 10px; color: #333; line-height: 1.5;`
const InvoiceLabel = styled.div`font-size: 13px; font-weight: bold; text-transform: uppercase; text-align: right;`
const Dash = styled.hr`border: none; border-top: 1px dashed #000; margin: 5px 0;`
const Section = styled.div`margin: 4px 0; font-size: 10px; line-height: 1.6;`
const SectionTitle = styled.div`font-weight: bold; font-size: 11px;`
const RTable = styled.table`width: 100%; border-collapse: collapse; font-size: 10px;`
const Th = styled.th`text-align: ${p => p.$r ? "right" : "left"}; padding: 2px; font-weight: bold; border-bottom: 1px solid #000; white-space: nowrap;`
const Td = styled.td`text-align: ${p => p.$r ? "right" : "left"}; padding: 2px; vertical-align: top; word-break: break-word;`
const TotalRow = styled.div`display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin: 6px 0;`
const Center = styled.div`text-align: center; font-size: 10px; color: #555; margin: 5px 0 2px;`

const Invoice = ({ transactionId }) => {
  const [invoiceData, setInvoiceData] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const receiptRef = useRef(null)
  const api  = useAxios()
  const type = new URLSearchParams(window.location.search).get("type")

  useEffect(() => {
    ;(async () => {
      try {
        const url = type === "all"
          ? `alltransaction/salestransaction/${transactionId}/`
          : `transaction/salestransaction/${transactionId}/`
        const { data } = await api.get(url)
        setInvoiceData(data)
      } catch {
        setError("Failed to fetch invoice data")
      } finally {
        setLoading(false)
      }
    })()
  }, [transactionId])

  const handlePrint = () => {
    if (!receiptRef.current) { window.print(); return }
    const contentHeightPx = receiptRef.current?.scrollHeight
    // Measure exact pixel height of receipt content
    // Convert px to mm (1px = 0.264583mm at 96dpi)
    const contentHeightMm = Math.ceil(contentHeightPx * 0.264583) + 5 // +5mm buffer

    // Inject a one-time <style> that sets the exact page height
    const styleId = "dynamic-print-height"
    let el = document.getElementById(styleId)
    if (!el) {
      el = document.createElement("style")
      el.id = styleId
      document.head.appendChild(el)
    }
    el.textContent = `
      @media print {
        @page {
          size: 80mm ${contentHeightMm}mm;
          margin: 0;
        }
      }
    `

    window.print()

    // Clean up after print dialog closes
    setTimeout(() => el.remove(), 2000)
  }

  if (loading)      return <div style={{ padding: "2rem", textAlign: "center" }}>Loading invoice…</div>
  if (error)        return <div style={{ padding: "2rem", color: "red" }}>{error}</div>
  if (!invoiceData) return null

  return (
    <>
      <PrintStyle />

      <ReceiptWrap ref={receiptRef}>
        {/* Header */}
        <Row style={{ marginBottom: 4 }}>
          <div>
            <CompanyName>{invoiceData.enterprise_name}</CompanyName>
            <Small>
              {invoiceData.enterprise_address}<br />
              Phone: (+977) {invoiceData.enterprise_contact}
            </Small>
          </div>
          <div style={{ textAlign: "right" }}>
            <InvoiceLabel>Invoice</InvoiceLabel>
            <Small>
              #{invoiceData.bill_no}<br />
              {format(new Date(invoiceData.date), "dd/MM/yyyy")}
            </Small>
          </div>
        </Row>

        <Dash />

        {/* Bill To */}
        <Section>
          <SectionTitle>Bill To:</SectionTitle>
          {invoiceData.name         && <div>{invoiceData.name}</div>}
          {invoiceData.phone_number && <div>Phone: {invoiceData.phone_number}</div>}
        </Section>

        <Dash />

        {/* Items */}
        <RTable>
          <thead>
            <tr>
              <Th style={{ width: 14 }}>#</Th>
              <Th>Item</Th>
              <Th $r style={{ width: 22 }}>Qty</Th>
              <Th $r style={{ width: 38 }}>Price</Th>
              <Th $r style={{ width: 38 }}>Total</Th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.sales.map((item, i) => {
              const label = item.phone_name
                ? `${item.phone_name} (${item.imei_number})`
                : item.product_name
              const total = item.total_price ?? item.unit_price
              return (
                <tr key={item.id}>
                  <Td>{i + 1}</Td>
                  <Td>{label}</Td>
                  <Td $r>{item.quantity || 1}</Td>
                  <Td $r>{item.unit_price}</Td>
                  <Td $r>{total}</Td>
                </tr>
              )
            })}
          </tbody>
        </RTable>

        <Dash />

        <TotalRow>
          <span>Total Amount:</span>
          <span>{invoiceData.total_amount}</span>
        </TotalRow>

        <Dash />

        <Center>Thank you for your business!</Center>

        <div className="no-print" style={{ marginTop: "1rem" }}>
          <Button onClick={handlePrint} style={{ width: "100%" }}>
            <Printer size={16} style={{ marginRight: 8 }} />
            Print Invoice
          </Button>
        </div>

      </ReceiptWrap>
    </>
  )
}

export default Invoice