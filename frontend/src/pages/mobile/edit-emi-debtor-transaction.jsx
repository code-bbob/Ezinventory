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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Check, ChevronsUpDown, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Sidebar from "@/components/sidebar";

export default function EditEMIDebtorTransaction() {
  const api = useAxios();
  const { branchId, transactionId } = useParams();
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [showNewBrandDialog, setShowNewBrandDialog] = useState(false);
  const [openBrand, setOpenBrand] = useState(false);
  const [newBrandData, setNewBrandData] = useState({
    name: "",
    branch: branchId,
  });

  const [formData, setFormData] = useState({
    date: "",
    method: "cash",
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
    due: "",
    brand: "",
    branch: branchId,
  });
  const [openDebtor, setOpenDebtor] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch transaction data and debtors on mount
  useEffect(() => {
    const fetchData = async () => {
        console.log("Fetching transaction data for ID:", transactionId);
      try {
        const [transactionRes, debtorsRes, brandsRes] = await Promise.all([
          api.get(`transaction/emidebtortransaction/${transactionId}/`),
          api.get(`transaction/emidebtors/branch/${branchId}/`),
          api.get(`inventory/brand/branch/${branchId}/`)
        ]);
        
        const transaction = transactionRes.data;
        setFormData({
          date: transaction.date,
          method: transaction.method,
          cashout_date: transaction.cashout_date || "",
          debtor: transaction.debtor.toString(),
          amount: transaction.amount,
          desc: transaction.desc || "",
          branch: branchId,
        });
        
        setDebtors(debtorsRes.data);
        setBrands(brandsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load transaction data.");
      } finally {
        setLoading(false);
        setLoadingBrands(false);
      }
    };
    fetchData();
  }, [branchId, transactionId]);

  const handleBrandSelect = (value) => {
    if (value === "new") {
      setShowNewBrandDialog(true);
    } else {
      setNewDebtorData((prev) => ({ ...prev, brand: value }));
    }
    setOpenBrand(false);
  };

  const handleAddBrand = async () => {
    try {
      const res = await api.post("inventory/brand/", newBrandData);
      setBrands(prev => [...prev, res.data]);
      setNewDebtorData(prev => ({ ...prev, brand: res.data.id.toString() }));
      setNewBrandData({ name: "", branch: branchId });
      setShowNewBrandDialog(false);
    } catch {
      setError("Failed to add brand.");
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDebtorSelect = value => {
    if (value === "new") {
      setShowNewDebtorDialog(true);
    } else {
      setFormData(prev => ({ ...prev, debtor: value }));
    }
    setOpenDebtor(false);
  };

  const handleAddDebtor = async () => {
    try {
      const res = await api.post("transaction/emidebtors/", newDebtorData);
      setDebtors(prev => [...prev, res.data]);
      setFormData(prev => ({ ...prev, debtor: res.data.id.toString() }));
      setNewDebtorData({ name: "", phoneNumber: "", due: "", brand: "", branch: branchId });
      setShowNewDebtorDialog(false);
    } catch {
      setError("Failed to add debtor.");
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`transaction/emidebtortransaction/${transactionId}/`, formData);
      navigate(`/mobile/emi-transactions/branch/${branchId}`);
    } catch {
      setError("Could not update transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar className="hidden lg:block w-64 flex-shrink-0" />
      <div className="flex-grow p-4 lg:p-6 lg:ml-64 overflow-auto">
        <Button
          onClick={() => navigate(`/mobile/emi-transactions/branch/${branchId}`)}
          variant="outline"
          className="mb-6 px-4 py-2 text-black border-white hover:bg-gray-700 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to EMI Debtor Transactions
        </Button>

        <div className="bg-slate-800 p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-white">
            Edit EMI Debtor Transaction
          </h2>
          {error && <p className="text-red-400 mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date & Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <Label htmlFor="date" className="text-sm font-medium text-white mb-2">
                  Date
                </Label>
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
                <Label htmlFor="method" className="text-sm font-medium text-white mb-2">
                  Payment Method
                </Label>
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

              {formData.method === "cheque" && (
                <div className="flex flex-col">
                  <Label
                    htmlFor="cashout_date"
                    className="text-sm font-medium text-white mb-2"
                  >
                    Cashout Date
                  </Label>
                  <Input
                    type="date"
                    id="cashout_date"
                    name="cashout_date"
                    value={formData.cashout_date}
                    onChange={handleChange}
                    className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Debtor Select */}
            <div className="flex flex-col">
              <Label htmlFor="debtor" className="text-sm font-medium text-white mb-2">
                EMI Debtor
              </Label>
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
                    <CommandInput
                      placeholder="Search debtor..."
                      className="bg-slate-700 text-white"
                    />
                    <CommandList>
                      <CommandEmpty>No debtor found.</CommandEmpty>
                      <CommandGroup>
                        {debtors.map(d => (
                          <CommandItem
                            key={d.id}
                            onSelect={() => handleDebtorSelect(d.id.toString())}
                            className="text-white hover:bg-slate-600"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.debtor === d.id.toString()
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {d.name}
                          </CommandItem>
                        ))}
                        <CommandItem
                          onSelect={() => handleDebtorSelect("new")}
                          className="text-white hover:bg-slate-600"
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> Add new debtor
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Amount & Description */}
            <div className="flex flex-col">
              <Label htmlFor="amount" className="text-sm font-medium text-white mb-2">
                Amount Received
              </Label>
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
              <Label htmlFor="desc" className="text-sm font-medium text-white mb-2">
                Description
              </Label>
              <Input
                id="desc"
                name="desc"
                value={formData.desc}
                onChange={handleChange}
                placeholder="Enter description"
                className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Update EMI Debtor Transaction
            </Button>
          </form>

          {/* Add New Debtor Dialog */}
          <Dialog
            open={showNewDebtorDialog}
            onOpenChange={setShowNewDebtorDialog}
          >
            <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Add New EMI Debtor</DialogTitle>
                <DialogDescription className="text-slate-300">
                  Enter details for the EMI new debtor.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newName" className="text-right text-white">
                    Name
                  </Label>
                  <Input
                    id="newName"
                    value={newDebtorData.name}
                    onChange={e =>
                      setNewDebtorData(prev => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    placeholder="Debtor name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newPhone" className="text-right text-white">
                    Phone
                  </Label>
                  <Input
                    id="newPhone"
                    value={newDebtorData.phoneNumber}
                    onChange={e =>
                      setNewDebtorData(prev => ({
                        ...prev,
                        phoneNumber: e.target.value,
                      }))
                    }
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    placeholder="Phone number"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newDebtorBrand" className="text-right">
                    Brand
                  </Label>
                  <Popover open={openBrand} onOpenChange={setOpenBrand}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openBrand}
                        className="col-span-3 justify-between bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        {newDebtorData.brand
                          ? brands.find(b => b.id.toString() === newDebtorData.brand)?.name
                          : loadingBrands ? "Loading brands..." : "Select a brand..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-slate-800 border-slate-700">
                      <Command className="bg-slate-700 border-slate-600">
                        <CommandInput
                          placeholder="Search brand..."
                          className="bg-slate-700 text-white"
                        />
                        <CommandList>
                          <CommandEmpty>No brand found.</CommandEmpty>
                          <CommandGroup>
                            {brands.map(brand => (
                              <CommandItem
                                key={brand.id}
                                onSelect={() => handleBrandSelect(brand.id.toString())}
                                className="text-white hover:bg-slate-600"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    newDebtorData.brand === brand.id.toString()
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {brand.name}
                              </CommandItem>
                            ))}
                            <CommandItem
                              onSelect={() => handleBrandSelect("new")}
                              className="text-white hover:bg-slate-600"
                            >
                              <PlusCircle className="mr-2 h-4 w-4" /> Add new brand
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newDue" className="text-right text-white">
                    Due Amount
                  </Label>
                  <Input
                    type="number"
                    id="newDue"
                    value={newDebtorData.due}
                    onChange={e =>
                      setNewDebtorData(prev => ({
                        ...prev,
                        due: e.target.value,
                      }))
                    }
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter due amount"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAddDebtor}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Add EMI Debtor
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add New Brand Dialog */}
          <Dialog
            open={showNewBrandDialog}
            onOpenChange={setShowNewBrandDialog}
          >
            <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Add New Brand</DialogTitle>
                <DialogDescription className="text-slate-300">
                  Enter details for the new brand.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newBrandName" className="text-right text-white">
                    Name
                  </Label>
                  <Input
                    id="newBrandName"
                    value={newBrandData.name}
                    onChange={(e) =>
                      setNewBrandData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    placeholder="Brand name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAddBrand}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Add Brand
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
