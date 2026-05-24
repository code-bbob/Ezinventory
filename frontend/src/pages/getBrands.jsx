import React, { useEffect, useState } from 'react';
import useAxios from '@/utils/useAxios';

const GetBrands = () => {
  const [brands, setBrands] = useState([]);
  const api = useAxios(); // Hook is used properly

  const fetchData = async () => {
    try {
      const response = await api.get('inventory/brand/');
      setBrands(response.data);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Will run on component mount

  return (
    <div>
      <h1>Hi</h1>
      <ul>
        {brands.map((brand, index) => (
          <li key={index}>{brand.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default GetBrands;
