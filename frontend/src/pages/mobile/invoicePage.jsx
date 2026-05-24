import { useParams } from "react-router-dom"
import Invoice from "@/components/invoice"
import { Button
 } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

const InvoicePage = () => {
  const { transactionId } = useParams()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-100 py-8">
         <Button
        onClick={() => navigate("/")}
        variant="outline"
        className="w-full lg:w-auto px-5 mb-4 text-black border-white print:hidden hover:bg-gray-700 hover:text-white"
      >
        <ArrowLeft className="mr-2 h-4 w-3" />
        Back to Dashboard
      </Button>
      <Invoice transactionId={transactionId} />
    </div>
  )
}

export default InvoicePage

