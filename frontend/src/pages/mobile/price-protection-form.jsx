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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/sidebar';
import { useParams } from 'react-router-dom';

function PriceProtectionForm() {
  const {branchId} = useParams();
  const api = useAxios()
  const [formData, setFormData] = useState({
    from_date: '',
    to_date: '',
    price_drop: '',
    phone: '' ,
    branch:branchId
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
  const [subLoading,setSubLoading] = useState(false)
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [phonesResponse, brandsResponse] = await Promise.all([
          api.get(`inventory/phone/branch/${branchId}/`),
          api.get(`inventory/brand/branch/${branchId}/`)
        ]);
        setPhones(phonesResponse.data);
        setBrands(brandsResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
  };

  const handleNewBrandChange = (e) => {
    setNewBrandName(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubLoading(true)
      const response = await api.post('transaction/priceprotection/', formData);
      console.log('Response:', response.data);
      // Optionally clear the form or show a success message
    } catch (error) {
      console.error('Error posting data:', error);
    }
    finally{
      setSubLoading(false)
      navigate('/mobile/price-protection/branch/' + branchId);
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
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 to-slate-800">
      
      <Sidebar/>
      <div className=''>
      <Button
                onClick={() => navigate('/mobile/')}
                variant="outline"
                className="w-full sm:w-auto px-5 text-slate-900 border-white hover:bg-gray-500 mx-9 ml-80 mt-3 hover:text-slate-900 items-right"
              >
                <ArrowLeft className="mr-2 h-4 w-3" />
                Back to Dashboard
              </Button>

      
      <div className="max-w-3xl w-[600px] mx-auto ml-96 items-center bg-slate-800 p-8 m-8 rounded-lg shadow-lg">
      
      <h2 className="text-3xl font-bold mb-6 text-white">Add Price Protection</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className="border border-gray-300 rounded-lg py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
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
              className="border border-gray-300 text-white rounded-lg py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full justify-between  bg-slate-700 border-slate-600 text-white  hover:bg-slate-600  "
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
                <CommandEmpty >No phone found.</CommandEmpty>
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
            className="border border-gray-300 rounded-lg text-white py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter price drop"
            required
          />
        </div>
{/* 
        <div className="flex flex-col">
          <Label htmlFor="receivables" className="text-lg font-medium text-gray-800 mb-2">
            Receivables
          </Label>
          <Input
            type="number"
            id="receivables"
            name="receivables"
            value={formData.receivables}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter receivables"
          />
        </div> */}

        <Button type="submit" disabled = {subLoading} className="w-full hover:bg-green-300 hover:text-black">
          Submit Price Protection
        </Button>
      </form>

      <Dialog open={showNewPhoneDialog} onOpenChange={setShowNewPhoneDialog}>
        <DialogContent className="sm:max-w-[425px]">
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
                className="col-span-3"
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
                      className="w-full justify-between  bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    >
                      {newPhoneData.brand
                        ? brands.find((brand) => brand.id.toString() === newPhoneData.brand)?.name
                        : "Select brand..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-slate-700 border-slate-600 ">
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
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-white",
                                newPhoneData.brand === brand.id.toString() ? "opacity-100" : "opacity-0"
                              )}
                              />
                            {brand.name}
                          </CommandItem>
                        ))}
                        <CommandItem onSelect={() => handleNewPhoneBrandChange('new')}>
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
            <Button type="button" onClick={handleAddPhone}>Add Phone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog className="bg-black" open={showNewBrandDialog} onOpenChange={setShowNewBrandDialog}>
        <DialogContent className="sm:max-w-[425px]">
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
                className="col-span-3"
                placeholder="Enter brand name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleAddBrand}>Add Brand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
    </div>
  );
}

export default PriceProtectionForm;