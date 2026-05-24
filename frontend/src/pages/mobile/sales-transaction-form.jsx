"use client";

import React, { useState, useEffect } from "react";
import useAxios from "@/utils/useAxios";
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
import {
  PlusCircle,
  Trash2,
  Check,
  ChevronsUpDown,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import Sidebar from "@/components/sidebar";

function SalesTransactionForm() {
  const { branchId } = useParams();
  const api = useAxios();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    name: "",
    phone_number: "",
    bill_no: "",
    sales: [{ phone: "", imei_number: "", unit_price: "" }],
    branch: branchId,
    method: "cash",
    debtor: "",
    emi_debtor: "",
    amount_paid: null,
    credited_amount: "",
  });
  const [newDebtorData, setNewDebtorData] = useState({
    name: "",
    phone_number: "",
    due: "",
    branch: branchId,
  });
  const [newEMIDebtorData, setNewEMIDebtorData] = useState({
    name: "",
    phone_number: "",
    due: "",
    brand: "",
    branch: branchId,
  });

  const [phones, setPhones] = useState([]);
  const [brands, setBrands] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emiDebtors, setEmiDebtors] = useState([]);

  // Dialog & popover states
  const [showNewPhoneDialog, setShowNewPhoneDialog] = useState(false);
  const [showNewBrandDialog, setShowNewBrandDialog] = useState(false);
  const [newPhoneData, setNewPhoneData] = useState({ name: "", brand: "" });
  const [newBrandName, setNewBrandName] = useState("");
  const [openPhone, setOpenPhone] = useState(
    Array(formData.sales.length).fill(false)
  );
  const [openIMEI, setOpenIMEI] = useState(
    Array(formData.sales.length).fill(false)
  );
  const [openBrand, setOpenBrand] = useState(false);
  const [openDebtor, setOpenDebtor] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [showNewEMIDebtorDialog, setShowNewEMIDebtorDialog] = useState(false);

  // Discount & totals
  const [subtotal, setSubtotal] = useState(0);
  const [showNewDebtorDialog, setShowNewDebtorDialog] = useState(false);
  const [discountType, setDiscountType] = useState("amount"); // 'amount' or 'percent'
  const [discountValue, setDiscountValue] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);

  // Fetch phones, brands, debtors
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [phonesRes, brandsRes, debtorsRes, emiDebtorsRes] =
          await Promise.all([
            api.get(`inventory/phone/branch/${branchId}/`),
            api.get(`inventory/brand/branch/${branchId}/`),
            api.get(`alltransaction/debtors/branch/${branchId}/`),
            api.get(`transaction/emidebtors/branch/${branchId}/`),
          ]);
        setPhones(phonesRes.data);
        setBrands(brandsRes.data);
        setDebtors(debtorsRes.data);
        setEmiDebtors(emiDebtorsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [branchId]);

  // Compute subtotal on sales change
  useEffect(() => {
    const newSubtotal = formData.sales.reduce((sum, sale) => {
      return sum + (parseFloat(sale.unit_price) || 0);
    }, 0);
    setSubtotal(newSubtotal);
  }, [formData.sales]);

  // Compute totalAmount on subtotal or discount change
  useEffect(() => {
    const disc =
      discountType === "percent"
        ? subtotal * ((parseFloat(discountValue) || 0) / 100)
        : parseFloat(discountValue) || 0;
    setTotalAmount(subtotal - disc);
  }, [subtotal, discountType, discountValue]);

  // Update credited_amount when amount_paid or totalAmount change
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      credited_amount: (
        totalAmount - (parseFloat(prev.amount_paid) || 0)
      ).toString(),
    }));
  }, [formData.amount_paid, totalAmount]);


  const handleAddEMIDebtor = async () => {
    try{
      const res = await api.post(
        `transaction/emidebtors/`,
        newEMIDebtorData
      );
      setEmiDebtors([...emiDebtors, res.data]);
      setNewEMIDebtorData({ name: "", phone_number: "", due: "", brand: "", branch: branchId });
      setShowNewEMIDebtorDialog(false);
      setFormData((prev) => ({
        ...prev,
        emi_debtor: res.data.id.toString(),
      }));
    }
    catch (err) {
      console.error("Error adding EMI debtor:", err);
      setError("Failed to add EMI debtor");
    }
  };



  // Handlers
  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const newSales = [...formData.sales];
    newSales[index] = { ...newSales[index], [name]: value };
    setFormData({ ...formData, sales: newSales });
  };

  const handlePhoneChange = (index, value) => {

    const matchingPhone = phones.find(
        (phone) => phone.id.toString() === value
      );

    if (value === "new") {
      setShowNewPhoneDialog(true);
    } else {
      const newSales = [...formData.sales];
      newSales[index] = { ...newSales[index], phone: value, imei_number: "", unit_price: matchingPhone ? matchingPhone.selling_price : "" };
      setFormData({ ...formData, sales: newSales });
    }
    setOpenPhone((prev) => prev.map((o, i) => (i === index ? false : o)));
  };

  const handleIMEIChange = (index, value) => {
    const newSales = [...formData.sales];
    newSales[index] = { ...newSales[index], imei_number: value };
    setFormData({ ...formData, sales: newSales });
    setOpenIMEI((prev) => prev.map((o, i) => (i === index ? false : o)));
  };

  const handleAddSale = () => {
    setFormData({
      ...formData,
      sales: [
        ...formData.sales,
        { phone: "", imei_number: "", unit_price: "" },
      ],
    });
    setOpenPhone([...openPhone, false]);
    setOpenIMEI([...openIMEI, false]);
  };

  const handleRemoveSale = (index) => {
    setFormData({
      ...formData,
      sales: formData.sales.filter((_, i) => i !== index),
    });
    setOpenPhone(openPhone.filter((_, i) => i !== index));
    setOpenIMEI(openIMEI.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubLoading(true);
      const discountAmt =
        discountType === "percent"
          ? subtotal * ((parseFloat(discountValue) || 0) / 100)
          : parseFloat(discountValue) || 0;

      const payload = {
        ...formData,
        subtotal,
        discount: discountAmt,
        total_amount: totalAmount,
      };

      const res = await api.post("transaction/salestransaction/", payload);
      console.log("Response:", res.data);
      navigate("/mobile/sales/branch/" + branchId);
    } catch (err) {
      console.error("Error posting data:", err);
      setError("Submission failed");
    } finally {
      setSubLoading(false);
    }
  };

  const handleNewPhoneChange = (e) => {
    const { name, value } = e.target;
    setNewPhoneData({ ...newPhoneData, [name]: value });
  };
  const handleNewPhoneBrandChange = (value) => {
    if (value === "new") {
      setShowNewBrandDialog(true);
    } else {
      setNewPhoneData({ ...newPhoneData, brand: value });
    }
    setOpenBrand(false);
  };
  const handleNewBrandChange = (e) => setNewBrandName(e.target.value);

  const handleAddPhone = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(
        `inventory/phone/branch/${branchId}/`,
        newPhoneData
      );
      setPhones([...phones, res.data]);
      setNewPhoneData({ name: "", brand: "", branch: branchId });
      setShowNewPhoneDialog(false);
    } catch (err) {
      console.error("Error adding phone:", err);
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`inventory/brand/branch/${branchId}/`, {
        name: newBrandName,
        branch: branchId
      });
      setBrands([...brands, res.data]);
      setNewBrandName("");
      setShowNewBrandDialog(false);
      setNewPhoneData((prev) => ({ ...prev, brand: res.data.id.toString() }));
    } catch (err) {
      console.error("Error adding brand:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar className="hidden lg:block w-64 flex-shrink-0" />
      <div className="flex-grow p-4 lg:p-6 lg:ml-64 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => navigate("/mobile/")}
            variant="outline"
            className="mb-6 px-4 py-2 text-black border-white hover:bg-gray-700 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-white">
              Add Sales Transaction
            </h2>
            {error && <p className="text-red-600 mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer & Bill Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <Label
                    htmlFor="date"
                    className="text-sm font-medium text-white mb-2"
                  >
                    Date
                  </Label>
                  <Input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-white mb-2"
                  >
                    Customer's name
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Customer's Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <Label
                    htmlFor="phone_number"
                    className="text-sm font-medium text-white mb-2"
                  >
                    Customer's Phone Number
                  </Label>
                  <Input
                    type="text"
                    id="phone_number"
                    name="phone_number"
                    placeholder="Customer's Phone Number"
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_number: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <Label
                    htmlFor="bill_no"
                    className="text-sm font-medium text-white mb-2"
                  >
                    Bill No.
                  </Label>
                  <Input
                    type="text"
                    id="bill_no"
                    name="bill_no"
                    placeholder="Enter bill number"
                    value={formData.bill_no}
                    onChange={(e) =>
                      setFormData({ ...formData, bill_no: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
              </div>

              {/* Sales Entries */}
              {formData.sales.map((sale, idx) => (
                <div
                  key={idx}
                  className="bg-slate-700 text-white p-4 rounded-md shadow mb-4"
                >
                  <h3 className="text-lg font-semibold mb-4">Sale {idx + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Phone Select */}
                    <div className="flex flex-col">
                      <Label
                        htmlFor={`phone-${idx}`}
                        className="text-sm font-medium text-white mb-2"
                      >
                        Phone
                      </Label>
                      <Popover
                        open={openPhone[idx]}
                        onOpenChange={(open) => {
                          setOpenPhone((prev) =>
                            prev.map((o, i) => (i === idx ? open : o))
                          );
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openPhone[idx]}
                            className="w-full justify-between bg-slate-600 border-slate-500 text-white"
                          >
                            {sale.phone
                              ? phones.find(
                                  (p) => p.id.toString() === sale.phone
                                )?.name
                              : "Select a phone..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                          <Command className="bg-slate-700">
                            <CommandInput
                              placeholder="Search phone..."
                              className="bg-slate-700 text-white"
                            />
                            <CommandList>
                              <CommandEmpty>No phone found.</CommandEmpty>
                              <CommandGroup>
                                {phones.map((p) => (
                                  <CommandItem
                                    key={p.id}
                                    onSelect={() =>
                                      handlePhoneChange(idx, p.id.toString())
                                    }
                                    className="text-white hover:bg-slate-600"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        sale.phone === p.id.toString()
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {p.name}
                                  </CommandItem>
                                ))}
                                <CommandItem
                                  onSelect={() => handlePhoneChange(idx, "new")}
                                  className="text-white hover:bg-slate-600"
                                >
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  Add a new phone
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {/* IMEI Select */}
                    <div className="flex flex-col">
                      <Label
                        htmlFor={`imei-${idx}`}
                        className="text-sm font-medium text-white mb-2"
                      >
                        IMEI Number
                      </Label>
                      <Popover
                        open={openIMEI[idx]}
                        onOpenChange={(open) => {
                          setOpenIMEI((prev) =>
                            prev.map((o, i) => (i === idx ? open : o))
                          );
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openIMEI[idx]}
                            className="w-full justify-between bg-slate-600 border-slate-500 text-white"
                          >
                            {sale.imei_number || "Select IMEI..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                          <Command className="bg-slate-700 h-60 overflow-y-auto">
                            <CommandInput
                              placeholder="Search IMEI..."
                              className="bg-slate-700 text-white"
                            />
                            <CommandList>
                              <CommandEmpty>No IMEI found.</CommandEmpty>
                              <CommandGroup>
                                {sale.phone &&
                                  phones
                                    .find((p) => p.id.toString() === sale.phone)
                                    ?.imeis.map((imei) => (
                                      <CommandItem
                                        key={imei}
                                        onSelect={() =>
                                          handleIMEIChange(idx, imei)
                                        }
                                        className="text-white hover:bg-slate-600"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            sale.imei_number === imei
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {imei}
                                      </CommandItem>
                                    ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {/* Unit Price */}
                    <div className="flex flex-col">
                      <Label
                        htmlFor={`price-${idx}`}
                        className="text-sm font-medium text-white mb-2"
                      >
                        Unit Price
                      </Label>
                      <Input
                        type="number"
                        id={`price-${idx}`}
                        name="unit_price"
                        placeholder="Enter unit price"
                        value={sale.unit_price}
                        onChange={(e) => handleChange(idx, e)}
                        className="bg-slate-600 border-slate-500 text-white"
                        required
                      />
                    </div>
                  </div>
                  {idx > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="mt-4"
                      onClick={() => handleRemoveSale(idx)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Sale
                    </Button>
                  )}
                </div>
              ))}

              {/* Totals, Discount, Payment */}
              <div className="bg-slate-700 text-white p-4 rounded-md shadow mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <Label
                      htmlFor="subtotal"
                      className="text-sm font-medium text-white mb-2"
                    >
                      Subtotal
                    </Label>
                    <Input
                      type="number"
                      id="subtotal"
                      value={subtotal.toFixed(2)}
                      readOnly
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label
                      htmlFor="discount"
                      className="text-sm font-medium text-white mb-2"
                    >
                      Discount
                    </Label>
                    <div className="flex space-x-2">
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="bg-slate-600 border-slate-500 text-white p-2 rounded"
                      >
                        <option value="amount">Amount</option>
                        <option value="percent">Percent</option>
                      </select>
                      <Input
                        type="number"
                        id="discountValue"
                        placeholder="Enter discount"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <Label
                      htmlFor="totalAmount"
                      className="text-sm font-medium text-white mb-2"
                    >
                      Total Amount
                    </Label>
                    <Input
                      type="number"
                      id="totalAmount"
                      value={totalAmount.toFixed(2)}
                      readOnly
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label
                      htmlFor="method"
                      className="text-sm font-medium text-white mb-2"
                    >
                      Payment Method
                    </Label>
                    <Select
                      value={formData.method}
                      onValueChange={(value) =>
                        setFormData({ ...formData, method: value })
                      }
                      className="bg-slate-600 border-slate-500 text-white p-2 rounded"
                    >
                      <SelectTrigger className="w-full bg-slate-600 border-slate-500 text-white">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                        <SelectItem value="emi">EMI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Credit Fields */}
              {formData.method === "credit" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <Label
                      htmlFor="debtor"
                      className="text-sm font-medium text-white mb-2"
                    >
                      Debtor
                    </Label>
                    <Popover open={openDebtor} onOpenChange={setOpenDebtor}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openDebtor}
                          className="w-full justify-between bg-slate-600 border-slate-500 text-white"
                        >
                          {formData.debtor
                            ? debtors.find(
                                (d) => d.id.toString() === formData.debtor
                              )?.name
                            : "Select a debtor..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                        <Command className="bg-slate-700">
                          <CommandInput
                            placeholder="Search debtor..."
                            className="bg-slate-700 text-white"
                          />
                          <CommandList>
                            <CommandEmpty>No debtor found.</CommandEmpty>
                            <CommandGroup>
                              {debtors.map((d) => (
                                <CommandItem
                                  key={d.id}
                                  onSelect={() => {
                                    setFormData({
                                      ...formData,
                                      debtor: d.id.toString(),
                                    });
                                    setOpenDebtor(false);
                                  }}
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
                                onSelect={() => {
                                  setShowNewDebtorDialog(true);
                                  setOpenDebtor(false);
                                }}
                                className="text-white hover:bg-slate-600"
                              >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add a new debtor
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-col">
                    <Label
                      htmlFor="amount_paid"
                      className="text-sm font-medium text-white mb-2"
                    >
                      Amount Paid
                    </Label>
                    <Input
                      type="number"
                      id="amount_paid"
                      name="amount_paid"
                      value={formData.amount_paid}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount_paid: e.target.value,
                        })
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label
                      htmlFor="credited_amount"
                      className="text-sm font-medium text-white mb-2"
                    >
                      Credited Amount
                    </Label>
                    <Input
                      type="number"
                      id="credited_amount"
                      name="credited_amount"
                      value={formData.credited_amount}
                      readOnly
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              )}
              {formData.method === "emi" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <Label
                      htmlFor="debtor"
                      className="text-sm font-medium text-white mb-2"
                    >
                      EMI Debtor
                    </Label>
                    <Popover open={openDebtor} onOpenChange={setOpenDebtor}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openDebtor}
                          className="w-full justify-between bg-slate-600 border-slate-500 text-white"
                        >
                          {formData.emi_debtor
                            ? emiDebtors.find(
                                (d) => d.id.toString() === formData.emi_debtor
                              )?.name
                            : "Select an EMI debtor..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                        <Command className="bg-slate-700">
                          <CommandInput
                            placeholder="Search debtor..."
                            className="bg-slate-700 text-white"
                          />
                          <CommandList>
                            <CommandEmpty>No debtor found.</CommandEmpty>
                            <CommandGroup>
                              {emiDebtors.map((d) => (
                                <CommandItem
                                  key={d.id}
                                  onSelect={() => {
                                    setFormData({
                                      ...formData,
                                      emi_debtor: d.id.toString(),
                                    });
                                    setOpenDebtor(false);
                                  }}
                                  className="text-white hover:bg-slate-600"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.emi_debtor === d.id.toString()
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {d.name}
                                </CommandItem>
                              ))}
                              <CommandItem
                                onSelect={() => {
                                  setShowNewEMIDebtorDialog(true);
                                  setOpenDebtor(false);
                                }}
                                className="text-white hover:bg-slate-600"
                              >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add a new EMI debtor
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-col">
                    <Label
                      htmlFor="amount_paid"
                      className="text-sm font-medium text-white mb-2"
                    >
                      Amount Paid
                    </Label>
                    <Input
                      type="number"
                      id="amount_paid"
                      name="amount_paid"
                      value={formData.amount_paid}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount_paid: e.target.value,
                        })
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label
                      htmlFor="credited_amount"
                      className="text-sm font-medium text-white mb-2"
                    >
                      EMI Amount
                    </Label>
                    <Input
                      type="number"
                      id="credited_amount"
                      name="credited_amount"
                      value={formData.credited_amount}
                      readOnly
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              )}

              <Button
                type="button"
                onClick={handleAddSale}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Another Sale
              </Button>

              <Button
                type="submit"
                disabled={subLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Submit Transaction
              </Button>
            </form>

            {/* Add New Phone Dialog */}
            <Dialog
              open={showNewPhoneDialog}
              onOpenChange={setShowNewPhoneDialog}
            >
              <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
                <DialogHeader>
                  <DialogTitle>Add New Phone</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new phone you want to add.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newPhoneName" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="newPhoneName"
                      name="name"
                      value={newPhoneData.name}
                      onChange={handleNewPhoneChange}
                      className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newPhoneBrand" className="text-right">
                      Brand
                    </Label>
                    <div className="col-span-3">
                      <Popover open={openBrand} onOpenChange={setOpenBrand}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openBrand}
                            className="w-full justify-between bg-slate-700 border-slate-600 text-white"
                          >
                            {newPhoneData.brand
                              ? brands.find(
                                  (b) => b.id.toString() === newPhoneData.brand
                                )?.name
                              : "Select a brand..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                          <Command className="bg-slate-700">
                            <CommandInput
                              placeholder="Search brand..."
                              className="bg-slate-700 text-white"
                            />
                            <CommandList>
                              <CommandEmpty>No brand found.</CommandEmpty>
                              <CommandGroup>
                                {brands.map((b) => (
                                  <CommandItem
                                    key={b.id}
                                    onSelect={() =>
                                      handleNewPhoneBrandChange(b.id.toString())
                                    }
                                    className="text-white hover:bg-slate-600"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        newPhoneData.brand === b.id.toString()
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {b.name}
                                  </CommandItem>
                                ))}
                                <CommandItem
                                  onSelect={() =>
                                    handleNewPhoneBrandChange("new")
                                  }
                                  className="text-white hover:bg-slate-600"
                                >
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  Add a new brand
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={handleAddPhone}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Add Phone
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={showNewDebtorDialog}
              onOpenChange={setShowNewDebtorDialog}
            >
              <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
                <DialogHeader>
                  <DialogTitle>Add New Debtor</DialogTitle>
                  <DialogDescription>
                    Fill in the debtor's details below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="debtor_name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="debtor_name"
                      value={newDebtorData.name}
                      onChange={(e) =>
                        setNewDebtorData({
                          ...newDebtorData,
                          name: e.target.value,
                        })
                      }
                      className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="debtor_phone" className="text-right">
                      Phone
                    </Label>
                    <Input
                      id="debtor_phone"
                      value={newDebtorData.phone_number}
                      onChange={(e) =>
                        setNewDebtorData({
                          ...newDebtorData,
                          phone_number: e.target.value,
                        })
                      }
                      className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="debtor_due" className="text-right">
                      Due
                    </Label>
                    <Input
                      id="debtor_due"
                      type="number"
                      value={newDebtorData.due}
                      onChange={(e) =>
                        setNewDebtorData({
                          ...newDebtorData,
                          due: e.target.value,
                        })
                      }
                      className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={async () => {
                      try {
                        // Post to imaginary endpoint
                        const resp = await api.post("alltransaction/debtors/", newDebtorData);
                        const newDebtor = {
                          ...newDebtorData,
                          id: resp.data.id, // Use the ID from the response
                        };
                        setDebtors((prev) => [...prev, newDebtor]);
                        setFormData((prev) => ({
                          ...prev,
                          debtor: newDebtor.id,
                        }));
                        setNewDebtorData({
                          name: "",
                          phone_number: "",
                          due: "",
                          branch: branchId
                        });
                        setShowNewDebtorDialog(false);
                      } catch (error) {
                        console.error("Error adding debtor:", error);
                      }
                    }}
                  >
                    Add Debtor
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

              <Dialog
              open={showNewEMIDebtorDialog}
              onOpenChange={setShowNewEMIDebtorDialog}
            >
              <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
                <DialogHeader>
                  <DialogTitle>Add New EMI Debtor</DialogTitle>
                  <DialogDescription>
                    Fill in the debtor's details below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="debtor_name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="debtor_name"
                      value={newEMIDebtorData.name}
                      onChange={(e) =>
                        setNewEMIDebtorData({
                          ...newEMIDebtorData,
                          name: e.target.value,
                        })
                      }
                      className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="debtor_phone" className="text-right">
                      Phone
                    </Label>
                    <Input
                      id="debtor_phone"
                      value={newEMIDebtorData.phone_number}
                      onChange={(e) =>
                        setNewEMIDebtorData({
                          ...newEMIDebtorData,
                          phone_number: e.target.value,
                        })
                      }
                      className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="debtor_due" className="text-right">
                      Due
                    </Label>
                    <Input
                      id="debtor_due"
                      type="number"
                      value={newEMIDebtorData.due}
                      onChange={(e) =>
                        setNewEMIDebtorData({
                          ...newEMIDebtorData,
                          due: e.target.value,
                        })
                      }
                      className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="debtor_brand" className="text-right">
                      Brand
                    </Label>
                    <div className="col-span-3">
                      <Popover open={openBrand} onOpenChange={setOpenBrand}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openBrand}
                            className="w-full justify-between bg-slate-700 border-slate-600 text-white"
                          >
                            {newEMIDebtorData.brand
                              ? brands.find((b) => b.id.toString() === newEMIDebtorData.brand)?.name
                              : "Select a brand..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                          <Command className="bg-slate-700">
                            <CommandInput
                              placeholder="Search brand..."
                              className="bg-slate-700 text-white"
                            />
                            <CommandList>
                              <CommandEmpty>No brand found.</CommandEmpty>
                              <CommandGroup>
                                {brands.map((b) => (
                                  <CommandItem
                                    key={b.id}
                                    onSelect={() => {
                                      setNewEMIDebtorData({
                                        ...newEMIDebtorData,
                                        brand: b.id.toString(),
                                      });
                                      setOpenBrand(false);
                                    }}
                                    className="text-white hover:bg-slate-600"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        newEMIDebtorData.brand === b.id.toString()
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {b.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleAddEMIDebtor}
                  >
                    Add Debtor
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
                  <DialogDescription>
                    Enter the name of the new brand you want to add.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newBrandName" className="text-right">
                      Brand Name
                    </Label>
                    <Input
                      id="newBrandName"
                      value={newBrandName}
                      onChange={handleNewBrandChange}
                      className="col-span-3 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={handleAddBrand}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Add Brand
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesTransactionForm;
