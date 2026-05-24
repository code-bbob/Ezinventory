'use client';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, ArrowLeft, BookUser, Plus, Trash2 } from 'lucide-react'
import useAxios from '@/utils/useAxios'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '@/components/sidebar'
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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function VendorBrand() {
  const { branchId, id } = useParams()
  const api = useAxios()
  const navigate = useNavigate()

  const [phones, setPhones] = useState([])
  const [filteredPhones, setFilteredPhones] = useState([])
  const [brandName, setBrandName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showNewVendorDialog, setShowNewVendorDialog] = useState(false)
  const [newVendorData, setNewVendorData] = useState({ name: "", brand: id, branch: branchId })

  const [selectedVendors, setSelectedVendors] = useState([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleAddVendor = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post("transaction/vendor/", newVendorData)
      setFilteredPhones([...filteredPhones, response.data])
      setPhones([...phones, response.data])
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error adding vendor:", error)
      setError("Failed to add new vendor. Please try again.")
    }
  }

  const handleNewVendorChange = (e) => {
    const { name, value } = e.target
    setNewVendorData({ ...newVendorData, [name]: value })
  }

  const handleCheckboxChange = (vendorId) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    )
  }

  const handleDeleteSelected = async () => {
    setIsDeleteDialogOpen(false)
    try {
      for (const vendorId of selectedVendors) {
        await api.delete(`transaction/vendor/${vendorId}/`)
      }
      setPhones(prev => prev.filter(v => !selectedVendors.includes(v.id)))
      setFilteredPhones(prev => prev.filter(v => !selectedVendors.includes(v.id)))
      setSelectedVendors([])
    } catch (err) {
      console.error("Error deleting vendors:", err)
    }
  }

  useEffect(() => {
    const fetchBrandPhones = async () => {
      try {
        const response = await api.get(`transaction/vendorbrand/${id}/`)
        setPhones(response.data)
        setFilteredPhones(response.data)
        setBrandName(response.data[0]?.brand_name)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching brand vendors:', err)
        setError('Failed to load brand vendors')
        setLoading(false)
      }
    }

    fetchBrandPhones()
  }, [id])

  useEffect(() => {
    const results = phones.filter(vendor =>
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredPhones(results)
  }, [searchTerm, phones])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col md:flex-row">
      <Sidebar className="w-full md:min-h-screen" />
      <div className="w-full lg:ml-64 p-4 md:p-8 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0"
        >
          <h1 className="text-2xl md:text-4xl font-bold text-white">{brandName} Vendors</h1>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <Button
              onClick={() => navigate('/mobile/inventory/branch/'+ branchId)}
              variant="outline"
              className="w-full sm:w-auto px-5 text-slate-900 border-white hover:bg-gray-500 hover:text-slate-900"
            >
              <ArrowLeft className="mr-2 h-4 w-3" />
              Back to Inventory
            </Button>
            <Button
              onClick={() => setIsDeleteDialogOpen(true)}
              variant="destructive"
              className="w-full sm:w-auto px-5"
              disabled={selectedVendors.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </motion.div>

        <Card className="bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg">
          <CardContent className="p-0">
            <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-slate-300 border-b border-slate-700">
              <div className="col-span-1"></div>
              <div className="col-span-7 md:col-span-8">Vendors</div>
              <div className="col-span-4 md:col-span-3 text-right">Due Amount</div>
            </div>

            {filteredPhones?.map((vendor) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                onClick={() => navigate(`/mobile/vendors/statement/${vendor.id}`)}
                className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800 transition-colors duration-200 ${
                  selectedVendors.includes(vendor.id) ? "bg-slate-700" : ""
                }`}
              >
                <div className="col-span-1 flex justify-center items-center">
                  <Checkbox
                                      checked={selectedVendors.includes(vendor.id)}
                                      onCheckedChange={() => handleCheckboxChange(vendor.id)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="border-gray-400"
                                    />
                </div>
                <div className="col-span-7 md:col-span-8 flex items-center">
                  <BookUser className="h-5 w-5 text-purple-400 mr-2 flex-shrink-0" />
                  <span className="text-white truncate">{vendor.name}</span>
                </div>
                <div className="col-span-4 md:col-span-3 text-right text-white">
                  {vendor.due ? `RS. ${vendor.due.toLocaleString()}` : "N/A"}
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {filteredPhones.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center text-white mt-8"
          >
            No vendors found matching your search.
          </motion.div>
        )}

        {/* Add Vendor Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="fixed bottom-4 right-4 md:bottom-8 md:right-8 rounded-full w-12 h-12 md:w-16 md:h-16 shadow-lg bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="w-6 h-6 md:w-8 md:h-8" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
              <DialogDescription className="text-slate-300">
                Enter the details of the new vendor you want to add.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newVendorName" className="text-right text-white">
                  Name
                </Label>
                <Input
                  id="newVendorName"
                  name="name"
                  value={newVendorData.name}
                  onChange={handleNewVendorChange}
                  className="col-span-3 bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter vendor name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={handleAddVendor}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Add Vendor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="w-full max-w-md mx-auto bg-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Confirm Deletion</DialogTitle>
              <DialogDescription className="text-sm sm:text-base text-slate-300">
                Are you sure you want to delete the selected vendors? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <Button variant="outline" className="text-black" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteSelected}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
