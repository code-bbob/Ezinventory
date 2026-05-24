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
import { PlusCircle, Trash2, Check, ChevronsUpDown, ArrowLeft } from 'lucide-react'
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import Sidebar from '@/components/sidebar';

export default function EditSchemeForm() {
  const api = useAxios()
  const navigate = useNavigate()
  const { branchId, schemeId } = useParams()

  const [originalSchemeData, setOriginalSchemeData] = useState(null);
  const [formData, setFormData] = useState({
    from_date: '',
    to_date: '',
    phone: '',
    subscheme: []
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
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [phonesResponse, brandsResponse, schemeResponse] = await Promise.all([
          api.get(`inventory/phone/branch/${branchId}/`),
          api.get(`inventory/brand/branch/${branchId}/`),
          api.get(`transaction/scheme/${schemeId}/`)
        ]);
        setPhones(phonesResponse.data);
        setBrands(brandsResponse.data);
        setOriginalSchemeData(schemeResponse.data);
        setFormData({
          from_date: schemeResponse.data.from_date,
          to_date: schemeResponse.data.to_date,
          phone: schemeResponse.data.phone.toString(),
          subscheme: schemeResponse.data.subscheme.map(s => ({
            ...s,
            lowerbound: s.lowerbound.toString(),
            upperbound: s.upperbound.toString(),
            cashback: s.cashback.toString()
          }))
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, [schemeId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubschemeChange = (index, e) => {
    const { name, value } = e.target;
    const newSubscheme = [...formData.subscheme];
    newSubscheme[index] = { ...newSubscheme[index], [name]: value };
    setFormData({ ...formData, subscheme: newSubscheme });
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

  const handleAddSubscheme = () => {
    setFormData({
      ...formData,
      subscheme: [...formData.subscheme, { lowerbound: '', upperbound: '', cashback: '' }]
    });
  };

  const handleRemoveSubscheme = (index) => {
    const newSubscheme = formData.subscheme.filter((_, i) => i !== index);
    setFormData({ ...formData, subscheme: newSubscheme });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubLoading(true)
      const response = await api.patch(`transaction/scheme/${schemeId}/`, formData);
      console.log('Response:', response.data);
      navigate('/mobile/schemes/branch/' + branchId);
    } catch (error) {
      console.error('Error updating data:', error);
      setError('Failed to update scheme. Please try again.');
    }
    finally{
      setSubLoading(false)
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`transaction/scheme/${schemeId}/`);
      navigate('/mobile/schemes/branch/' + branchId);
    } catch (error) {
      console.error('Error deleting scheme:', error);
      setError('Failed to delete scheme. Please try again.');
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
    if (!originalSchemeData) return false;
    
    return (
      formData.from_date !== originalSchemeData.from_date ||
      formData.to_date !== originalSchemeData.to_date ||
      formData.phone !== originalSchemeData.phone.toString() ||
      formData.subscheme.length !== originalSchemeData.subscheme.length ||
      formData.subscheme.some((subscheme, index) => {
        const originalSubscheme = originalSchemeData.subscheme[index];
        return (
          subscheme.lowerbound !== originalSubscheme.lowerbound.toString() ||
          subscheme.upperbound !== originalSubscheme.upperbound.toString() ||
          subscheme.cashback !== originalSubscheme.cashback.toString()
        );
      })
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar/>
      <div className="flex-1 p-4 lg:ml-64">
        <div className="max-w-4xl mx-auto">
          <div className='flex justify-end'>

          <Button
            onClick={() => navigate('/mobile/schemes/branch/' + branchId)}
            variant="outline"
            className="mb-6 px-4 py-2 text-black border-white hover:bg-gray-700 hover:text-white"
            >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Schemes
          </Button>
            </div>

          <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-white">Edit Scheme</h2>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <Label htmlFor="from_date" className="text-sm font-medium text-white mb-2">
                    From Date
                  </Label>
                  <Input
                    type="date"
                    id="from_date"
                    name="from_date"
                    value={formData.from_date}
                    onChange={handleChange}
                    className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="to_date" className="text-sm font-medium text-white mb-2">
                    To Date
                  </Label>
                  <Input
                    type="date"
                    id="to_date"
                    name="to_date"
                    value={formData.to_date}
                    onChange={handleChange}
                    className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <Label htmlFor="phone" className="text-sm font-medium text-white mb-2">
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
                        : "Select a phone..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-slate-800 border-slate-700">
                    <Command className="bg-slate-700 border-slate-600">
                      <CommandInput className="bg-slate-700 text-white" placeholder="Search phone..." />
                      <CommandList className="max-h-[200px] overflow-auto">
                        <CommandEmpty>No phone found.</CommandEmpty>
                        <CommandGroup>
                          {phones.map((phone) => (
                            <CommandItem 
                              key={phone.id}
                              onSelect={() => handlePhoneChange(phone.id.toString())}
                              className="text-white hover:bg-slate-600"
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
                          <CommandItem onSelect={() => handlePhoneChange('new')} className="text-white hover:bg-slate-600">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add a new phone
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <h3 className="text-xl font-semibold text-white mb-2">Subschemes</h3>
              {formData.subscheme.map((subscheme, index) => (
                <div key={index} className="bg-slate-700 p-4 rounded-md shadow mb-4">
                  <h4 className="text-lg font-semibold text-white mb-4">Subscheme {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <Label
                        htmlFor={`lowerbound-${index}`}
                        className="text-sm font-medium text-white mb-2"
                      >
                        Lower Bound
                      </Label>
                      <Input
                        type="number"
                        id={`lowerbound-${index}`}
                        name="lowerbound"
                        value={subscheme.lowerbound}
                        onChange={(e) => handleSubschemeChange(index, e)}
                        className="bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Enter lower bound"
                        required
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label
                        htmlFor={`upperbound-${index}`}
                        className="text-sm font-medium text-white mb-2"
                      >
                        Upper Bound
                      </Label>
                      <Input
                        type="number"
                        id={`upperbound-${index}`}
                        name="upperbound"
                        value={subscheme.upperbound}
                        onChange={(e) => handleSubschemeChange(index, e)}
                        className="bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Enter upper bound"
                        required
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label
                        htmlFor={`cashback-${index}`}
                        className="text-sm font-medium text-white mb-2"
                      >
                        Cashback
                      </Label>
                      <Input
                        type="number"
                        id={`cashback-${index}`}
                        name="cashback"
                        value={subscheme.cashback}
                        onChange={(e) => handleSubschemeChange(index, e)}
                        className="bg-slate-600 border-slate-500 text-white focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Enter cashback amount"
                        required
                      />
                    </div>
                  </div>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => handleRemoveSubscheme(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Subscheme
                    </Button>
                  )}
                </div>
              ))}

              <Button type="button" onClick={handleAddSubscheme} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Another Subscheme
              </Button>

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={!hasFormChanged() || subLoading}
              >
                Update Scheme
              </Button>
            </form>

            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  type="button" 
                  className="w-full bg-red-600 mt-6 hover:bg-red-700 text-white"
                >
                  Delete Scheme
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 text-white">
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription className="text-slate-300">
                    This action cannot be undone. This will permanently delete your scheme
                    and remove your data from our servers.
                  </DialogDescription>
                </DialogHeader>
                <Button 
                  type="button" 
                  className="w-full bg-red-600 mt-6 hover:bg-red-700 text-white"
                  onClick={handleDelete}
                >
                  Delete Scheme
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
                    <Label htmlFor="newPhoneName" className="text-right text-white">
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
                    <Label htmlFor="newPhoneBrand" className="text-right text-white">
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
                              : "Select a brand..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600">
                          <Command className="bg-slate-700 border-slate-600">
                            <CommandInput placeholder="Search brand..." className="bg-slate-700 text-white" />
                            <CommandList className="max-h-[200px] overflow-auto">
                              <CommandEmpty>No brand found.</CommandEmpty>
                              <CommandGroup>
                                {brands.map((brand) => (
                                  <CommandItem
                                    key={brand.id}
                                    onSelect={() => handleNewPhoneBrandChange(brand.id.toString())}
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
                  <Button type="button" onClick={handleAddPhone} className="bg-green-600 hover:bg-green-700 text-white">Add Phone</Button>
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
                    <Label htmlFor="newBrandName" className="text-right text-white">
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
                  <Button type="button" onClick={handleAddBrand} className="bg-green-600 hover:bg-green-700 text-white">Add Brand</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}