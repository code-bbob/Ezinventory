import { useParams } from "react-router-dom"
import Invoice from "@/components/invoice"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

const InvoicePage = () => {
  const { transactionId } = useParams()
  const navigate = useNavigate()

  return (
    <div>
      {/* Back button hidden on print via .no-print */}
      <div className="no-print" style={{ padding: "1rem" }}>
        <Button
          onClick={() => navigate("/")}
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-3" />
          Back to Dashboard
        </Button>
      </div>

      <Invoice transactionId={transactionId} />
    </div>
  )
}

export default InvoicePage