import React, { useEffect, useState } from 'react';
import useAxios from '@/utils/useAxios';

const Homepage = () => {
  const [vendors, setVendors] = useState([]);
  const api = useAxios(); // Using hook directly in the component

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
  }, []); // Dependency array ensures it runs when `api` changes

  return (
    <div>
      <h1>Homepage</h1>
      <ul>
        {vendors.map((vendor, index) => (
          <li key={index}>{vendor.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default Homepage;
