'use client'

import React, { useState, useEffect } from 'react';
import useAxios from '@/utils/useAxios';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, Check, ChevronsUpDown, ArrowLeft } from 'lucide-react';
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
import Sidebar from '@/components/sidebar';

export default function EditSalesTransactionForm() {
  const api = useAxios();
  const navigate = useNavigate();
  const { branchId, salesId } = useParams();

  // Main form data + computation states
  const [originalSalesData, setOriginalSalesData] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    name: '',
    phone_number: '',
    bill_no: '',
    sales: [],
    method: 'cash',
    debtor: '',
    emi_debtor: '',
    amount_paid: null,
    credited_amount: '',
  });
  const [phones, setPhones] = useState([]);
  const [brands, setBrands] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [emiDebtors, setEmiDebtors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog + popover states
  const [showNewPhoneDialog, setShowNewPhoneDialog] = useState(false);
  const [showNewBrandDialog, setShowNewBrandDialog] = useState(false);
  const [showNewDebtorDialog, setShowNewDebtorDialog] = useState(false);
  const [showNewEMIDebtorDialog, setShowNewEMIDebtorDialog] = useState(false);
  const [newPhoneData, setNewPhoneData] = useState({ name: '', brand: '' });
  const [newBrandName, setNewBrandName] = useState('');
  const [newDebtorData, setNewDebtorData] = useState({ name: '', phone_number: '', due: '', branch: branchId });
  const [newEMIDebtorData, setNewEMIDebtorData] = useState({ name: '', phone_number: '', due: '', brand: '', branch: branchId });
  const [openPhone, setOpenPhone] = useState([]);
  const [openIMEI, setOpenIMEI] = useState([]);
  const [openBrand, setOpenBrand] = useState(false);
  const [openDebtor, setOpenDebtor] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [returns, setReturns] = useState([]);

  // Discount & totals
  const [subtotal, setSubtotal] = useState(0);
  const [discountType, setDiscountType] = useState('amount'); // 'amount' or 'percent'
  const [discountValue, setDiscountValue] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);

  // Fetch all needed data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [phonesRes, brandsRes, debtorsRes, emiDebtorsRes, salesRes] = await Promise.all([
          api.get(`inventory/phone/branch/${branchId}/`),
          api.get(`inventory/brand/branch/${branchId}/`),
          api.get(`alltransaction/debtors/branch/${branchId}/`),
          api.get(`transaction/emidebtors/branch/${branchId}/`),
          api.get(`transaction/salestransaction/${salesId}/`)
        ]);

        setPhones(phonesRes.data);
        setBrands(brandsRes.data);
        setDebtors(debtorsRes.data);
        setEmiDebtors(emiDebtorsRes.data);

        const data = salesRes.data;
        setOriginalSalesData(data);

        // Initialize formData from fetched data
        setFormData({
          date: data.date,
          name: data.name,
          phone_number: data.phone_number,
          bill_no: data.bill_no,
          sales: data.sales.map(s => ({
            ...s,
            phone: s.phone.toString(),
            imei_number: s.imei_number,
            unit_price: s.unit_price.toString(),
          })),
          method: data.method || 'cash',
          debtor: data.debtor ? data.debtor.toString() : '',
          emi_debtor: data.emi_debtor ? data.emi_debtor.toString() : '',
          amount_paid: data.amount_paid != null ? data.amount_paid.toString() : null,
          credited_amount: data.credited_amount != null ? data.credited_amount.toString() : '',
        });

        // Compute initial subtotal, discount, total
        const initSubtotal = data.subtotal != null
          ? data.subtotal
          : data.sales.reduce((sum, s) => sum + (parseFloat(s.unit_price) || 0), 0);
        setSubtotal(initSubtotal);

        // Assume API returns discount as absolute amount
        setDiscountValue(data.discount != null ? data.discount.toString() : '');
        setDiscountType('amount');
        setTotalAmount(
          data.total_amount != null
            ? data.total_amount
            : initSubtotal - (parseFloat(data.discount) || 0)
        );

        setOpenPhone(new Array(data.sales.length).fill(false));
        setOpenIMEI(new Array(data.sales.length).fill(false));
      } catch (err) {
        console.error(err);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [branchId, salesId]);

  // Recompute subtotal whenever items change
  useEffect(() => {
    const newSub = formData.sales.reduce(
      (sum, s) => sum + (parseFloat(s.unit_price) || 0),
      0
    );
    setSubtotal(newSub);
  }, [formData.sales]);

  // Recompute totalAmount on subtotal or discount change
  useEffect(() => {
    const disc =
      discountType === 'percent'
        ? subtotal * ((parseFloat(discountValue) || 0) / 100)
        : parseFloat(discountValue) || 0;
    setTotalAmount(subtotal - disc);
  }, [subtotal, discountType, discountValue]);

  // Recompute credited_amount on amount_paid or total change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      credited_amount: (totalAmount - (parseFloat(prev.amount_paid) || 0)).toString(),
    }));
  }, [formData.amount_paid, totalAmount]);

  // Handlers for the sales rows
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSaleChange = (idx, e) => {
    const { name, value } = e.target;
    const copy = [...formData.sales];
    copy[idx] = { ...copy[idx], [name]: value };
    setFormData(prev => ({ ...prev, sales: copy }));
  };
  const handlePhoneChange = (idx, value) => {
    if (value === 'new') {
      setShowNewPhoneDialog(true);
    } else {
      const copy = [...formData.sales];
      copy[idx] = { ...copy[idx], phone: value, imei_number: '' };
      setFormData(prev => ({ ...prev, sales: copy }));
    }
    setOpenPhone(p =>
      p.map((o, i) => (i === idx ? false : o))
    );
  };
  const handleIMEIChange = (idx, value) => {
    const copy = [...formData.sales];
    copy[idx] = { ...copy[idx], imei_number: value };
    setFormData(prev => ({ ...prev, sales: copy }));
    setOpenIMEI(p =>
      p.map((o, i) => (i === idx ? false : o))
    );
  };
  const handleAddSale = () => {
    setFormData(prev => ({
      ...prev,
      sales: [...prev.sales, { phone: '', imei_number: '', unit_price: '' }],
    }));
    setOpenPhone(p => [...p, false]);
    setOpenIMEI(i => [...i, false]);
  };
  const handleRemoveSale = idx => {
    setFormData(prev => ({
      ...prev,
      sales: prev.sales.filter((_, i) => i !== idx),
    }));
    setOpenPhone(p => p.filter((_, i) => i !== idx));
    setOpenIMEI(i => i.filter((_, i2) => i2 !== idx));
  };

  // Add new phone/brand
  const handleNewPhoneChange = e => {
    const { name, value } = e.target;
    setNewPhoneData(prev => ({ ...prev, [name]: value }));
  };
  const handleNewPhoneBrandChange = value => {
    if (value === 'new') setShowNewBrandDialog(true);
    else setNewPhoneData(prev => ({ ...prev, brand: value }));
    setOpenBrand(false);
  };
  const handleAddPhone = async e => {
    e.preventDefault();
    try {
      const res = await api.post(`inventory/phone/branch/${branchId}/`, newPhoneData);
      setPhones(prev => [...prev, res.data]);
      setNewPhoneData({ name: '', brand: '' });
      setShowNewPhoneDialog(false);
    } catch {
      setError('Failed to add phone');
    }
  };
  const handleNewBrandChange = e => setNewBrandName(e.target.value);
  const handleAddBrand = async e => {
    e.preventDefault();
    try {
      const res = await api.post(`inventory/brand/branch/${branchId}/`, { name: newBrandName });
      setBrands(prev => [...prev, res.data]);
      setNewBrandName('');
      setShowNewBrandDialog(false);
      setNewPhoneData(prev => ({ ...prev, brand: res.data.id.toString() }));
    } catch {
      setError('Failed to add brand');
    }
  };

  // Add new debtor
  const handleAddDebtor = async () => {
    try {
      const res = await api.post(`alltransaction/debtors/`, newDebtorData);
      setDebtors(prev => [...prev, res.data]);
      setFormData(prev => ({ ...prev, debtor: res.data.id.toString() }));
      setNewDebtorData({ name: '', phone_number: '', due: '', branch: branchId });
      setShowNewDebtorDialog(false);
    } catch {
      setError('Failed to add debtor');
    }
  };

  const handleAddEMIDebtor = async () => {
    try {
      const res = await api.post(`transaction/emidebtors/`, newEMIDebtorData);
      setEmiDebtors([...emiDebtors, res.data]);
      setNewEMIDebtorData({ name: '', phone_number: '', due: '', brand: '', branch: branchId });
      setShowNewEMIDebtorDialog(false);
      setFormData({
        ...formData,
        emi_debtor: res.data.id.toString(),
      });
    } catch (err) {
      console.error('Error adding EMI debtor:', err);
      setError('Failed to add EMI debtor');
    }
  };

  // Submit updated transaction
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      setSubLoading(true);
      const discAmt =
        discountType === 'percent'
          ? subtotal * ((parseFloat(discountValue) || 0) / 100)
          : parseFloat(discountValue) || 0;
      const payload = {
        ...formData,
        subtotal,
        discount: discAmt,
        total_amount: totalAmount,
      };
      await api.patch(`transaction/salestransaction/${salesId}/`, payload);
      navigate('/mobile/sales/branch/' + branchId);
    } catch {
      setError('Failed to update transaction');
    } finally {
      setSubLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`transaction/salestransaction/${salesId}/`);
      navigate('/mobile/sales/branch/' + branchId);
    } catch {
      setError('Failed to delete transaction');
    }
  };

  const appendReturn = (id) => {
    setReturns(prevReturns => [...prevReturns, id]);
    setFormData(prevState => ({
      ...prevState,
      sales: prevState.sales.map(sale => 
        sale.id === id ? { ...sale, returned: true } : sale
      )
    }));
    console.log(returns);
  };

  const handleReturn = async () => {
    try {
      setSubLoading(true);
      const response = await api.post('transaction/sales-return/', {
        "sales_ids": returns, 
        "sales_transaction_id": salesId,
        "branch": branchId
      });
      console.log('Returned:', response.data);
    } catch (error) {
      console.error('Error returning sales:', error);
      setError('Failed to process return. Please try again.');
    } finally {
      setSubLoading(false);
      navigate('/mobile/sales/branch/' + branchId);
    }
  };

  const hasFormChanged = () => {
    if (!originalSalesData) return false;
    // you can extend this to include new payment/discount fields if desired
    return JSON.stringify(formData.sales) !== JSON.stringify(
      originalSalesData.sales.map(s => ({
        ...s,
        phone: s.phone.toString(),
        imei_number: s.imei_number,
        unit_price: s.unit_price.toString(),
      }))
    ) || formData.date !== originalSalesData.date ||
      formData.name !== originalSalesData.name ||
      formData.phone_number !== originalSalesData.phone_number?.toString() ||
      formData.bill_no !== originalSalesData.bill_no ||
      formData.method !== (originalSalesData.method || 'cash') ||
      formData.debtor !== (originalSalesData.debtor?.toString() || '') ||
      formData.emi_debtor !== (originalSalesData.emi_debtor?.toString() || '') ||
      formData.amount_paid !== (originalSalesData.amount_paid?.toString() || '') ||
      discountValue !== (originalSalesData.discount?.toString() || '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center text-white h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar />
      <div className="flex-1 p-6 lg:ml-64">
        <Button
          onClick={() => navigate('/mobile/sales/branch/' + branchId)}
          variant="outline"
          className="mb-4 px-4 py-2 text-black border-white hover:bg-gray-700 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sales
        </Button>

        <div className="max-w-3xl mx-auto bg-slate-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-white">
            Edit Sales Transaction
          </h2>
          {error && <p className="text-red-400 mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <Label htmlFor="date" className="text-white mb-3">Date</Label>
                <Input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              <div className="flex flex-col">
                <Label htmlFor="name" className="text-white mb-3">Customer's Name</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              <div className="flex flex-col">
                <Label htmlFor="phone_number" className="text-white mb-3">Phone Number</Label>
                <Input
                  type="text"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              <div className="flex flex-col">
                <Label htmlFor="bill_no" className="text-white mb-3">Bill No.</Label>
                <Input
                  type="text"
                  id="bill_no"
                  name="bill_no"
                  value={formData.bill_no}
                  onChange={handleChange}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
            </div>

            {/* Sales Lines */}
            {formData.sales.map((sale, idx) => (
              <div key={idx} className="bg-slate-700 p-4 rounded-md shadow mb-4">
                <div className='flex justify-between'>
                  <h3 className="text-lg text-white font-semibold mb-4">Sale {idx + 1}</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-500" disabled={sale.returned}>Returned</Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 text-white">
                      <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription className="text-slate-300">
                          This action cannot be undone. This will permanently save your sale as returned
                          and remove your data from our servers.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogClose asChild>
                        <Button 
                          type="button" 
                          disabled={subLoading}
                          className="w-full bg-red-600 mt-6 hover:bg-red-700 text-white"
                          onClick={() => appendReturn(sale.id)}
                        >
                          Yes
                        </Button>
                      </DialogClose>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Phone */}
                  <div className="flex flex-col">
                    <Label className="text-white mb-3">Phone</Label>
                    <Popover
                      open={openPhone[idx]}
                      onOpenChange={open => {
                        const arr = [...openPhone];
                        arr[idx] = open;
                        setOpenPhone(arr);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between bg-slate-600 border-slate-500 text-white"
                        >
                          {sale.phone
                            ? phones.find(p => p.id.toString() === sale.phone)?.name
                            : 'Select phone'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                        <Command className="bg-slate-700">
                          <CommandInput placeholder="Search..." className="bg-slate-700 text-white" />
                          <CommandList>
                            <CommandEmpty>No phones</CommandEmpty>
                            <CommandGroup>
                              {phones.map(p => (
                                <CommandItem
                                  key={p.id}
                                  onSelect={() => handlePhoneChange(idx, p.id.toString())}
                                  className="text-white hover:bg-slate-600"
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      sale.phone === p.id.toString() ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {p.name}
                                </CommandItem>
                              ))}
                              <CommandItem
                                onSelect={() => handlePhoneChange(idx, 'new')}
                                className="text-white hover:bg-slate-600"
                              >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add new phone
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* IMEI */}
                  <div className="flex flex-col">
                    <Label className="text-white mb-3">IMEI</Label>
                    <Popover
                      open={openIMEI[idx]}
                      onOpenChange={open => {
                        const arr = [...openIMEI];
                        arr[idx] = open;
                        setOpenIMEI(arr);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between bg-slate-600 border-slate-500 text-white"
                        >
                          {sale.imei_number || 'Select IMEI'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                        <Command className="bg-slate-700 h-60 overflow-y-auto">
                          <CommandInput placeholder="Search..." className="bg-slate-700 text-white" />
                          <CommandList>
                            <CommandEmpty>No IMEIs</CommandEmpty>
                            <CommandGroup>
                              {(sale.phone &&
                                phones
                                  .find(p => p.id.toString() === sale.phone)
                                  ?.imeis || []
                              ).map(imei => (
                                <CommandItem
                                  key={imei}
                                  onSelect={() => handleIMEIChange(idx, imei)}
                                  className="text-white hover:bg-slate-600"
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      sale.imei_number === imei ? 'opacity-100' : 'opacity-0'
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
                    <Label className="text-white mb-3">Unit Price</Label>
                    <Input
                      type="number"
                      name="unit_price"
                      value={sale.unit_price}
                      onChange={e => handleSaleChange(idx, e)}
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
                    className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleRemoveSale(idx)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
            ))}


            {/* Totals & Discounts */}
            <div className="bg-slate-700 p-4 rounded-md shadow mb-4 text-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <Label className="mb-3">Subtotal</Label>
                  <Input
                    type="number"
                    value={subtotal.toFixed(2)}
                    readOnly
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>
                <div className="flex flex-col">
                  <Label className="mb-3">Discount</Label>
                  <div className="flex space-x-2">
                    <select
                      value={discountType}
                      onChange={e => setDiscountType(e.target.value)}
                      className="bg-slate-600 border-slate-500 text-white p-2 rounded"
                    >
                      <option value="amount">Amount</option>
                      <option value="percent">Percent</option>
                    </select>
                    <Input
                      type="number"
                      placeholder="Value"
                      value={discountValue}
                      onChange={e => setDiscountValue(e.target.value)}
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <Label className="mb-3">Total</Label>
                  <Input
                    type="number"
                    value={totalAmount.toFixed(2)}
                    readOnly
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>
                <div className="flex flex-col">
                  <Label className="mb-3">Payment Method</Label>
                  <Select
                    value={formData.method}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, method: value }))
                    }
                    className="bg-slate-600 border-slate-500 text-white"
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 text-white border-slate-700">
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

            {/* Credit Details */}
            {formData.method === 'credit' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div className="flex flex-col">
                  <Label className="text-white mb-3">Debtor</Label>
                  <Popover open={openDebtor} onOpenChange={setOpenDebtor}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between bg-slate-600 border-slate-500 text-white"
                      >
                        {formData.debtor
                          ? debtors.find(d => d.id.toString() === formData.debtor)?.name
                          : 'Select debtor'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                      <Command className="bg-slate-700">
                        <CommandInput placeholder="Search..." className="bg-slate-700 text-white" />
                        <CommandList>
                          <CommandEmpty>No debtors</CommandEmpty>
                          <CommandGroup>
                            {debtors.map(d => (
                              <CommandItem
                                key={d.id}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, debtor: d.id.toString() }));
                                  setOpenDebtor(false);
                                }}
                                className="text-white hover:bg-slate-600"
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    formData.debtor === d.id.toString() ? 'opacity-100' : 'opacity-0'
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
                              Add new debtor
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col">
                  <Label className="text-white mb-3">Amount Paid</Label>
                  <Input
                    type="number"
                    name="amount_paid"
                    value={formData.amount_paid}
                    onChange={handleChange}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="flex flex-col">
                  <Label className="text-white mb-3">Credited Amount</Label>
                  <Input
                    type="number"
                    name="credited_amount"
                    value={formData.credited_amount}
                    readOnly
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            )}

            {/* EMI Details */}
            {formData.method === 'emi' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div className="flex flex-col">
                  <Label className="text-white mb-3">EMI Debtor</Label>
                  <Popover open={openDebtor} onOpenChange={setOpenDebtor}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between bg-slate-600 border-slate-500 text-white"
                      >
                        {formData.emi_debtor
                          ? emiDebtors.find(d => d.id.toString() === formData.emi_debtor)?.name
                          : 'Select an EMI debtor...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                      <Command className="bg-slate-700">
                        <CommandInput placeholder="Search..." className="bg-slate-700 text-white" />
                        <CommandList>
                          <CommandEmpty>No EMI debtors</CommandEmpty>
                          <CommandGroup>
                            {emiDebtors.map(d => (
                              <CommandItem
                                key={d.id}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, emi_debtor: d.id.toString() }));
                                  setOpenDebtor(false);
                                }}
                                className="text-white hover:bg-slate-600"
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    formData.emi_debtor === d.id.toString() ? 'opacity-100' : 'opacity-0'
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
                  <Label className="text-white mb-3">Amount Paid</Label>
                  <Input
                    type="number"
                    name="amount_paid"
                    value={formData.amount_paid}
                    onChange={handleChange}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="flex flex-col">
                  <Label className="text-white mb-3">EMI Amount</Label>
                  <Input
                    type="number"
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
              className="w-full mb-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Item
            </Button>
            
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={!hasFormChanged() || subLoading}
            >
              Update Transaction
            </Button>
          </form>

          <Button 
            type="button" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-5"
            onClick={handleReturn}
            disabled={returns.length === 0 || subLoading}
          >
            Return Sales
          </Button>

          {/* Delete Confirmation */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full bg-red-600 mt-6 hover:bg-red-700 text-white">
                Delete Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <Button
                onClick={handleDelete}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Delete
              </Button>
            </DialogContent>
          </Dialog>

          {/* New Phone Dialog */}
          <Dialog open={showNewPhoneDialog} onOpenChange={setShowNewPhoneDialog}>
            <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Add New Phone</DialogTitle>
                <DialogDescription>Enter phone details</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newPhoneName" className="text-white">Name</Label>
                  <Input
                    id="newPhoneName"
                    name="name"
                    value={newPhoneData.name}
                    onChange={handleNewPhoneChange}
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-white">Brand</Label>
                  <Popover open={openBrand} onOpenChange={setOpenBrand}>
                    <PopoverTrigger asChild>
                      <Button className="w-full justify-between bg-slate-700 border-slate-600 text-white">
                        {newPhoneData.brand
                          ? brands.find(b => b.id.toString() === newPhoneData.brand)?.name
                          : 'Select brand'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                      <Command className="bg-slate-700">
                        <CommandInput placeholder="Search..." className="bg-slate-700 text-white" />
                        <CommandList>
                          <CommandEmpty>No brands</CommandEmpty>
                          <CommandGroup>
                            {brands.map(b => (
                              <CommandItem
                                key={b.id}
                                onSelect={() => handleNewPhoneBrandChange(b.id.toString())}
                                className="text-white hover:bg-slate-600"
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    newPhoneData.brand === b.id.toString() ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                {b.name}
                              </CommandItem>
                            ))}
                            <CommandItem
                              onSelect={() => handleNewPhoneBrandChange('new')}
                              className="text-white hover:bg-slate-600"
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Add new brand
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddPhone} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Add Phone
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* New Brand Dialog */}
          <Dialog open={showNewBrandDialog} onOpenChange={setShowNewBrandDialog}>
            <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Add New Brand</DialogTitle>
                <DialogDescription>Enter brand name</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-white">Name</Label>
                  <Input
                    value={newBrandName}
                    onChange={handleNewBrandChange}
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddBrand} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Add Brand
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* New Debtor Dialog */}
          <Dialog open={showNewDebtorDialog} onOpenChange={setShowNewDebtorDialog}>
            <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Add New Debtor</DialogTitle>
                <DialogDescription>Enter debtor details</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-white">Name</Label>
                  <Input
                    value={newDebtorData.name}
                    onChange={e => setNewDebtorData(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-white">Phone</Label>
                  <Input
                    value={newDebtorData.phone_number}
                    onChange={e =>
                      setNewDebtorData(prev => ({ ...prev, phone_number: e.target.value }))
                    }
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-white">Due</Label>
                  <Input
                    type="number"
                    value={newDebtorData.due}
                    onChange={e =>
                      setNewDebtorData(prev => ({ ...prev, due: e.target.value }))
                    }
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAddDebtor}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Add Debtor
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* New EMI Debtor Dialog */}
          <Dialog open={showNewEMIDebtorDialog} onOpenChange={setShowNewEMIDebtorDialog}>
            <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Add New EMI Debtor</DialogTitle>
                <DialogDescription>Enter EMI debtor details</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-white">Name</Label>
                  <Input
                    value={newEMIDebtorData.name}
                    onChange={e => setNewEMIDebtorData(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-white">Phone</Label>
                  <Input
                    value={newEMIDebtorData.phone_number}
                    onChange={e =>
                      setNewEMIDebtorData(prev => ({ ...prev, phone_number: e.target.value }))
                    }
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-white">Due</Label>
                  <Input
                    type="number"
                    value={newEMIDebtorData.due}
                    onChange={e =>
                      setNewEMIDebtorData(prev => ({ ...prev, due: e.target.value }))
                    }
                    className="col-span-3 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-white">Brand</Label>
                  <div className="col-span-3">
                    <Popover open={openBrand} onOpenChange={setOpenBrand}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between bg-slate-700 border-slate-600 text-white"
                        >
                          {newEMIDebtorData.brand
                            ? brands.find(b => b.id.toString() === newEMIDebtorData.brand)?.name
                            : 'Select a brand...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                        <Command className="bg-slate-700">
                          <CommandInput placeholder="Search..." className="bg-slate-700 text-white" />
                          <CommandList>
                            <CommandEmpty>No brands</CommandEmpty>
                            <CommandGroup>
                              {brands.map(b => (
                                <CommandItem
                                  key={b.id}
                                  onSelect={() => {
                                    setNewEMIDebtorData(prev => ({ ...prev, brand: b.id.toString() }));
                                    setOpenBrand(false);
                                  }}
                                  className="text-white hover:bg-slate-600"
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      newEMIDebtorData.brand === b.id.toString() ? 'opacity-100' : 'opacity-0'
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
                  onClick={handleAddEMIDebtor}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Add EMI Debtor
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </div>
  );
}
