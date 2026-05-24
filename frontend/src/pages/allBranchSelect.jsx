"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft, Building } from 'lucide-react';
import { Input } from "@/components/ui/input";
import useAxios from '@/utils/useAxios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/allsidebar';

export default function AllBranchSelectionPage(pageName) {
  const page = pageName.pageName;
  const api = useAxios();
  const navigate = useNavigate();
  
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    const fetchBranches = async () => {
     try {
        const response = await api.get('enterprise/branch/')
        setBranches(response.data)
        setFilteredBranches(response.data)
        setLoading(false)
        response.data?.length === 1 && navigate(`/${page}/branch/${response.data[0]?.id}`)
      } catch (err) {
        console.error('Error fetching brands:', err)
        setError('Failed to load brands')
        setLoading(false)
      }
    };

    fetchBranches();
  }, []);

  useEffect(() => {
    if (branches.length > 0) {
      const results = branches.filter((branch) => 
        branch.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBranches(results);
    }
  }, [searchTerm, branches]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleBranchSelect = (branchId) => {
    // Navigate to the purchase form with the selected branch ID
    navigate(`/${page}/branch/${branchId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-10 lg:ml-64">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col space-y-4 mb-8"
        >
          <h1 className="text-xl sm:text-2xl lg:text-4xl text-center font-bold text-white">{`Select Branch for ${page.charAt(0).toUpperCase() + page.slice(1)}`} </h1>
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:space-x-4">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search branches..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 w-full bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <Button
              onClick={() => navigate("/mobile/")}
              variant="outline"
              className="w-full sm:w-auto px-5 text-black border-white hover:bg-gray-700 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-3" />
              Back to Dashboard
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.length > 0 ? (
            filteredBranches.map((branch) => (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.03 }}
                className="cursor-pointer"
                onClick={() => handleBranchSelect(branch.id)}
              >
                <Card className="bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg overflow-hidden h-full">
                  <CardContent className="p-6 flex flex-col h-full">                    <div className="flex items-center mb-4">
                      <Building className="h-8 w-8 text-purple-400 mr-3" />
                      <h2 className="text-xl font-bold text-white">{branch.name}</h2>
                    </div>
                    <div className="text-slate-300 text-sm mb-4">
                      <p>Branch ID: {branch.id}</p>
                      <p>Enterprise: {branch.enterprise_name }</p>
                    </div>
                    <div className="mt-auto">
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBranchSelect(branch.id);
                        }}
                      >
                        Select This Branch
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center text-white mt-8">
              No branches found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
