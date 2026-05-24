import React, { useEffect, useState } from 'react';
import useAxios from '@/utils/useAxios';

const GetVendors = () => {
  const [vendors, setVendors] = useState([]);
  const api = useAxios(); // Hook is used properly

  const fetchData = async () => {
    try {
      const response = await api.get('transaction/vendor/');
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Will run on component mount

  return (
    <div>
      <h1>Hi</h1>
      <ul>
        {vendors.map((vendor, index) => (
          <li key={index}>{vendor.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default GetVendors;
