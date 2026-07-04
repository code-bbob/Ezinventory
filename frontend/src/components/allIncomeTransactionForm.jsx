"use client";

import React, { useState } from "react";
import useAxios from "@/utils/useAxios";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Sidebar from "@/components/allsidebar";
import { ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AllIncomeTransactionForm() {
  const { branchId } = useParams();
  const api = useAxios();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    branch: branchId,
        income_type: "",
    amount: "",
    method: "cash",
    desc: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubLoading(true);
      await api.post("alltransaction/income-transaction/", formData);
      navigate(`/income-transaction/branch/${branchId}`);
    } catch (err) {
      console.error("Error posting income transaction:", err);
      setError("Failed to submit income transaction. Please try again.");
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar className="hidden lg:block w-64 flex-shrink-0" />
      <div className="flex-grow p-4 lg:p-6 lg:ml-64 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <Button onClick={() => navigate("/")} variant="outline" className="mb-6 px-4 py-2 text-black border-white hover:bg-gray-700 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-white">Add Income Transaction</h2>
            {error && <p className="text-red-400 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <Label htmlFor="date" className="text-sm font-medium text-white mb-2">Date</Label>
                  <Input type="date" id="date" name="date" value={formData.date} onChange={handleChange} className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500" required />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="income_type" className="text-sm font-medium text-white mb-2">Income Type</Label>
                  <Input type="text" id="income_type" name="income_type" value={formData.income_type} onChange={handleChange} placeholder="e.g. Sale, Service, etc." className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500" required />
                </div>
              </div>

              <div className="flex flex-col">
                <Label htmlFor="amount" className="text-sm font-medium text-white mb-2">Amount</Label>
                <Input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500" required />
              </div>

              <div className="flex flex-col">
                <Label htmlFor="method" className="text-sm font-medium text-white mb-2">Method</Label>
                <Select name="method" value={formData.method} onValueChange={(v) => handleSelectChange("method", v)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 text-white">
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="fonepay">Fonepay</SelectItem>
                    <SelectItem value="esewa">Esewa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <Label htmlFor="desc" className="text-sm font-medium text-white mb-2">Description</Label>
                <Input type="text" id="desc" name="desc" value={formData.desc} onChange={handleChange} placeholder="What is this income for?" className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500" />
              </div>

              <Button type="submit" disabled={subLoading} className="w-full bg-green-600 hover:bg-green-700 text-white">Submit Income Transaction</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
