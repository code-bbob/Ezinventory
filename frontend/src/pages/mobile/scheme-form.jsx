'use client'

import React, { useState, useEffect } from 'react';
import useAxios from '@/utils/useAxios';
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, Trash2, Check, ChevronsUpDown, ArrowLeft } from 'lucide-react'
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandList,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import Sidebar from '@/components/sidebar';
import { useNavigate, useParams } from 'react-router-dom';

export default function SchemeForm() {
  const api = useAxios()
  const { branchId } = useParams()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    phone: '',
    subscheme: [{ lowerbound: '', upperbound: '', cashback: '' }],
    branch: branchId,
  });
  const [phones, setPhones] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewPhoneDialog, setShowNewPhoneDialog] = useState(false);
  const [showNewBrandDialog, setShowNewBrandDialog] = useState(false);
  const [newPhoneData, setNewPhoneData] = useState({ name: '', brand: '', branch: branchId });
  const [newBrandName, setNewBrandName] = useState('');
  const [openPhone, setOpenPhone] = useState(false);
  const [openBrand, setOpenBrand] = useState(false);
  const [subLoading, setSubLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [phonesRes, brandsRes] = await Promise.all([
          api.get(`inventory/phone/branch/${branchId}/`),
          api.get(`inventory/brand/branch/${branchId}/`)
        ]);
        setPhones(phonesRes.data);
        setBrands(brandsRes.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [branchId]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubschemeChange = (idx, e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const subs = [...prev.subscheme];
      subs[idx] = { ...subs[idx], [name]: value };
      return { ...prev, subscheme: subs };
    });
  };

  const handlePhoneChange = (value) => {
    if (value === 'new') setShowNewPhoneDialog(true);
    else setFormData(prev => ({ ...prev, phone: value }));
    setOpenPhone(false);
  };

  const handleNewPhoneChange = (e) => setNewPhoneData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleNewPhoneBrandChange = (value) => {
    if (value === 'new') setShowNewBrandDialog(true);
    else setNewPhoneData(prev => ({ ...prev, brand: value }));
    setOpenBrand(false);
  };
  const handleNewBrandChange = (e) => setNewBrandName(e.target.value);

  const handleAddSubscheme = () => setFormData(prev => ({
    ...prev,
    subscheme: [...prev.subscheme, { lowerbound: '', upperbound: '', cashback: '' }]
  }));

  const handleRemoveSubscheme = (idx) => setFormData(prev => ({
    ...prev,
    subscheme: prev.subscheme.filter((_, i) => i !== idx)
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubLoading(true);
    try {
      await api.post('transaction/scheme/', formData);
      navigate('/mobile/schemes/branch/' + branchId);
    } catch (err) {
      console.error(err);
    } finally {
      setSubLoading(false);
    }
  };

  const handleAddPhone = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('inventory/phone/', newPhoneData);
      setPhones(prev => [...prev, res.data]);
      setFormData(prev => ({ ...prev, phone: res.data.id.toString() }));
      setShowNewPhoneDialog(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('inventory/brand/', { name: newBrandName, branch: branchId });
      setBrands(prev => [...prev, res.data]);
      setNewPhoneData(prev => ({ ...prev, brand: res.data.id.toString() }));
      setShowNewBrandDialog(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar />
      <main className="flex-1 lg:ml-60 p-4 md:p-8">
        <Button
          onClick={() => navigate('/mobile')}
          variant="outline"
          className="mb-4 border-white hover:bg-gray-500 w-full sm:w-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-3" />
          Back to Dashboard
        </Button>

        <div className="max-w-3xl mx-auto bg-slate-800 p-6 sm:p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white text-center">Add Scheme</h2>
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <Label htmlFor="from_date" className="text-lg font-medium text-white mb-1">From Date</Label>
                <Input
                  type="date"
                  className="bg-slate-700 text-white"
                  id="from_date"
                  name="from_date"
                  value={formData.from_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="flex flex-col">
                <Label htmlFor="to_date" className="text-lg font-medium text-white mb-1">To Date</Label>
                <Input
                  type="date"
                  className="bg-slate-700 text-white"
                  id="to_date"
                  name="to_date"
                  value={formData.to_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col">
              <Label htmlFor="phone" className="text-lg font-medium text-white mb-1">Phone</Label>
              <Popover open={openPhone} onOpenChange={setOpenPhone}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPhone}
                    className="w-full justify-between bg-slate-700 text-white"
                  >
                    {formData.phone
                      ? phones.find(p => p.id.toString() === formData.phone)?.name
                      : 'Select a phone...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 bg-slate-800">
                  <Command className="bg-slate-800 text-white">
                    <CommandInput placeholder="Search phone..." />
                    <CommandList>
                      <CommandEmpty>No phone found.</CommandEmpty>
                      <CommandGroup>
                        {!loading && phones.map(phone => (
                          <CommandItem key={phone.id} onSelect={() => handlePhoneChange(phone.id.toString())}>
                            <Check className={cn('mr-2 h-4 w-4', formData.phone === phone.id.toString() ? 'opacity-100' : 'opacity-0')} />
                            {phone.name}
                          </CommandItem>
                        ))}
                        <CommandItem onSelect={() => handlePhoneChange('new')}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Add a new phone
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <h3 className="text-xl font-semibold text-white">Subschemes</h3>
            {formData.subscheme.map((sub, idx) => (
              <div key={idx} className="bg-slate-700 p-4 rounded-md shadow space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-white">Subscheme {idx + 1}</h4>
                  {idx > 0 && (
                    <Button size="sm" variant="destructive" onClick={() => handleRemoveSubscheme(idx)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {['lowerbound','upperbound','cashback'].map(name => (
                    <div key={name} className="flex flex-col">
                      <Label htmlFor={`${name}-${idx}`} className="text-sm font-medium text-white mb-1 capitalize">
                        {name.replace(/bound/, ' Bound')}
                      </Label>
                      <Input
                        type="number"
                        className="bg-slate-700 text-white"
                        id={`${name}-${idx}`}
                        name={name}
                        value={sub[name]}
                        onChange={e => handleSubschemeChange(idx, e)}
                        placeholder={`Enter ${name}`}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Button type="button" onClick={handleAddSubscheme} className="w-full bg-green-600 hover:bg-green-800">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Another Subscheme
            </Button>

            <Button type="submit" disabled={subLoading} className="w-full bg-purple-600 hover:bg-purple-800">
              {subLoading ? 'Submitting...' : 'Submit Scheme'}
            </Button>
          </form>
        </div>

        {/* New Phone Dialog */}
        <Dialog open={showNewPhoneDialog} onOpenChange={setShowNewPhoneDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Phone</DialogTitle>
              <DialogDescription>Enter details for the new phone.</DialogDescription>
            </DialogHeader>
            <form className="space-y-4 p-4" onSubmit={handleAddPhone}>
              <div className="flex flex-col">
                <Label htmlFor="newPhoneName" className="mb-1">Name</Label>
                <Input id="newPhoneName" name="name" value={newPhoneData.name} onChange={handleNewPhoneChange} required />
              </div>
              <div className="flex flex-col">
                <Label htmlFor="newPhoneBrand" className="mb-1">Brand</Label>
                <Popover open={openBrand} onOpenChange={setOpenBrand}>
                  <PopoverTrigger asChild>
                    <Button role="combobox" className="justify-between bg-slate-700 text-white w-full">
                      {newPhoneData.brand
                        ? brands.find(b => b.id.toString() === newPhoneData.brand)?.name
                        : 'Select brand...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-slate-700 text-white">
                    <Command className="bg-slate-700 text-white">
                      <CommandInput placeholder="Search brand..." />
                      <CommandList>
                        <CommandEmpty>No brand found.</CommandEmpty>
                        <CommandGroup>
                          {brands.map(b => (
                            <CommandItem key={b.id} onSelect={() => handleNewPhoneBrandChange(b.id.toString())}>
                              <Check className={cn('mr-2 h-4 w-4', newPhoneData.brand === b.id.toString() ? 'opacity-100' : 'opacity-0')} /> {b.name}
                            </CommandItem>
                          ))}
                          <CommandItem onSelect={() => handleNewPhoneBrandChange('new')}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New Brand
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <DialogFooter>
                <Button type="submit">Add Phone</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* New Brand Dialog */}
        <Dialog open={showNewBrandDialog} onOpenChange={setShowNewBrandDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Brand</DialogTitle>
              <DialogDescription>Enter the new brand name.</DialogDescription>
            </DialogHeader>
            <form className="space-y-4 p-4" onSubmit={handleAddBrand}>
              <div className="flex flex-col">
                <Label htmlFor="newBrandName" className="mb-1">Brand Name</Label>
                <Input id="newBrandName" value={newBrandName} onChange={handleNewBrandChange} required />
              </div>
              <DialogFooter>
                <Button type="submit">Add Brand</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
