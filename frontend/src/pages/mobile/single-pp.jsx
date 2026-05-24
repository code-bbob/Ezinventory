'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from 'lucide-react';
import useAxios from '@/utils/useAxios';
import Sidebar from '@/components/sidebar';
import { useParams, useNavigate } from 'react-router-dom';

export default function SinglePP() {
    const { branchId } = useParams();
    const api = useAxios();
    const [data, setData] = useState([]);
    const [phone, setPhone] = useState('');
    const [receivable, setReceivable] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExpired, setIsExpired] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();

    async function fetchData() {
        setLoading(true);
        try {
            const response = await api.get(`transaction/singlepp/${id}/`);
            setData(response.data.list);
            setPhone(response.data.phone);
            setReceivable(response.data.receivables);
            setIsExpired(response.data.status === "expired");
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusChange() {
        const newStatus = isExpired ? 'active' : 'expired';
        try {
            await api.patch(`transaction/pp/${id}/`, { status: newStatus });
            setIsExpired(newStatus === 'expired');
        } catch (error) {
            console.error('Failed to update status');
        }
    }

    useEffect(() => {
        fetchData();
    }, [id]);

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
        <div className="flex min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            <Sidebar className="hidden lg:block w-64 flex-shrink-0" />
            <div className="flex-grow p-8 lg:p-6 lg:ml-64 overflow-auto">
                <div className="max-w-3xl mx-auto">
                    <div className="flex justify-end mb-4">
                        <Button
                            onClick={() => navigate(-1)}
                            variant="outline"
                            className="px-4 py-2 text-black border-white hover:bg-gray-700 hover:text-white"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Brand Schemes
                        </Button>
                    </div>
                    <Card className="mb-6 mt-8 bg-gradient-to-b from-slate-800 to-slate-900 border-none shadow-lg">
                        <CardHeader className="border-b border-slate-700">
                            <CardTitle className="text-xl font-medium text-white flex justify-between items-center">
                                <span>{phone} Price Protection</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {data?.length > 0 ? (
                                data.map((da, index) => (
                                    <h1 key={index} className="flex items-center text-white mb-2 font-bold">
                                        <ArrowRight className="mr-2 h-4 w-4 flex-shrink-0" />
                                        <span className="break-words">{da}</span>
                                    </h1>
                                ))
                            ) : (
                                <div className="text-center text-white">No items found.</div>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                            <div className="text-green-300">
                                Receivable: RS. {receivable}
                            </div>
                            <Button
                                className={`${
                                    isExpired ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                                } text-white w-full sm:w-auto`}
                                onClick={handleStatusChange}
                            >
                                {isExpired ? 'Mark as Active' : 'Mark as Expired'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}