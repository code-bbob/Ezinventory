'use client';

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Smartphone, ArrowLeft, Search, Plus } from 'lucide-react'
import useAxios from '@/utils/useAxios'
import Sidebar from '@/components/sidebar'

export default function SchemePageComponent() {
  const api = useAxios()
  const navigate = useNavigate()
  const [activeSchemes, setActiveSchemes] = useState([])
  const [expiredSchemes, setExpiredSchemes] = useState([])
  const [filteredSchemes, setFilteredSchemes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showExpired, setShowExpired] = useState(false)
  const { branchId } = useParams()

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const response = await api.get(`transaction/schemebrands/branch/${branchId}/`)
        setActiveSchemes(response.data.active_schemes)
        setExpiredSchemes(response.data.expired_schemes)
        setFilteredSchemes(response.data.active_schemes)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching schemes:', err)
        setError('Failed to load schemes')
        setLoading(false)
      }
    }

    fetchSchemes()
  }, [])

  useEffect(() => {
    const schemesToFilter = showExpired ? expiredSchemes : activeSchemes
    const results = schemesToFilter.filter(scheme =>
      scheme.brand.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredSchemes(results)
  }, [searchTerm, showExpired, activeSchemes, expiredSchemes])

  const handleSearch = (event) => {
    setSearchTerm(event.target.value)
  }

  const handleToggleExpired = () => {
    setShowExpired(!showExpired)
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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar className="hidden lg:block w-64 flex-shrink-0" />
      <div className="flex-grow pt-14 p-8 lg:p-6 lg:ml-64 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0 lg:space-x-4"
          >
            <h1 className="text-3xl lg:text-4xl text-center font-bold text-white">Scheme Brands</h1>

            <div className="flex flex-col justify-between sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search schemes..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 w-full bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="show-expired" className="text-white">
                  {showExpired ? 'Expired' : 'Active'}
                </Label>
                <Switch
                  id="show-expired"
                  checked={showExpired}
                  onCheckedChange={handleToggleExpired}
                />
              </div>

              <Button
                onClick={() => navigate('/mobile/')}
                variant="outline"
                className="w-full sm:w-auto text-black border-white hover:bg-gray-700 hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-3" />
                Back to Dashboard
              </Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemes.map((scheme) => (
              <SchemeCard
                key={scheme.id}
                scheme={scheme}
                onClick={() => navigate(`/mobile/schemes/branch/${branchId}/brand/${scheme.id}`)}
              />
            ))}
          </div>

          {filteredSchemes.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center text-white mt-8"
            >
              No schemes found matching your search.
            </motion.div>
          )}
        </div>

        <Button
          className="fixed bottom-8 right-8 rounded-full w-14 h-14 lg:w-16 lg:h-16 shadow-lg bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => navigate(`/mobile/schemes/branch/${branchId}/new`)}
        >
          <Plus className="w-6 h-6 lg:w-8 lg:h-8" />
        </Button>
      </div>
    </div>
  )
}

function SchemeCard({ scheme, onClick }) {
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
          <CardTitle className="text-xl font-medium text-slate-300 group-hover:text-white transition-colors duration-300">
            {scheme.brand}
          </CardTitle>
          <Smartphone className="h-6 w-6 text-purple-400" />
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-sm text-slate-400 group-hover:text-purple-200 transition-colors duration-300">
            Active Schemes: {scheme.count}
          </div>
          <div className="text-sm text-slate-400 group-hover:text-purple-200 transition-colors duration-300 mt-1">
            Total Receivables: Rs. {scheme.total_receivables}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}