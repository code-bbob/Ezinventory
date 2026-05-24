'use client'

import React, { useState, useEffect } from 'react';
import useAxios from '@/utils/useAxios';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import Sidebar from '@/components/sidebar';

export default function EditPriceProtectionForm() {
  const api = useAxios()
  const navigate = useNavigate()
  const { branchId,priceProtectionId } = useParams()

  const [originalPriceProtectionData, setOriginalPriceProtectionData] = useState(null);
  const [formData, setFormData] = useState({
    from_date: '',
    to_date: '',
    price_drop: '',
    phone: ''
  });
  const [phones, setPhones] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewPhoneDialog, setShowNewPhoneDialog] = useState(false);
  const [showNewBrandDialog, setShowNewBrandDialog] = useState(false);
  const [newPhoneData, setNewPhoneData] = useState({ name: '', brand: '' });
  const [newBrandName, setNewBrandName] = useState('');
  const [openPhone, setOpenPhone] = useState(false);
  const [openBrand, setOpenBrand] = useState(false);
  const [subLoading, setSubLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [phonesResponse, brandsResponse, priceProtectionResponse] = await Promise.all([
          api.get('inventory/phone/'),
          api.get('inventory/brand/'),
          api.get(`transaction/priceprotection/${priceProtectionId}/`)
        ]);
        setPhones(phonesResponse.data);
        setBrands(brandsResponse.data);
        setOriginalPriceProtectionData(priceProtectionResponse.data);
        setFormData({
          from_date: priceProtectionResponse.data.from_date,
          to_date: priceProtectionResponse.data.to_date,
          price_drop: priceProtectionResponse.data.price_drop.toString(),
          phone: priceProtectionResponse.data.phone.toString()
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, [priceProtectionId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhoneChange = (value) => {
    if (value === 'new') {
      setShowNewPhoneDialog(true);
    } else {
      setFormData({ ...formData, phone: value });
    }
    setOpenPhone(false);
  };

  const handleNewPhoneChange = (e) => {
    const { name, value } = e.target;
    setNewPhoneData({ ...newPhoneData, [name]: value });
  };

  const handleNewPhoneBrandChange = (value) => {
    if (value === 'new') {
      setShowNewBrandDialog(true);
    } else {
      setNewPhoneData({ ...newPhoneData, brand: value });
    }
    setOpenBrand(false);
  };

  const handleNewBrandChange = (e) => {
    setNewBrandName(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubLoading(true)
      const response = await api.patch(`transaction/priceprotection/${priceProtectionId}/`, formData);
      console.log('Response:', response.data);
      navigate('/mobile/price-protection/branch/' + branchId);
    } catch (error) {
      console.error('Error updating data:', error);
      setError('Failed to update price protection. Please try again.');
    }
    finally{
      setSubLoading(false)
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`transaction/priceprotection/${priceProtectionId}/`);
      navigate('/mobile/price-protection/branch/' + branchId);
    } catch (error) {
      console.error('Error deleting price protection:', error);
      setError('Failed to delete price protection. Please try again.');
    }
  };

  const handleAddPhone = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('inventory/phone/', newPhoneData);
      console.log('New Phone Added:', response.data);
      setPhones([...phones, response.data]);
      setFormData({ ...formData, phone: response.data.id.toString() });
      setNewPhoneData({ name: '', brand: '' });
      setShowNewPhoneDialog(false);
    } catch (error) {
      console.error('Error adding phone:', error);
      setError('Failed to add new phone. Please try again.');
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('inventory/brand/', { name: newBrandName });
      console.log('New Brand Added:', response.data);
      setBrands([...brands, response.data]);
      setNewBrandName('');
      setShowNewBrandDialog(false);
      setNewPhoneData({ ...newPhoneData, brand: response.data.id.toString() });
    } catch (error) {
      console.error('Error adding brand:', error);
      setError('Failed to add new brand. Please try again.');
    }
  };

  const hasFormChanged = () => {
    if (!originalPriceProtectionData) return false;
    
    return (
      formData.from_date !== originalPriceProtectionData.from_date ||
      formData.to_date !== originalPriceProtectionData.to_date ||
      formData.price_drop !== originalPriceProtectionData.price_drop.toString() ||
      formData.phone !== originalPriceProtectionData.phone.toString()
    );
  };

  if (loading) {
    return <div className="text-white bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar />
      <div className="flex-1 p-4 lg:ml-64">
        <Button
          onClick={() => navigate('/mobile/price-protection/branch/' + branchId)}
          variant="outline"
          className="mb-4 w-full sm:w-auto px-5 border-white hover:bg-gray-700 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-3" />
          Back to Price Protection
        </Button>

        <div className="max-w-3xl mx-auto bg-slate-800 p-4 sm:p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">Edit Price Protection</h2>
          {error && <p className="text-red-400 mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <Label htmlFor="from_date" className="text-lg font-medium text-white mb-2">
                  From Date
                </Label>
                <Input
                  type="date"
                  id="from_date"
                  name="from_date"
                  value={formData.from_date}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              <div className="flex flex-col">
                <Label htmlFor="to_date" className="text-lg font-medium text-white mb-2">
                  To Date
                </Label>
                <Input
                  type="date"
                  id="to_date"
                  name="to_date"
                  value={formData.to_date}
                  onChange={handleChange}
                  className="w-full bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col">
              <Label htmlFor="phone" className="text-lg font-medium text-white mb-2">
                Phone
              </Label>
              <Popover open={openPhone} onOpenChange={setOpenPhone}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPhone}
                    className="w-full justify-between bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    {formData.phone
                      ? phones.find((phone) => phone.id.toString() === formData.phone)?.name
                      : "Select phone..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command className='bg-slate-700 border-slate-600'>
                    <CommandInput className="bg-slate-700 text-white" placeholder="Search phone..." />
                    <CommandList>
                      <CommandEmpty>No phone found.</CommandEmpty>
                      <CommandGroup>
                        {phones.map((phone) => (
                          <CommandItem
                            className="bg-slate-700 text-white"
                            key={phone.id}
                            onSelect={() => {
                              handlePhoneChange(phone.id.toString())
                              setOpenPhone(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.phone === phone.id.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {phone.name}
                          </CommandItem>
                        ))}
                        <CommandItem className="bg-slate-700 text-white" onSelect={() => handlePhoneChange('new')}>
                          Add a new phone
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col">
              <Label htmlFor="price_drop" className="text-lg font-medium text-white mb-2">
                Price Drop
              </Label>
              <Input
                type="number"
                id="price_drop"
                name="price_drop"
                value={formData.price_drop}
                onChange={handleChange}
                className="w-full bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter price drop"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={!hasFormChanged() || subLoading}
            >
              Update Price Protection
            </Button>
          </form>

          <Dialog>
            <DialogTrigger asChild>
              <Button 
                type="button" 
                className="w-full bg-red-600 mt-6 hover:bg-red-700 text-white"
              >
                Delete Price Protection
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription className="text-slate-300">
                  This action cannot be undone. This will permanently delete your price protection
                  and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <Button 
                type="button" 
                className="w-full bg-red-600 mt-6 hover:bg-red-700 text-white"
                onClick={handleDelete}
              >
                Delete Price Protection
              </Button>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewPhoneDialog} onOpenChange={setShowNewPhoneDialog}>
            <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Add New Phone</DialogTitle>
                <DialogDescription className="text-slate-300">
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
                    placeholder="Enter phone name"
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
                          className="w-full justify-between bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                        >
                          {newPhoneData.brand
                            ? brands.find((brand) => brand.id.toString() === newPhoneData.brand)?.name
                            : "Select brand..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                        <Command className="bg-slate-700 border-slate-600">
                          <CommandInput className="bg-slate-700 border-slate-600 text-white" placeholder="Search brand..." />
                          <CommandList>
                            <CommandEmpty>No brand found.</CommandEmpty>
                            <CommandGroup>
                              {brands.map((brand) => (
                                <CommandItem
                                  key={brand.id}
                                  onSelect={() => {
                                    handleNewPhoneBrandChange(brand.id.toString())
                                    setOpenBrand(false)
                                  }}
                                  className="text-white hover:bg-slate-600"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      newPhoneData.brand === brand.id.toString() ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {brand.name}
                                </CommandItem>
                              ))}
                              <CommandItem onSelect={() => handleNewPhoneBrandChange('new')} className="text-white hover:bg-slate-600">
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
                <Button type="button" onClick={handleAddPhone} className="w-full bg-green-600 hover:bg-green-700 text-white">Add Phone</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewBrandDialog} onOpenChange={setShowNewBrandDialog}>
            <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Add New Brand</DialogTitle>
                <DialogDescription className="text-slate-300">
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
                    placeholder="Enter brand name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={handleAddBrand} className="w-full bg-green-600 hover:bg-green-700 text-white">Add Brand</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}