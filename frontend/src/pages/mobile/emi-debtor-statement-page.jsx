import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,TableBody,TableCell,TableHead,TableHeader,TableRow,
} from "@/components/ui/table";
import {
  Printer, Download, ChevronDown, Search, Calendar, ArrowLeft, Building2, User, Phone, CreditCard,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useAxios from "@/utils/useAxios";
import { useNavigate, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function EMIDebtorStatementPage() {
  const { debtorId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const api = useAxios();
  const navigate = useNavigate();

  useEffect(() => { fetchStatement(); }, [debtorId]);

  const fetchStatement = async (params = {}) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await api.get(`transaction/emidebtor/statement/${debtorId}/?${qs}`);
      setData(res.data);
    } catch (e) {
      setError("Failed to fetch EMI debtor statement");
    } finally { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); const p={}; if(searchTerm) p.search=searchTerm; if(startDate) p.start_date=startDate; if(endDate) p.end_date=endDate; fetchStatement(p); };
  const handleDateSearch = (e) => { e.preventDefault(); const p={}; if(startDate) p.start_date=startDate; if(endDate) p.end_date=endDate; if(searchTerm) p.search=searchTerm; fetchStatement(p); };

  const handlePrint = () => window.print();

  const handleDownloadCSV = () => {
    if(!data || !data.debtor_transactions.length) return;
    const esc = v=>`"${String(v).replace(/"/g,'""')}"`;
    let csv = ['Date','Description','Method','Cheque No.','Amount','Due Balance'].map(esc).join(',')+'\n';
    data.debtor_transactions.forEach(tx=>{
      const amt = `${tx.amount>0?'-': ''}NPR ${Math.abs(tx.amount)}`;
      csv += [tx.date,tx.desc||'N/A',tx.method,tx.cheque_number||'-',amt,tx.due].map(esc).join(',')+'\n';
    });
    csv += '\n'+esc('EMI Debtor Information:')+'\n';
    csv += [ ['Name:',data.debtor_data.name], ['Phone:',data.debtor_data.phone_number||'N/A'], ['Current Due:',`NPR ${data.debtor_data.due}`] ].map(r=>r.map(esc).join(',')).join('\n')+'\n';
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`EMI_Debtor_Statement_${data.debtor_data.name}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleDownloadPDF = () => {
    if(!data || !data.debtor_transactions.length) return;
    const doc=new jsPDF();
    doc.setFont('times','italic'); doc.setFontSize(20); doc.text(`EMI Debtor Statement - ${data.debtor_data.name}`,15,22);
    doc.setFont('times','italic'); doc.setFontSize(11); doc.text(`Statement Date: ${format(new Date(),'MMMM d, yyyy')}`,15,28);
    const head=[["Date","Description","Method","Cheque No.","Amount","Due Balance"]];
    const body=data.debtor_transactions.map(tx=>[tx.date,tx.desc||'N/A',tx.method,tx.cheque_number||'-',`${tx.amount>0?'-': ''}NPR ${Math.abs(tx.amount).toLocaleString()}`,`NPR ${tx.due.toLocaleString()}`]);
    doc.autoTable({head,body,startY:35,styles:{fontSize:8,cellPadding:3},headStyles:{fillColor:[99,102,241],textColor:255,fontStyle:'bold'},alternateRowStyles:{fillColor:[245,245,245]}});
    const totalCount=data.debtor_transactions.length;
    const totalCredit=Math.abs(data.debtor_transactions.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0));
    const totalPaid=data.debtor_transactions.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
    const currentDue=data.debtor_data.due;
    let y=doc.lastAutoTable.finalY+12; const right=doc.internal.pageSize.getWidth()-15; doc.setFont('helvetica','bolditalic'); doc.setFontSize(12); doc.setTextColor(99,102,241); doc.text('Summary',right,y,{align:'right'}); y+=6; doc.setFont('courier','normal'); doc.setFontSize(10); doc.setTextColor(0,0,0);
    const lines=[`Transactions: ${totalCount}`,`Total Credit: NPR ${totalCredit.toLocaleString()}`,`Total Paid: NPR ${totalPaid.toLocaleString()}`,`Current Due: NPR ${currentDue.toLocaleString()}`];
    lines.forEach(line=>{doc.text(line,right,y,{align:'right'}); y+=6;});
    doc.save(`EMI_Debtor_Statement_${data.debtor_data.name}.pdf`);
  };

  // Implements due calculation: add negative amounts, subtract positive amounts for each row
  const transactionsWithBalance = data ? data.debtor_transactions.reduce((acc, transaction, idx) => {
    let due;
    if (idx === 0) {
      due = transaction.previous_due !== undefined ? transaction.previous_due : 0;
    } else {
      due = acc[idx-1].due;
    }
    const amount = Number(transaction.totalAmount ?? transaction.amount);
      due -= amount;
    acc.push({ ...transaction, due });
    return acc;
  }, []) : [];
  const getColor = amt => amt>0 ? 'text-green-400' : 'text-red-400';

  if(loading) return <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">Loading EMI debtor statement...</div>;
  if(error) return <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-red-500">{error}</div>;
  if(!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 lg:px-8 print:bg-white print:p-0">
      <Button onClick={()=>navigate(-1)} variant="outline" className="w-full lg:w-auto px-5 mb-4 text-black border-white print:hidden hover:bg-gray-700 hover:text-white">
        <ArrowLeft className="mr-2 h-4 w-3"/> Back
      </Button>
      <Card className="bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg print:shadow-none print:bg-white">
        <CardHeader className="border-b border-slate-700 print:border-gray-200">
          <CardTitle className="text-2xl lg:text-3xl font-bold text-white print:text-black flex items-center gap-3">
            <Building2 className="h-8 w-8"/> EMI Debtor Statement - {data.debtor_data.name}
          </CardTitle>
          <p className="text-sm text-gray-400 print:text-gray-600">Statement Date: {format(new Date(),"MMMM d, yyyy")}</p>
          <Card className="mb-6 mt-4 bg-slate-700 border-slate-600 print:hidden">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2"><User className="h-5 w-5 text-blue-400"/><div><p className="text-sm text-gray-400">Name</p><p className="font-semibold text-lg text-white">{data.debtor_data.name}</p></div></div>
                <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-green-400"/><div><p className="text-sm text-gray-400">Brand</p><p className="text-lg text-white">{data.debtor_data.brand_name||'N/A'}</p></div></div>
                <div className="flex items-center gap-2"><Phone className="h-5 w-5 text-purple-400"/><div><p className="text-sm text-gray-400">Phone</p><p className="text-lg text-white">{data.debtor_data.phone_number||'N/A'}</p></div></div>
                <div className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-red-400"/><div><p className="text-sm text-gray-400">Current Due</p><p className="text-lg text-red-400">NPR {data.debtor_data.due.toLocaleString()}</p></div></div>
              </div>
            </CardContent>
          </Card>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6 space-y-4 lg:space-y-0 lg:flex lg:flex-wrap lg:items-center lg:gap-4 print:hidden">
            <form onSubmit={handleSearch} className="w-full lg:w-auto">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <Input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search transactions..." className="pl-10 w-full lg:w-64 bg-slate-700 text-white border-gray-600"/>
              </div>
            </form>
            <form onSubmit={handleDateSearch} className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex items-center space-x-2"><Label className="text-white">Start:</Label><Input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-slate-700 text-white border-gray-600"/></div>
              <div className="flex items-center space-x-2"><Label className="text-white">End:</Label><Input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-slate-700 text-white border-gray-600"/></div>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white"><Calendar className="w-4 h-4 mr-2"/>Filter by Date</Button>
            </form>
            <div className="flex space-x-2">
              <Button onClick={handlePrint} className="bg-blue-500 hover:bg-blue-600 text-white"><Printer className="mr-2 h-4 w-4"/>Print</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" className="bg-green-500 hover:bg-green-600 text-white"><Download className="mr-2 h-4 w-4"/>Download<ChevronDown className="ml-2 h-4 w-4"/></Button></DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleDownloadPDF}>Download as PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadCSV}>Download as CSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="rounded-lg border border-slate-600 print:border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-700 print:bg-gray-100">
                  <TableHead className="text-white print:text-black">Date</TableHead>
                  <TableHead className="text-white print:text-black">Description</TableHead>
                  <TableHead className="text-white print:text-black">Method</TableHead>
                  <TableHead className="text-white print:text-black">Cheque No.</TableHead>
                  <TableHead className="text-right text-white print:text-black">Amount</TableHead>
                  <TableHead className="text-right text-white print:text-black">Due Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsWithBalance.map((tx,i)=>(
                  <TableRow key={tx.id} className={`${i%2===0? 'bg-slate-800 print:bg-white':'bg-slate-750 print:bg-gray-50'} hover:bg-slate-700`}> 
                    <TableCell className="text-white print:text-black">{format(new Date(tx.date),'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-white print:text-black max-w-xs">{tx.desc||'No description'}</TableCell>
                    <TableCell className="text-white print:text-black capitalize">{tx.method}</TableCell>
                    <TableCell className="text-white print:text-black">{tx.cheque_number||'-'}</TableCell>
                    <TableCell className={`text-right font-semibold ${getColor(tx.amount)} print:text-black`}>{tx.amount>0?'-': ''}NPR {Math.abs(tx.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold text-white print:text-black">NPR {tx.due.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-6 flex justify-end">
            <div className="w-80 bg-slate-800 p-6 rounded-lg print:bg-gray-100">
              <div className="space-y-1">
                <div className="flex justify-between"><span className="text-gray-400">Total Transactions:</span><span className="font-semibold text-white">{data.debtor_transactions.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Total Credit:</span><span className="font-semibold text-red-400">NPR {Math.abs(data.debtor_transactions.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0)).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Total Paid:</span><span className="font-semibold text-green-400">NPR {data.debtor_transactions.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0).toLocaleString()}</span></div>
                <hr className="border-slate-600"/>
                <div className="flex justify-between pt-2"><span className="text-lg font-semibold text-white">Current Due:</span><span className="text-xl font-bold text-red-400">NPR {data.debtor_data.due.toLocaleString()}</span></div>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-400 print:text-gray-600">
            <p>This statement is auto-generated and reflects all transactions up to the statement date.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}