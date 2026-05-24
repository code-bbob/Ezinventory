import React, { useState, useEffect } from "react";
import useAxios from "@/utils/useAxios";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, Check, ChevronsUpDown, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Sidebar from "@/components/allsidebar";

export default function EditDebtorTransactionForm() {
  const api = useAxios();
  const { branchId, debtorTransactionId } = useParams();
  const navigate = useNavigate();

  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
    date: "",
    method: "",
    cashout_date: "",
    debtor: "",
    amount: "",
    desc: "",
    branch: branchId,
  });
  const [debtors, setDebtors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewDebtorDialog, setShowNewDebtorDialog] = useState(false);
  const [newDebtorData, setNewDebtorData] = useState({
    name: "",
    phoneNumber: "",
    due: 0,
    branch: branchId,
  });
  const [openDebtor, setOpenDebtor] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [listResp, txResp] = await Promise.all([
          api.get(`alltransaction/debtors/branch/${branchId}/`),
          api.get(`alltransaction/debtortransaction/${debtorTransactionId}/`),
        ]);
        setDebtors(listResp.data);
        const data = txResp.data;
        setOriginalData(data);
        setFormData({
          date: data.date,
          payment_date: data.payment_date || "",
          sales_transaction: data.sales_transaction?.toString() || "",
          method: data.method,
          debtor: data?.debtor?.toString(),
          amount: data.amount.toString(),
          desc: data.desc || "",
          branch: branchId,
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load transaction details.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [debtorTransactionId, branchId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDebtorSelect = (value) => {
    if (value === "new") {
      setShowNewDebtorDialog(true);
    } else {
      setFormData(prev => ({ ...prev, debtor: value }));
    }
    setOpenDebtor(false);
  };

    const handleAddDebtor = async () => {
    try {
      const res = await api.post("alltransaction/debtors/", newDebtorData);
      setDebtors((d) => [...d, res.data]);
      setFormData((prev) => ({ ...prev, debtor: res.data.id.toString() }));
      setNewDebtorData({ name: "", phone_number: "", due: "", branch: branchId });
      setShowNewDebtorDialog(false);
    } catch (err) {
      console.error(err);
      setError("Failed to add debtor");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`alltransaction/debtortransaction/${debtorTransactionId}/`, formData);
      navigate(`/debtor-transactions/branch/${branchId}`);
    } catch (err) {
      console.error(err);
      setError("Update failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`alltransaction/debtortransaction/${debtorTransactionId}/`);
      navigate(`/debtor-transactions/branch/${branchId}`);
    } catch (err) {
      console.error(err);
      setError("Could not delete transaction.");
    }
  };

  const hasChanged = () => {
    if (!originalData) return false;
    return (
      formData.date !== originalData.date ||
      formData.payment_date !== (originalData.payment_date || "") ||
      formData.method !== originalData.method ||
      formData.debtor !== originalData.debtor.toString() ||
      formData.sales_transaction !== (originalData.sales_transaction?.toString() || "") ||
      formData.amount !== originalData.amount.toString() ||
      formData.desc !== (originalData.desc || "")
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      Loading...
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar className="hidden lg:block w-64 flex-shrink-0" />
      <div className="flex-grow p-4 lg:p-6 lg:ml-64 overflow-auto">
        <Button
          onClick={() => navigate(`/debtor-transactions/branch/${branchId}`)}
          variant="outline"
          className="mb-6 px-4 py-2 text-black border-white hover:bg-gray-700 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Debtor Transactions
        </Button>

        <div className="bg-slate-800 p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-white">Edit Debtor Transaction</h2>
          {error && <p className="text-red-400 mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <Label htmlFor="date" className="text-sm font-medium text-white mb-2">Date</Label>
                <Input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="flex flex-col">
                <Label htmlFor="method" className="text-sm font-medium text-white mb-2">Payment Method</Label>
                <select
                  id="method"
                  name="method"
                  value={formData.method}
                  onChange={handleChange}
                  required
                  className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500 h-9 p-2 rounded-md"
                >
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              { formData.method === 'cheque' && <div className="flex flex-col">
                <Label htmlFor="payment_date" className="text-sm font-medium text-white mb-2">Cashout Date</Label>
                <Input
                  type="date"
                  id="payment_date"
                  name="payment_date"
                  value={formData.cashout_date}
                  onChange={handleChange}
                  required
                  className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                />
              </div>}

            </div>

            <div className="flex flex-col">
              <Label htmlFor="debtor" className="text-sm font-medium text-white mb-2">Debtor</Label>
              <Popover open={openDebtor} onOpenChange={setOpenDebtor}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openDebtor}
                    className="w-full justify-between bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    {formData.debtor
                      ? debtors.find(d => d.id.toString() === formData.debtor)?.name
                      : "Select a debtor..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-slate-800 border-slate-700">
                  <Command className="bg-slate-700 border-slate-600">
                    <CommandInput placeholder="Search debtor..." className="bg-slate-700 text-white" />
                    <CommandList>
                      <CommandEmpty>No debtor found.</CommandEmpty>
                      <CommandGroup>
                        {debtors.map(d => (
                          <CommandItem
                            key={d.id}
                            onSelect={() => handleDebtorSelect(d.id.toString())}
                            className="text-white hover:bg-slate-600"
                          >
                            <Check className={cn("mr-2 h-4 w-4", formData.debtor === d.id.toString() ? "opacity-100" : "opacity-0")} />
                            {d.name}
                          </CommandItem>
                        ))}
                        <CommandItem onSelect={() => handleDebtorSelect("new")} className="text-white hover:bg-slate-600">
                          <PlusCircle className="mr-2 h-4 w-4" /> Add new debtor
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col">
              <Label htmlFor="amount" className="text-sm font-medium text-white mb-2">Amount</Label>
              <Input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter amount"
              />
            </div>

            <div className="flex flex-col">
              <Label htmlFor="desc" className="text-sm font-medium text-white mb-2">Description</Label>
              <Input
                id="desc"
                name="desc"
                value={formData.desc}
                onChange={handleChange}
                placeholder="Enter description"
                className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <Button type="submit" disabled={!hasChanged() || submitting} className="w-full bg-green-600 hover:bg-green-700 text-white">
              Update Debtor Transaction
            </Button>
          </form>

          {/* Delete Confirmation */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full bg-red-600 mt-6 hover:bg-red-700 text-white">Delete Transaction</Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription className="text-slate-300">
                  This action cannot be undone. Are you sure you want to delete this debtor transaction?
                </DialogDescription>
              </DialogHeader>
              <Button className="w-full bg-red-600 hover:bg-red-700 mt-6 text-white" onClick={handleDelete}>
                Delete Transaction
              </Button>
            </DialogContent>
          </Dialog>

          {/* Add New Debtor Dialog */}
          <Dialog open={showNewDebtorDialog} onOpenChange={setShowNewDebtorDialog}>
            <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Add New Debtor</DialogTitle>
                <DialogDescription className="text-slate-300">
                  Enter the name of the new debtor.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newDebtor" className="text-right text-white">Name</Label>
                  <Input
                    id="newDebtor"
                    value={newDebtorData.name}
                    onChange={e => setNewDebtorData(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    placeholder="Debtor name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newDebtor" className="text-right text-white">Phone Number</Label>
                  <Input
                    id="newDebtorPhoneNumber"
                    value={newDebtorData.phoneNumber}
                    onChange={e => setNewDebtorData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    placeholder="Debtor Phone Number"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newDebtorDue" className="text-right text-white">Due Amount</Label>
                  <Input
                    type="number"
                    id="newDebtorDue"
                    value={newDebtorData.due}
                    onChange={e => setNewDebtorData(prev => ({ ...prev, due: e.target.value }))}
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter due amount"
                  />
              </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddDebtor} className="bg-green-600 hover:bg-green-700 text-white">
                  Add Debtor
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </div>
  );
}
