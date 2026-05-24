"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";  
import Sidebar from "@/components/sidebar"

export const description = "A bar chart with a label"
import useAxios from "@/utils/useAxios"
import { useEffect, useState } from "react"

const chartConfig = {
  Sales: {
    label: "Count",
    color: "rgba(255,255,255,0.3)",
  },
} 

export default function BarCh() {
  const api = useAxios()
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFiltered,setIsFiltered] = useState(false);

  
  const handleDateSearch = async (e) => {
    e.preventDefault();

    try {
      const response = await api.get(
        `alltransaction/barchart/?start_date=${startDate}&end_date=${endDate}`
      );
      setChartData(response.data);
    } catch (err) {
      setError("Failed to filter transactions by date");
    } finally {
      setIsFiltered(true);
    }
  };

  const [chartData, setChartData] = useState([])
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/alltransaction/barchart/")
        const data = response.data
        setChartData(data)
        console.log(chartData)
      } catch (error) {
        console.error("Error fetching chart data:", error)
      }
    }

    fetchData()
  }, [])

  const brandsSold = (chartData) => {
    let count = 0
    chartData.map((brand) => {
      if (brand.Sales > 0) {
        count++
      }
    })
    return count;
  }

  const highestSold = (chartData) => {
    chartData.sort((a, b) => b.Sales - a.Sales)
    return chartData[0]?.Brand
  }
  return (
    <div className="flex flex-col md:flex-row bg-gradient-to-br from-slate-900 to-slate-800">
      <Sidebar className="w-full md:w-64 md:min-h-screen" />
      <div className="lg:ml-64 flex flex-col items-center w-full justify-center p-4 md:p-6">
        <form
          onSubmit={handleDateSearch}
          className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 pb-7"
        >
          <div className="flex items-center space-x-2">
            <Label
              htmlFor="startDate"
              className="text-white whitespace-nowrap"
            >
              Start:
            </Label>
            <Input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="endDate" className="text-white whitespace-nowrap">
              End:
            </Label>
            <Input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-700 text-white border-gray-600 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
          <Button
            type="submit"
            className="w-full lg:w-auto bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Filter by Date
          </Button>
        </form>
        <Card className="bg-gradient-to-br w-full from-slate-900 to-slate-800 text-white">
          <CardHeader>
            {!isFiltered && <CardTitle className="text-center">Your Sales over the past month</CardTitle>}
            <CardDescription className="text-white text-center font-serif italic">Brand with Sales Count</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="w-full h-80 sm:h-80 lg:h-80" config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="Brand"
                    className="text-white"
                    // tickLine={false}
                    // tickMargin={10}
                    // axisLine={false}
                    // tickFormatter={(value) => value.slice(0, 6)}
                    // angle={-45}
                    // textAnchor="end"
                    // height={80}
                    // interval={0}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="Sales" fill="rgba(255,255,255,0.4)" radius={8}>
                    <LabelList
                      position="top"
                      offset={12}
                      className=""
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 font-medium leading-none">
              {brandsSold(chartData)} Brands sold {!isFiltered && <span> this month </span>} 
            </div>
            <div className="leading-none flex text-white text-muted-foreground">
              <span className="font-bold mr-1 text-green-400">{highestSold(chartData)}</span> was the top seller  <TrendingUp className="h-4 ml-2 w-4" />
            </div>
          </CardFooter>
        </Card>
      </div>  
    </div>
  )
}