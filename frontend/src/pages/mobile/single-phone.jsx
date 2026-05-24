'use client';

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from 'lucide-react'
import useAxios from '@/utils/useAxios'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '@/components/sidebar'
import { Button } from "@/components/ui/button"

export default function SinglePhone() {
  const api = useAxios()
  const [data, setData] = useState([])
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const navigate = useNavigate()
  const { id } = useParams()

  async function fetchData() {
    setLoading(true)
    try {
      const response = await api.get(`inventory/phone/imeis/${id}/`)
      setData(response.data.list)
      setPhone(response.data.phone)
    } catch (err) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

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
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar />
      <div className="flex-1 p-4 lg:p-6 lg:ml-64">
      <div className="flex justify-end mb-4">
      <Button
        onClick={() => navigate(-1)}
        variant="outline"
        className="text-black border-white hover:bg-gray-700 hover:text-white"
      >
        Go Back
      </Button>
    </div>
        <div className="max-w-xl mx-auto">
          
          <Card className="w-full bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-xl font-medium text-white flex justify-between items-center">
                <span>{phone}</span>
                <Button onClick={() => navigate(`/mobile/inventory/edit-phone/${id}`)}>Edit</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {data?.length > 0 ? (
                data?.map((item, index) => (
                  <div key={index} className="flex items-center text-white mb-2">
                    <ArrowRight className="mr-2 flex-shrink-0" />
                    <span className="text-sm lg:text-base">{item}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-white">No items found.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}