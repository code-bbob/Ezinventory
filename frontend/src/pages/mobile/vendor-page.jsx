'use client';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Smartphone, ArrowLeft, Search, Plus } from 'lucide-react'
import useAxios from '@/utils/useAxios'
import Sidebar from '@/components/sidebar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function VendorPage() {
  const { branchId } = useParams()
  const api = useAxios()
  const navigate = useNavigate()
  const [brands, setBrands] = useState([])
  const [filteredBrands, setFilteredBrands] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await api.get(`transaction/vendorbrand/branch/${branchId}/`)
        setBrands(response.data)
        setFilteredBrands(response.data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching brands:', err)
        setError('Failed to load brands')
        setLoading(false)
      }
    }

    fetchBrands()
  }, [])

  useEffect(() => {
    const results = brands.filter(brand =>
      brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredBrands(results)
  }, [searchTerm, brands])

  const handleSearch = (event) => {
    setSearchTerm(event.target.value)
  }

  const handleAddBrand = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post(`inventory/brand/branch/${branchId}`, { name: newBrandName, branch: branchId })
      console.log('New Brand Added:', response.data)
      setBrands([...brands, response.data])
      setFilteredBrands([...filteredBrands, response.data])
      setNewBrandName('')
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error adding brand:', error)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      Loading...
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-red-500">
      {error}
    </div>
  )

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar className="w-full md:w-64 md:min-h-screen" />
      <div className="flex-1 lg:ml-64 overflow-auto relative p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col space-y-4 mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white">Vendor Brands</h1>

            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search brands..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 w-full bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <Button
                onClick={() => navigate('/mobile/')}
                variant="outline"
                className="w-full sm:w-auto text-slate-900 border-white hover:bg-gray-500 hover:text-slate-900"
              >
                <ArrowLeft className="mr-2 h-4 w-3" />
                Back to Dashboard
              </Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredBrands.map((brand) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                onClick={() => navigate(`/mobile/vendors/branch/${branchId}/brand/${brand.id}`)}
              />
            ))}
          </div>

          {filteredBrands.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center text-white mt-8"
            >
              No brands found matching your search.
            </motion.div>
          )}
        </div>

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
              <DialogTitle>Add New Brand</DialogTitle>
              <DialogDescription className="text-slate-400">
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
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="col-span-3 bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
                  placeholder="Enter brand name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleAddBrand} className="bg-purple-600 hover:bg-purple-700 text-white">
                Add Brand
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function BrandCard({ brand, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg hover:shadow-xl transition-shadow duration-300 group relative overflow-hidden">
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        <div className="absolute inset-0 bg-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-lg md:text-xl font-medium text-slate-300 group-hover:text-white transition-colors duration-300">
            {brand.name}
          </CardTitle>
          <Smartphone className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-xs md:text-sm text-slate-400 group-hover:text-purple-200 transition-colors duration-300">
            Vendors: {brand.count}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}