import useAxios from "@/utils/useAxios";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "@/components/sidebar";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const EditPhoneForm = () => {
  const { phoneId } = useParams();
  const api = useAxios();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false); // For loading state
  const [error, setError] = useState(null); // For error handling

  const fetchPhone = async () => {
    try {
      setLoading(true);
      const res = await api.get(`inventory/phone/${phoneId}/`);
      setFormData(res.data);
    } catch (err) {
      console.error("Error fetching phone", err);
      setError("Error fetching phone data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() =>{
    console.log(formData);
  }, [formData]); // Log formData whenever it changes

  useEffect(() => {
    fetchPhone();
  }, [phoneId]); // Make sure to call fetchPhone when phoneId changes

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.patch(`inventory/phone/${phoneId}/`, formData);
      console.log("Phone updated", res.data);
      navigate(-1); // Navigate to dashboard after successful update
    } catch (err) {
      console.error("Error updating phone", err);
      setError("Error updating phone.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar />
      <Button
        onClick={() => navigate(-1)}
        variant="outline"
        className="mb-4 w-48 md:ml-80 px-5 my-4 text-black border-white hover:bg-gray-700 hover:text-white"
      >
        <ArrowLeft className="mr-2 h-4 w-3" />
        Back to Dashboard
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6 mx-10 my-10 md:ml-80 p-5 bg-slate-800">
        {/* Display error message */}
        {error && <p className="text-red-500">{error}</p>}

        {/* Display loading spinner */}
        {loading && <p className="text-white">Loading...</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <Label htmlFor="name" className="text-lg font-medium text-white mb-2">
              Phone Name
            </Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData?.name || ""}
              onChange={handleChange}
              className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>

          {/* <div className="flex flex-col">
            <Label htmlFor="uid" className="text-lg font-medium text-white mb-2">
              Barcode Id
            </Label>
            <Input
              type="text"
              id="uid"
              name="uid"
              value={formData.uid || ""}
              onChange={handleChange}
              className="w-full bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div> */}

          <div className="flex flex-col">
            <Label htmlFor="cost_price" className="text-lg font-medium text-white mb-2">
              Cost Price
            </Label>
            <Input
              type="number"
              id="cost_price"
              name="cost_price"
              value={formData.cost_price || ""}
              onChange={handleChange}
              className="w-full bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>

          <div className="flex flex-col">
            <Label htmlFor="selling_price" className="text-lg font-medium text-white mb-2">
              Selling Price
            </Label>
            <Input
              type="number"
              id="selling_price"
              name="selling_price"
              value={formData.selling_price || ""}
              onChange={handleChange}
              className="w-full bg-slate-700 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full hover:bg-black" disabled={loading}>Submit</Button>
      </form>
    </div>
  );
};

export default EditPhoneForm;
