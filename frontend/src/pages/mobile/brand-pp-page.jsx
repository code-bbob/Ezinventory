'use client';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar, ChevronLeft, ChevronRight, Search, Plus, ArrowLeft } from 'lucide-react'
import useAxios from '@/utils/useAxios'
import { format } from 'date-fns'
import Sidebar from '@/components/sidebar'

export default function BrandPPPage() {
  const { branchId } = useParams()
  const api = useAxios()
  const navigate = useNavigate()
  const { id } = useParams()
  const [pps, setPps] = useState([])
  const [filteredPps, setFilteredPps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showExpired, setShowExpired] = useState(false)

  useEffect(() => {
    const fetchPps = async () => {
      if (!id) return
      setLoading(true)
      try {
        const response = await api.get(`transaction/pp/brand/${id}/`)
        setPps(response.data)
        const filtered = response.data.filter(scheme => !showExpired ? scheme.status === 'active' : scheme.status === 'expired')
        setFilteredPps(filtered)
      } catch (err) {
        console.error('Error fetching price-protections:', err)
        setError('Failed to load price-protections')
      } finally {
        setLoading(false)
      }
    }

    fetchPps()
  }, [id, showExpired])

  const handleEdit = (e, ppId) => {
    e.stopPropagation()
    e.preventDefault()
    navigate(`/mobile/price-protection/editform/${ppId}`)
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!id) return
    setLoading(true)
    try {
      const response = await api.get(`transaction/pp/brand/${id}/?search=${searchTerm}`)
      setFilteredPps(response.data)
    } catch (err) {
      console.error('Error searching price-protections:', err)
      setError('Failed to search price-protections')
    } finally {
      setLoading(false)
    }
  }

  const handleDateSearch = async (e) => {
    e.preventDefault()
    if (!id) return
    setLoading(true)
    try {
      const response = await api.get(`transaction/pp/brand/${id}/?start_date=${startDate}&end_date=${endDate}`)
      setFilteredPps(response.data)
    } catch (err) {
      console.error('Error filtering schemes by date:', err)
      setError('Failed to filter schemes by date')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleExpired = () => {
    setShowExpired(!showExpired)
  }

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
    <div className="flex min-h-screen bg-gradient-to-br p-4 from-slate-900 to-slate-800">
      <Sidebar className="hidden lg:block w-64 flex-shrink-0" />
      <div className="flex-grow p-4 lg:p-6 lg:ml-64 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0"
          >
            <h1 className="text-3xl lg:text-4xl font-bold text-white">Brand Price Protections</h1>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full lg:w-auto px-5 text-black border-white hover:bg-gray-700 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-3" />
              Back to Price Protection
            </Button>
          </motion.div>

          <div className="flex justify-end mb-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="show-expired" className="text-white">
                {showExpired ? 'Show Active' : 'Show Expired'}
              </Label>
              <Switch
                id="show-expired"
                checked={showExpired}
                onCheckedChange={handleToggleExpired}
              />
            </div>
          </div>

          <div className="mb-10 space-y-4 lg:space-y-0 lg:flex lg:flex-wrap lg:items-center lg:gap-4">
            <form onSubmit={handleSearch} className="w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search price-protections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full lg:w-64 bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </form>

            <form onSubmit={handleDateSearch} className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="startDate" className="text-white whitespace-nowrap">Start:</Label>
                <Input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="endDate" className="text-white whitespace-nowrap">End:</Label>
                <Input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <Button type="submit" className="w-full lg:w-auto bg-purple-600 hover:bg-purple-700 text-white  ">
                <Calendar className="w-4 h-4 mr-2" />
                Search by Date
              </Button>
            </form>
          </div>

          <div className="space-y-8">
            {filteredPps.length > 0 ? (
              filteredPps.map((pp) => (
                <Card key={pp.id} onClick={() => navigate(`/mobile/price-protection/${pp.id}`)} className="bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-lg lg:text-xl font-medium text-white flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-2 lg:space-y-0">
                      <span>{pp.phone_name}</span>
                      <span className="text-sm lg:text-base">
                        {format(new Date(pp.from_date), 'dd MMM yyyy')} - {format(new Date(pp.to_date), 'dd MMM yyyy')}
                      </span>
                      <span className={`text-sm px-2 py-1 rounded ${pp.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {pp.status}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {/* Add any additional content here if needed */}
                  </CardContent>
                  <CardFooter className="text-white pb-3 flex flex-col lg:flex-row justify-between items-center space-y-2 lg:space-y-0 px-3">
                    <span className="text-blue-400">Sold: {pp.sold}</span>
                    <Button
                      className="bg-purple-700 w-full lg:w-36 text-white"
                      onClick={(e) => handleEdit(e, pp.id)}
                    >
                      Edit
                    </Button>
                    <span className="text-green-400">Receivable: RS. {pp.receivable}</span>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="text-center text-white">No price protections found.</div>
            )}
          </div>
        </div>
        <Button
          className="fixed bottom-8 right-8 rounded-full w-14 h-14 lg:w-16 lg:h-16 shadow-lg bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => navigate(`/mobile/price-protection/branch/${branchId}/new`)}
        >
          <Plus className="w-6 h-6 lg:w-8 lg:h-8" />
        </Button>
      </div>
    </div>
  )
}